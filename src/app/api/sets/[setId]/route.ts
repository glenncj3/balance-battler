import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params

    const set = await prisma.set.findUnique({
      where: { id: setId },
      include: {
        game: { select: { name: true, slug: true } },
        _count: { select: { cards: true, votes: true } },
      },
    })

    if (!set) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 })
    }

    const uniqueVoters = await prisma.voterSession.count({
      where: { setId },
    })

    const { _count, game, ...setData } = set

    return NextResponse.json({
      set: {
        ...setData,
        createdAt: set.createdAt.toISOString(),
        updatedAt: set.updatedAt.toISOString(),
        gameName: game.name,
        gameSlug: game.slug,
        stats: {
          cardCount: _count.cards,
          totalVotes: _count.votes,
          uniqueVoters,
        },
      },
    })
  } catch (error) {
    console.error('Failed to get set:', error)
    return NextResponse.json(
      { error: 'Failed to get set' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params
    const body = await request.json()

    const existing = await prisma.set.findUnique({ where: { id: setId } })
    if (!existing) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 })
    }

    if (body.slug && body.slug !== existing.slug) {
      const slugTaken = await prisma.set.findUnique({
        where: { slug: body.slug },
      })
      if (slugTaken) {
        return NextResponse.json(
          { error: 'A set with this slug already exists' },
          { status: 409 }
        )
      }
    }

    const allowedFields = [
      'votingOpen',
      'defaultShowMetadata',
      'minVoteThreshold',
      'balanceZoneSd',
      'voterLimit',
      'whyTagsEnabled',
      'whyTagLabels',
      'name',
      'slug',
      'description',
    ] as const

    const data: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field]
      }
    }

    const set = await prisma.set.update({
      where: { id: setId },
      data,
    })

    return NextResponse.json({ set })
  } catch (error) {
    console.error('Failed to update set:', error)
    return NextResponse.json(
      { error: 'Failed to update set' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params

    const existing = await prisma.set.findUnique({ where: { id: setId } })
    if (!existing) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 })
    }

    await prisma.set.delete({ where: { id: setId } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete set:', error)
    return NextResponse.json(
      { error: 'Failed to delete set' },
      { status: 500 }
    )
  }
}
