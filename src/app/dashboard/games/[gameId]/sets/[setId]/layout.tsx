import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { SetTabNavWrapper } from './SetTabNavWrapper'

export const dynamic = 'force-dynamic'

interface SetLayoutProps {
  children: React.ReactNode
  params: Promise<{ gameId: string; setId: string }>
}

export default async function SetLayout({ children, params }: SetLayoutProps) {
  const { gameId, setId } = await params

  const set = await prisma.set.findUnique({
    where: { id: setId },
    select: {
      id: true,
      name: true,
      gameId: true,
      game: {
        select: { id: true, name: true },
      },
    },
  })

  if (!set || set.gameId !== gameId) {
    notFound()
  }

  return (
    <div>
      <div className="mb-4">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: set.game.name, href: `/dashboard/games/${gameId}` },
            { label: set.name },
          ]}
        />
      </div>
      <h1 className="text-xl font-bold text-text-primary mb-4">{set.name}</h1>
      <SetTabNavWrapper gameId={gameId} setId={setId} />
      <div className="mt-6">{children}</div>
    </div>
  )
}
