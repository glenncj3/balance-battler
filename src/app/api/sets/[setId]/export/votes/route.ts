import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Papa from 'papaparse'
import type { DbSet } from '@/types/db'

interface VoteWithCards {
  id: string
  decisionTimeMs: number | null
  whyTag: string | null
  createdAt: Date
  cardA: { name: string }
  cardB: { name: string }
  winner: { name: string } | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params
    const { searchParams } = request.nextUrl
    const includeUndone = searchParams.get('includeUndone') === 'true'

    const set: DbSet | null = await prisma.set.findUnique({ where: { id: setId } })
    if (!set) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 })
    }

    const where: Record<string, unknown> = { setId }
    if (!includeUndone) {
      where.undone = false
    }

    const votes: VoteWithCards[] = await prisma.vote.findMany({
      where,
      include: {
        cardA: { select: { name: true } },
        cardB: { select: { name: true } },
        winner: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    const rows = votes.map((vote) => ({
      vote_id: vote.id,
      card_a_name: vote.cardA.name,
      card_b_name: vote.cardB.name,
      winner_name: vote.winner?.name ?? 'skip',
      decision_time_ms: vote.decisionTimeMs ?? '',
      why_tag: vote.whyTag ?? '',
      created_at: vote.createdAt.toISOString(),
    }))

    const csv = Papa.unparse(rows)
    const filename = `${set.slug}-votes.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Failed to export votes:', error)
    return NextResponse.json(
      { error: 'Failed to export votes' },
      { status: 500 }
    )
  }
}
