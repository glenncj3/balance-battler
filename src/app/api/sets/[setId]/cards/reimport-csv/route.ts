import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseCsv, normalizeRarity, normalizeType } from '@/lib/csv'
import type { DbCard } from '@/types/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params

    const set = await prisma.set.findUnique({ where: { id: setId } })
    if (!set) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const csvFile = formData.get('csv')

    if (!csvFile || !(csvFile instanceof File) || csvFile.size === 0) {
      return NextResponse.json(
        { error: 'CSV file is required' },
        { status: 400 }
      )
    }

    const csvText = await csvFile.text()
    const parsed = parseCsv(csvText)

    if (parsed.errors.length > 0) {
      return NextResponse.json(
        { error: 'CSV parse errors', errors: parsed.errors },
        { status: 400 }
      )
    }

    // Get all existing cards in the set
    const existingCards: DbCard[] = await prisma.card.findMany({
      where: { setId },
    })

    const cardsByFilename = new Map<string, DbCard>(
      existingCards.map((c) => [c.imageFilename, c])
    )

    let updated = 0
    const notFound: string[] = []

    for (const row of parsed.rows) {
      const card = cardsByFilename.get(row.image)
      if (!card) {
        notFound.push(row.image)
        continue
      }

      await prisma.card.update({
        where: { id: card.id },
        data: {
          name: row.name,
          rarity: normalizeRarity(row.rarity),
          cardType: normalizeType(row.type),
        },
      })

      updated++
    }

    return NextResponse.json({ updated, notFound })
  } catch (error) {
    console.error('Failed to reimport CSV:', error)
    return NextResponse.json(
      { error: 'Failed to reimport CSV' },
      { status: 500 }
    )
  }
}
