import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateExportCsv } from '@/lib/csv'
import type { DbCard } from '@/types/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params

    const set = await prisma.set.findUnique({ where: { id: setId } })
    if (!set) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 })
    }

    const cards: DbCard[] = await prisma.card.findMany({
      where: { setId },
      orderBy: { name: 'asc' },
    })

    const exportCards = cards.map((card) => ({
      name: card.name,
      rarity: card.rarity,
      type: card.cardType,
      image: card.imageFilename,
      rating: card.eloRating,
    }))

    const csv = generateExportCsv(exportCards)
    const filename = `${(set as { slug: string }).slug}-cards.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Failed to export CSV:', error)
    return NextResponse.json(
      { error: 'Failed to export CSV' },
      { status: 500 }
    )
  }
}
