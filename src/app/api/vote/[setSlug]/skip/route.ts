import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { DbCard, DbSet, DbVoterSession } from '@/types/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ setSlug: string }> }
) {
  try {
    const { setSlug } = await params
    const body = await request.json()
    const { cardAId, cardBId, decisionTimeMs } = body

    if (!cardAId || !cardBId) {
      return NextResponse.json(
        { error: 'cardAId and cardBId are required' },
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

    if (session.setId !== set.id) {
      return NextResponse.json(
        { error: 'Session does not match this set' },
        { status: 403 }
      )
    }

    // Get current elo ratings for the pre-elo fields
    const [cardA, cardB]: [DbCard | null, DbCard | null] = await Promise.all([
      prisma.card.findUnique({ where: { id: cardAId } }),
      prisma.card.findUnique({ where: { id: cardBId } }),
    ])

    if (!cardA || !cardB) {
      return NextResponse.json(
        { error: 'One or both cards not found' },
        { status: 404 }
      )
    }

    // Create skip vote (winnerId = null, no Elo changes)
    const vote = await prisma.vote.create({
      data: {
        setId: set.id,
        cardAId,
        cardBId,
        winnerId: null,
        voterSessionId: sessionId,
        decisionTimeMs: decisionTimeMs ?? null,
        cardAPreElo: cardA.eloRating,
        cardBPreElo: cardB.eloRating,
      },
    })

    return NextResponse.json({ vote: { id: vote.id } })
  } catch (error) {
    console.error('Failed to skip pair:', error)
    return NextResponse.json(
      { error: 'Failed to skip pair' },
      { status: 500 }
    )
  }
}
