import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeRarity, normalizeType } from '@/lib/csv'
import { getStorage } from '@/lib/storage'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string; cardId: string }> }
) {
  try {
    const { setId, cardId } = await params
    const body = await request.json()

    const card = await prisma.card.findFirst({
      where: { id: cardId, setId },
    })

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}

    if (body.name !== undefined) {
      data.name = body.name
    }
    if (body.rarity !== undefined) {
      data.rarity = normalizeRarity(body.rarity)
    }
    if (body.cardType !== undefined) {
      data.cardType = normalizeType(body.cardType)
    }

    const updated = await prisma.card.update({
      where: { id: cardId },
      data,
    })

    return NextResponse.json({ card: updated })
  } catch (error) {
    console.error('Failed to update card:', error)
    return NextResponse.json(
      { error: 'Failed to update card' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string; cardId: string }> }
) {
  try {
    const { setId, cardId } = await params

    const card = await prisma.card.findFirst({
      where: { id: cardId, setId },
    })

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    const storage = getStorage()

    // Delete images from storage
    const keysToDelete = [
      `sets/${setId}/cards/${card.imageFilename}`,
    ]

    const baseName = card.imageFilename.replace(/\.[^.]+$/, '')
    keysToDelete.push(`sets/${setId}/cards/${baseName}_lg.jpg`)
    keysToDelete.push(`sets/${setId}/cards/${baseName}_sm.jpg`)

    await Promise.all(keysToDelete.map((key) => storage.delete(key)))

    // Delete card record (cascades votes, snapshots)
    await prisma.card.delete({ where: { id: cardId } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete card:', error)
    return NextResponse.json(
      { error: 'Failed to delete card' },
      { status: 500 }
    )
  }
}
