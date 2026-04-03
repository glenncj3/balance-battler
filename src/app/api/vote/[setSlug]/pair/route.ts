import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cardMatchesRarityFilter, cardMatchesTypeFilter } from '@/lib/filters'
import { selectPair, pairKey } from '@/lib/pairs'
import type { CandidateCard } from '@/lib/pairs'
import type { DbCard, DbSet, DbVoterSession } from '@/types/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ setSlug: string }> }
) {
  try {
    const { setSlug } = await params

    const sessionId = request.cookies.get('voter_session_id')?.value
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No voter session. Please start a session first.' },
        { status: 401 }
      )
    }

    const session: (DbVoterSession & { set: DbSet }) | null =
      await prisma.voterSession.findUnique({
        where: { id: sessionId },
        include: {
          set: true,
        },
      })

    if (!session) {
      return NextResponse.json(
        { error: 'Voter session not found' },
        { status: 404 }
      )
    }

    const set: DbSet | null = await prisma.set.findUnique({
      where: { slug: setSlug },
    })

    if (!set) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 })
    }

    if (session.setId !== set.id) {
      return NextResponse.json(
        { error: 'Session does not match this set' },
        { status: 403 }
      )
    }

    // Get all cards in set
    const allCards: DbCard[] = await prisma.card.findMany({
      where: { setId: set.id },
    })

    // Apply filters from session
    const filteredCards = allCards.filter(
      (card) =>
        cardMatchesRarityFilter(card.rarity, session.rarityFilter) &&
        cardMatchesTypeFilter(card.cardType, session.typeFilter)
    )

    if (filteredCards.length < 2) {
      return NextResponse.json({ exhausted: true })
    }

    // Get seen pairs (non-undone votes from this session)
    const votes: Array<{ cardAId: string; cardBId: string }> =
      await prisma.vote.findMany({
        where: {
          voterSessionId: sessionId,
          undone: false,
        },
        select: {
          cardAId: true,
          cardBId: true,
        },
      })

    const seenPairs = new Set<string>()
    for (const vote of votes) {
      seenPairs.add(pairKey(vote.cardAId, vote.cardBId))
    }

    // Get last 6 cards shown (from recent votes)
    const recentVotes: Array<{ cardAId: string; cardBId: string }> =
      await prisma.vote.findMany({
        where: {
          voterSessionId: sessionId,
          undone: false,
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          cardAId: true,
          cardBId: true,
        },
      })

    const recentCardIds: string[] = []
    for (const v of recentVotes) {
      recentCardIds.push(v.cardAId, v.cardBId)
    }

    // Build candidate pool
    const pool: CandidateCard[] = filteredCards.map((c) => ({
      id: c.id,
      eloRating: c.eloRating,
      comparisonCount: c.comparisonCount,
    }))

    const pair = selectPair({ pool, seenPairs, recentCardIds })

    if (!pair) {
      return NextResponse.json({ exhausted: true })
    }

    // Look up full card data
    const cardA = allCards.find((c) => c.id === pair.cardA.id)!
    const cardB = allCards.find((c) => c.id === pair.cardB.id)!

    const buildCardResponse = (card: DbCard) => {
      const base: Record<string, unknown> = {
        id: card.id,
        imageUrl: card.imageUrl,
        thumbnailLg: card.thumbnailLg,
      }

      if (session.showMetadata) {
        base.name = card.name
        base.rarity = card.rarity
        base.cardType = card.cardType
      }

      return base
    }

    return NextResponse.json({
      cardA: buildCardResponse(cardA),
      cardB: buildCardResponse(cardB),
    })
  } catch (error) {
    console.error('Failed to get pair:', error)
    return NextResponse.json(
      { error: 'Failed to get pair' },
      { status: 500 }
    )
  }
}
