import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateFullExportCsv } from '@/lib/csv'
import { getConfidence } from '@/lib/elo'
import type { DbCard, DbSet } from '@/types/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params
    const { searchParams } = request.nextUrl
    const format = searchParams.get('format') || 'csv'

    const set: DbSet | null = await prisma.set.findUnique({ where: { id: setId } })
    if (!set) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 })
    }

    const cards: DbCard[] = await prisma.card.findMany({
      where: { setId },
      orderBy: { eloRating: 'desc' },
    })

    const fullCards = cards.map((card) => ({
      name: card.name,
      rarity: card.rarity,
      type: card.cardType,
      image: card.imageFilename,
      rating: card.eloRating,
      comparisonCount: card.comparisonCount,
      winCount: card.winCount,
      winRate:
        card.comparisonCount > 0
          ? Math.round((card.winCount / card.comparisonCount) * 1000) / 1000
          : 0,
      confidence: getConfidence(card.comparisonCount),
    }))

    if (format === 'json') {
      return NextResponse.json(fullCards)
    }

    const csv = generateFullExportCsv(fullCards)
    const filename = `${set.slug}-full-export.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Failed to export full data:', error)
    return NextResponse.json(
      { error: 'Failed to export full data' },
      { status: 500 }
    )
  }
}
