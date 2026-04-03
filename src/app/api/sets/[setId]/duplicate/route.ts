import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params
    const body = await request.json()
    const { name, slug, copyRatings } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    const sourceSet = await prisma.set.findUnique({
      where: { id: setId },
      include: { cards: true },
    })

    if (!sourceSet) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 })
    }

    const existingSlug = await prisma.set.findUnique({ where: { slug } })
    if (existingSlug) {
      return NextResponse.json(
        { error: 'A set with this slug already exists' },
        { status: 409 }
      )
    }

    const newSet = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.set.create({
        data: {
          gameId: sourceSet.gameId,
          name,
          slug,
          description: sourceSet.description,
          votingOpen: sourceSet.votingOpen,
          defaultShowMetadata: sourceSet.defaultShowMetadata,
          minVoteThreshold: sourceSet.minVoteThreshold,
          balanceZoneSd: sourceSet.balanceZoneSd,
          voterLimit: sourceSet.voterLimit,
          whyTagsEnabled: sourceSet.whyTagsEnabled,
          whyTagLabels: sourceSet.whyTagLabels,
        },
      })

      if (sourceSet.cards.length > 0) {
        type SourceCard = typeof sourceSet.cards[number]
        const cardData = sourceSet.cards.map((card: SourceCard) => ({
          id: randomUUID(),
          setId: created.id,
          name: card.name,
          rarity: card.rarity,
          cardType: card.cardType,
          imageFilename: card.imageFilename,
          imageUrl: card.imageUrl,
          thumbnailLg: card.thumbnailLg,
          thumbnailSm: card.thumbnailSm,
          eloRating: copyRatings
            ? card.eloRating
            : (card.importedRating ?? 1500),
          importedRating: card.importedRating,
          comparisonCount: 0,
          winCount: 0,
        }))

        await tx.card.createMany({ data: cardData })
      }

      return created
    })

    return NextResponse.json({ set: newSet }, { status: 201 })
  } catch (error) {
    console.error('Failed to duplicate set:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate set' },
      { status: 500 }
    )
  }
}
