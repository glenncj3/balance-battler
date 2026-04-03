import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { tokenizeType } from '@/lib/filters'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ setSlug: string }> }
) {
  try {
    const { setSlug } = await params

    const set = await prisma.set.findUnique({
      where: { slug: setSlug },
      include: {
        cards: {
          select: { rarity: true, cardType: true },
        },
      },
    })

    if (!set) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 })
    }

    // Compute unique rarities
    const raritySet = new Set<string>()
    const typeSet = new Set<string>()

    for (const card of set.cards) {
      raritySet.add(card.rarity)
      const tokens = tokenizeType(card.cardType)
      for (const token of tokens) {
        typeSet.add(token)
      }
    }

    const rarities = Array.from(raritySet).sort()
    const types = Array.from(typeSet).sort()

    return NextResponse.json({
      setId: set.id,
      setName: set.name,
      votingOpen: set.votingOpen,
      defaultShowMetadata: set.defaultShowMetadata,
      whyTagsEnabled: set.whyTagsEnabled,
      whyTagLabels: set.whyTagLabels,
      voterLimit: set.voterLimit,
      rarities,
      types,
    })
  } catch (error) {
    console.error('Failed to get vote config:', error)
    return NextResponse.json(
      { error: 'Failed to get vote config' },
      { status: 500 }
    )
  }
}
