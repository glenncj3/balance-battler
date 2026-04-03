import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DEFAULT_RATING } from '@/lib/elo'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string; cardId: string }> }
) {
  try {
    const { setId, cardId } = await params

    const card = await prisma.card.findFirst({
      where: { id: cardId, setId },
    })

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    const resetRating = card.importedRating ?? DEFAULT_RATING

    const updated = await prisma.card.update({
      where: { id: cardId },
      data: {
        eloRating: resetRating,
        comparisonCount: 0,
        winCount: 0,
      },
    })

    return NextResponse.json({ card: updated })
  } catch (error) {
    console.error('Failed to reset card:', error)
    return NextResponse.json(
      { error: 'Failed to reset card' },
      { status: 500 }
    )
  }
}
