export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First try to find by recommendation ID
    let recommendation = await prisma.recommendation.findUnique({
      where: { id: params.id },
      include: {
        input: true,
      },
    })

    // If not found, try to find by input ID
    if (!recommendation) {
      recommendation = await prisma.recommendation.findUnique({
        where: { inputId: params.id },
        include: {
          input: true,
        },
      })
    }

    if (!recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 })
    }

    if (recommendation.input.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(recommendation)
  } catch (error) {
    console.error('Get recommendation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
