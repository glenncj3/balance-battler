'use client'

import Link from 'next/link'
import { cn } from '@/lib/cn'

interface SetTabNavProps {
  gameId: string
  setId: string
  activeTab: string
}

const tabs = [
  { key: 'leaderboard', label: 'Leaderboard' },
  { key: 'upload', label: 'Upload' },
  { key: 'manage', label: 'Manage' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'settings', label: 'Settings' },
]

export function SetTabNav({ gameId, setId, activeTab }: SetTabNavProps) {
  return (
    <nav className="flex items-center gap-1 border-b border-border-default overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key
        const href = tab.key === 'leaderboard'
          ? `/dashboard/games/${gameId}/sets/${setId}`
          : `/dashboard/games/${gameId}/sets/${setId}/${tab.key}`

        return (
          <Link
            key={tab.key}
            href={href}
            className={cn(
              'relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors',
              isActive
                ? 'text-accent-text'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {tab.label}
            {isActive && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-accent rounded-full" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}

export type { SetTabNavProps }
