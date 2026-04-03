import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateElo } from '@/lib/elo'
import type { DbCard, DbSet, DbVoterSession } from '@/types/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ setSlug: string }> }
) {
  try {
    const { setSlug } = await params
    const body = await request.json()
    const { cardAId, cardBId, winnerId, decisionTimeMs, whyTag } = body

    if (!cardAId || !cardBId || !winnerId) {
      return NextResponse.json(
        { error: 'cardAId, cardBId, and winnerId are required' },
        { status: 400 }
      )
    }

    if (winnerId !== cardAId && winnerId !== cardBId) {
      return NextResponse.json(
        { error: 'winnerId must be either cardAId or cardBId' },
        { status: 400 }
      )
    }

    const sessionId = request.cookies.get('voter_session_id')?.value
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No voter session' },
        { status: 401 }
      )
    }

    const session: DbVoterSession | null = await prisma.voterSession.findUnique({
      where: { id: sessionId },
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

    if (!set.votingOpen) {
      return NextResponse.json(
        { error: 'Voting is closed for this set' },
        { status: 403 }
      )
    }

    if (session.setId !== set.id) {
      return NextResponse.json(
        { error: 'Session does not match this set' },
        { status: 403 }
      )
    }

    // Check voter limit
    if (set.voterLimit !== null && session.votesCast >= set.voterLimit) {
      return NextResponse.json(
        { error: 'Voter limit reached for this session' },
        { status: 429 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      // Read both cards
      const cardA: DbCard | null = await tx.card.findUnique({ where: { id: cardAId } })
      const cardB: DbCard | null = await tx.card.findUnique({ where: { id: cardBId } })

      if (!cardA || !cardB) {
        throw new Error('One or both cards not found')
      }

      if (cardA.setId !== set.id || cardB.setId !== set.id) {
        throw new Error('Cards do not belong to this set')
      }

      // Calculate new Elo ratings
      const eloResult = calculateElo({
        ratingA: cardA.eloRating,
        ratingB: cardB.eloRating,
        comparisonsA: cardA.comparisonCount,
        comparisonsB: cardB.comparisonCount,
        wasImportedA: cardA.importedRating !== null,
        wasImportedB: cardB.importedRating !== null,
        winner: winnerId === cardAId ? 'a' : 'b',
      })

      // Create vote record with pre-elo values
      const vote = await tx.vote.create({
        data: {
          setId: set.id,
          cardAId,
          cardBId,
          winnerId,
          voterSessionId: sessionId,
          decisionTimeMs: decisionTimeMs ?? null,
          cardAPreElo: cardA.eloRating,
          cardBPreElo: cardB.eloRating,
          whyTag: whyTag ?? null,
        },
      })

      // Create rating snapshots
      await tx.cardRatingSnapshot.createMany({
        data: [
          {
            cardId: cardAId,
            voteId: vote.id,
            eloRating: eloResult.newRatingA,
          },
          {
            cardId: cardBId,
            voteId: vote.id,
            eloRating: eloResult.newRatingB,
          },
        ],
      })

      // Update card A
      await tx.card.update({
        where: { id: cardAId },
        data: {
          eloRating: eloResult.newRatingA,
          comparisonCount: { increment: 1 },
          ...(winnerId === cardAId ? { winCount: { increment: 1 } } : {}),
        },
      })

      // Update card B
      await tx.card.update({
        where: { id: cardBId },
        data: {
          eloRating: eloResult.newRatingB,
          comparisonCount: { increment: 1 },
          ...(winnerId === cardBId ? { winCount: { increment: 1 } } : {}),
        },
      })

      // Update session
      await tx.voterSession.update({
        where: { id: sessionId },
        data: {
          votesCast: { increment: 1 },
          lastActive: new Date(),
        },
      })

      return {
        vote: { id: vote.id },
        cardA: { eloRating: eloResult.newRatingA },
        cardB: { eloRating: eloResult.newRatingB },
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to submit vote:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to submit vote'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
