import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params
    const body = await request.json()
    const { name, slug, description } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    const game = await prisma.game.findUnique({ where: { id: gameId } })
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    const existingSlug = await prisma.set.findUnique({ where: { slug } })
    if (existingSlug) {
      return NextResponse.json(
        { error: 'A set with this slug already exists' },
        { status: 409 }
      )
    }

    const set = await prisma.set.create({
      data: {
        gameId,
        name,
        slug,
        description,
      },
    })

    return NextResponse.json({ set }, { status: 201 })
  } catch (error) {
    console.error('Failed to create set:', error)
    return NextResponse.json(
      { error: 'Failed to create set' },
      { status: 500 }
    )
  }
}
