import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { GameDetailClient } from './GameDetailClient'

export const dynamic = 'force-dynamic'

interface GamePageProps {
  params: Promise<{ gameId: string }>
}

export default async function GamePage({ params }: GamePageProps) {
  const { gameId } = await params

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      sets: {
        include: {
          _count: {
            select: {
              cards: true,
              votes: { where: { undone: false } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!game) {
    notFound()
  }

  const gameData = {
    id: game.id,
    name: game.name,
    slug: game.slug,
    description: game.description,
    createdAt: game.createdAt.toISOString(),
    sets: game.sets.map((s) => ({
      id: s.id,
      gameId: s.gameId,
      name: s.name,
      slug: s.slug,
      cardCount: s._count.cards,
      voteCount: s._count.votes,
      votingOpen: s.votingOpen,
      createdAt: s.createdAt.toISOString(),
    })),
  }

  return <GameDetailClient game={gameData} />
}
