import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { DbVote, DbSet } from '@/types/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ setSlug: string }> }
) {
  try {
    const { setSlug } = await params
    const body = await request.json()
    const { voteId } = body

    if (!voteId) {
      return NextResponse.json(
        { error: 'voteId is required' },
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

    const set: DbSet | null = await prisma.set.findUnique({
      where: { slug: setSlug },
    })

    if (!set) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 })
    }

    // Validate vote belongs to this session
    const vote: DbVote | null = await prisma.vote.findUnique({
      where: { id: voteId },
    })

    if (!vote) {
      return NextResponse.json({ error: 'Vote not found' }, { status: 404 })
    }

    if (vote.voterSessionId !== sessionId) {
      return NextResponse.json(
        { error: 'Vote does not belong to this session' },
        { status: 403 }
      )
    }

    if (vote.undone) {
      return NextResponse.json(
        { error: 'Vote is already undone' },
        { status: 400 }
      )
    }

    // Check this is the most recent non-undone vote in the session
    const mostRecent: DbVote | null = await prisma.vote.findFirst({
      where: {
        voterSessionId: sessionId,
        undone: false,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!mostRecent || mostRecent.id !== voteId) {
      return NextResponse.json(
        { error: 'Can only undo the most recent vote' },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      // Mark vote as undone
      await tx.vote.update({
        where: { id: voteId },
        data: { undone: true },
      })

      // Restore both cards' elo ratings from pre-vote values
      await tx.card.update({
        where: { id: vote.cardAId },
        data: {
          eloRating: vote.cardAPreElo,
          comparisonCount: { decrement: 1 },
          ...(vote.winnerId === vote.cardAId
            ? { winCount: { decrement: 1 } }
            : {}),
        },
      })

      await tx.card.update({
        where: { id: vote.cardBId },
        data: {
          eloRating: vote.cardBPreElo,
          comparisonCount: { decrement: 1 },
          ...(vote.winnerId === vote.cardBId
            ? { winCount: { decrement: 1 } }
            : {}),
        },
      })

      // Decrement session vote count
      await tx.voterSession.update({
        where: { id: sessionId },
        data: {
          votesCast: { decrement: 1 },
        },
      })
    })

    return NextResponse.json({ undone: true })
  } catch (error) {
    console.error('Failed to undo vote:', error)
    return NextResponse.json(
      { error: 'Failed to undo vote' },
      { status: 500 }
    )
  }
}
