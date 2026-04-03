import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        sets: {
          select: {
            id: true,
            name: true,
            slug: true,
            votingOpen: true,
            _count: {
              select: {
                cards: true,
                votes: true,
              },
            },
          },
        },
      },
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    const result = {
      id: game.id,
      name: game.name,
      slug: game.slug,
      description: game.description,
      createdAt: game.createdAt.toISOString(),
      updatedAt: game.updatedAt.toISOString(),
      sets: game.sets.map((set: { id: string; name: string; slug: string; votingOpen: boolean; _count: { cards: number; votes: number } }) => ({
        id: set.id,
        name: set.name,
        slug: set.slug,
        votingOpen: set.votingOpen,
        cardCount: set._count.cards,
        voteCount: set._count.votes,
      })),
    }

    return NextResponse.json({ game: result })
  } catch (error) {
    console.error('Failed to get game:', error)
    return NextResponse.json(
      { error: 'Failed to get game' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params
    const body = await request.json()
    const { name, slug, description } = body

    const existing = await prisma.game.findUnique({ where: { id: gameId } })
    if (!existing) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    if (slug && slug !== existing.slug) {
      const slugTaken = await prisma.game.findUnique({ where: { slug } })
      if (slugTaken) {
        return NextResponse.json(
          { error: 'A game with this slug already exists' },
          { status: 409 }
        )
      }
    }

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (slug !== undefined) data.slug = slug
    if (description !== undefined) data.description = description

    const game = await prisma.game.update({
      where: { id: gameId },
      data,
    })

    return NextResponse.json({ game })
  } catch (error) {
    console.error('Failed to update game:', error)
    return NextResponse.json(
      { error: 'Failed to update game' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params

    const existing = await prisma.game.findUnique({ where: { id: gameId } })
    if (!existing) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    await prisma.game.delete({ where: { id: gameId } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete game:', error)
    return NextResponse.json(
      { error: 'Failed to delete game' },
      { status: 500 }
    )
  }
}
