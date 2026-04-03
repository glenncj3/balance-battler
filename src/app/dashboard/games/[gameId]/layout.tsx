import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'

export const dynamic = 'force-dynamic'

interface GameLayoutProps {
  children: React.ReactNode
  params: Promise<{ gameId: string }>
}

export default async function GameLayout({ children, params }: GameLayoutProps) {
  const { gameId } = await params

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { id: true, name: true },
  })

  if (!game) {
    notFound()
  }

  return (
    <div>
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: game.name },
          ]}
        />
      </div>
      {children}
    </div>
  )
}
