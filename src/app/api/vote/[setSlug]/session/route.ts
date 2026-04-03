import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ setSlug: string }> }
) {
  try {
    const { setSlug } = await params
    const body = await request.json()
    const { rarityFilter = [], typeFilter = [], showMetadata = false } = body

    const set = await prisma.set.findUnique({
      where: { slug: setSlug },
    })

    if (!set) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 })
    }

    if (!set.votingOpen) {
      return NextResponse.json(
        { error: 'Voting is closed for this set' },
        { status: 403 }
      )
    }

    const session = await prisma.voterSession.create({
      data: {
        setId: set.id,
        rarityFilter,
        typeFilter,
        showMetadata,
      },
    })

    const response = NextResponse.json(
      { sessionId: session.id },
      { status: 201 }
    )

    // Set session cookie
    response.cookies.set('voter_session_id', session.id, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Failed to create voter session:', error)
    return NextResponse.json(
      { error: 'Failed to create voter session' },
      { status: 500 }
    )
  }
}
