import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { sets: true },
        },
      },
    })

    const result = games.map((game: typeof games[number]) => ({
      id: game.id,
      name: game.name,
      slug: game.slug,
      description: game.description,
      createdAt: game.createdAt.toISOString(),
      updatedAt: game.updatedAt.toISOString(),
      setCount: game._count.sets,
    }))

    return NextResponse.json({ games: result })
  } catch (error) {
    console.error('Failed to list games:', error)
    return NextResponse.json(
      { error: 'Failed to list games' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug, description } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    const existing = await prisma.game.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        { error: 'A game with this slug already exists' },
        { status: 409 }
      )
    }

    const game = await prisma.game.create({
      data: { name, slug, description },
    })

    return NextResponse.json({ game }, { status: 201 })
  } catch (error) {
    console.error('Failed to create game:', error)
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    )
  }
}
