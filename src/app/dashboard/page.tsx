import { prisma } from '@/lib/prisma'
import { DashboardPageClient } from './DashboardPageClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  let gameData: {
    id: string
    name: string
    slug: string
    description: string | null
    setCount: number
    createdAt: string
  }[] = []
  let dbConnected = true

  try {
    const games = await prisma.game.findMany({
      include: {
        _count: {
          select: { sets: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    gameData = games.map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      description: g.description,
      setCount: g._count.sets,
      createdAt: g.createdAt.toISOString(),
    }))
  } catch {
    dbConnected = false
  }

  return <DashboardPageClient games={gameData} dbConnected={dbConnected} />
}
