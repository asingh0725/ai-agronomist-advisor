export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateRecommendation, inputToPromptInput } from '@/lib/ai/services/recommendation'
import { isValidationFailure } from '@/lib/validations/recommendation'

const generateSchema = z.object({
  inputId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = generateSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid request', details: validated.error.flatten() }, { status: 400 })
    }

    // Fetch the input and verify ownership
    const input = await prisma.input.findUnique({
      where: { id: validated.data.inputId },
    })

    if (!input) {
      return NextResponse.json({ error: 'Input not found' }, { status: 404 })
    }

    if (input.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if recommendation already exists
    const existingRecommendation = await prisma.recommendation.findUnique({
      where: { inputId: input.id },
    })

    if (existingRecommendation) {
      return NextResponse.json(existingRecommendation)
    }

    // Generate recommendation
    const promptInput = inputToPromptInput({
      ...input,
      labData: input.labData as Record<string, any> | null,
    })
    const result = await generateRecommendation(promptInput)

    if (!result.success || !result.response) {
      return NextResponse.json({
        error: 'Failed to generate recommendation',
        details: result.error
      }, { status: 500 })
    }

    // Handle validation failure from AI
    if (isValidationFailure(result.response)) {
      return NextResponse.json({
        error: 'Input validation failed',
        validationIssues: result.response.validation.issues,
      }, { status: 422 })
    }

    // Save successful recommendation to database
    const recommendation = await prisma.recommendation.create({
      data: {
        userId: user.id,
        inputId: input.id,
        diagnosis: result.response.diagnosis,
        confidence: result.response.diagnosis.primaryCondition.confidence,
        modelUsed: result.model || 'claude-sonnet-4-20250514',
        tokensUsed: (result.usage?.inputTokens || 0) + (result.usage?.outputTokens || 0),
      },
    })

    // Return full response including AI output
    return NextResponse.json({
      id: recommendation.id,
      inputId: recommendation.inputId,
      diagnosis: result.response.diagnosis,
      recommendations: result.response.recommendations,
      confidenceExplanation: result.response.confidenceExplanation,
      additionalNotes: result.response.additionalNotes,
      disclaimers: result.response.disclaimers,
      validation: result.response.validation,
      modelUsed: recommendation.modelUsed,
      tokensUsed: recommendation.tokensUsed,
      createdAt: recommendation.createdAt,
    }, { status: 201 })

  } catch (error) {
    console.error('Generate recommendation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
