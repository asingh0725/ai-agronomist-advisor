import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { searchTextChunks, searchImageChunks } from '@/lib/retrieval/search'
import { assembleContext } from '@/lib/retrieval/context-assembly'
import { generateWithRetry, ValidationError } from '@/lib/validation/retry'
import { CLAUDE_MODEL } from '@/lib/ai/claude'

const createInputSchema = z.object({
  type: z.enum(['PHOTO', 'LAB_REPORT']),
  imageUrl: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  labData: z.record(z.string(), z.any()).optional().nullable(),
  location: z.string().optional().nullable(),
  crop: z.string().optional().nullable(),
  season: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createInputSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid input', details: validated.error.flatten() }, { status: 400 })
    }

    const input = await prisma.input.create({
      data: {
        userId: user.id,
        type: validated.data.type,
        imageUrl: validated.data.imageUrl ?? undefined,
        description: validated.data.description ?? undefined,
        labData: validated.data.labData ?? undefined,
        location: validated.data.location ?? undefined,
        crop: validated.data.crop ?? undefined,
        season: validated.data.season ?? undefined,
      }
    })

    // Generate recommendation immediately after creating input
    const query = buildQuery(input)
    const textResults = await searchTextChunks(query, 5)
    const imageResults = await searchImageChunks(query, 3)
    const context = await assembleContext(textResults, imageResults)

    if (context.totalChunks === 0) {
      return NextResponse.json(
        {
          error: 'No relevant knowledge found',
          details: 'Unable to find context for this input',
          inputId: input.id
        },
        { status: 422 }
      )
    }

    // Normalize input for agent
    const normalizedInput = {
      type: input.type,
      description: input.description || undefined,
      labData: input.labData || undefined,
      imageUrl: input.imageUrl || undefined,
      crop: input.crop ?? (input.labData as Record<string, unknown>)?.crop as string ?? undefined,
      location: input.location || undefined,
    }

    // Generate recommendation with retry logic
    const recommendation = await generateWithRetry(normalizedInput, context)

    // Store recommendation in database
    const savedRecommendation = await prisma.recommendation.create({
      data: {
        userId: user.id,
        inputId: input.id,
        diagnosis: recommendation as object,
        confidence: recommendation.confidence,
        modelUsed: CLAUDE_MODEL,
      },
    })

    // Store source links
    await Promise.all(
      recommendation.sources.map(async (source) => {
        const [textChunk, imageChunk] = await Promise.all([
          prisma.textChunk.findUnique({
            where: { id: source.chunkId },
            select: { id: true },
          }),
          prisma.imageChunk.findUnique({
            where: { id: source.chunkId },
            select: { id: true },
          }),
        ])

        return prisma.recommendationSource.create({
          data: {
            recommendationId: savedRecommendation.id,
            textChunkId: textChunk ? source.chunkId : null,
            imageChunkId: imageChunk ? source.chunkId : null,
            relevanceScore: source.relevance,
          },
        })
      })
    )

    return NextResponse.json({
      input,
      recommendationId: savedRecommendation.id,
    }, { status: 201 })
  } catch (error) {
    console.error('Create input error:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          error: 'Recommendation validation failed',
          details: error.details,
        },
        { status: 422 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Build search query from input
 */
function buildQuery(input: {
  description?: string | null
  labData?: unknown
  crop?: string | null
}): string {
  const parts: string[] = []

  if (input.description) {
    parts.push(input.description)
  }

  if (input.crop) {
    parts.push(`Crop: ${input.crop}`)
  }

  if (input.labData && typeof input.labData === 'object') {
    const labData = input.labData as Record<string, unknown>
    if (labData.crop) parts.push(`Crop: ${labData.crop}`)
    if (labData.symptoms) parts.push(`Symptoms: ${labData.symptoms}`)
    if (labData.soilPh) parts.push(`pH: ${labData.soilPh}`)
  }

  return parts.join('. ')
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const inputs = await prisma.input.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        recommendations: {
          select: { id: true }
        }
      }
    })

    return NextResponse.json(inputs)
  } catch (error) {
    console.error('Get inputs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
