'use client'

import { usePathname } from 'next/navigation'
import { SetTabNav } from '@/components/layout/SetTabNav'

interface SetTabNavWrapperProps {
  gameId: string
  setId: string
}

export function SetTabNavWrapper({ gameId, setId }: SetTabNavWrapperProps) {
  const pathname = usePathname()

  // Determine active tab from the current pathname
  const basePath = `/dashboard/games/${gameId}/sets/${setId}`
  let activeTab = 'leaderboard'

  if (pathname.endsWith('/upload')) activeTab = 'upload'
  else if (pathname.endsWith('/manage')) activeTab = 'manage'
  else if (pathname.endsWith('/analytics')) activeTab = 'analytics'
  else if (pathname.endsWith('/settings')) activeTab = 'settings'

  return <SetTabNav gameId={gameId} setId={setId} activeTab={activeTab} />
}
