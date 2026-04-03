import { prisma } from '@/lib/prisma'
import { DashboardPageClient } from './DashboardPageClient'
import { DatabaseError } from '@/components/DatabaseError'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  try {
    const games = await prisma.game.findMany({
      include: {
        _count: {
          select: { sets: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const gameData = games.map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      description: g.description,
      setCount: g._count.sets,
      createdAt: g.createdAt.toISOString(),
    }))

    return <DashboardPageClient games={gameData} />
  } catch {
    return <DatabaseError />
  }
}
