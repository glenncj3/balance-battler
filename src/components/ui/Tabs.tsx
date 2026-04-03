'use client'

import { cn } from '@/lib/cn'
import Link from 'next/link'

interface Tab {
  key: string
  label: string
  href: string
}

interface TabsProps {
  tabs: Tab[]
  activeKey: string
  className?: string
}

function Tabs({ tabs, activeKey, className }: TabsProps) {
  return (
    <nav
      className={cn(
        'flex gap-1 border-b border-border-default',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={cn(
              'relative px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg',
              isActive
                ? 'text-accent'
                : 'text-text-tertiary hover:text-text-primary hover:bg-bg-hover'
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

export { Tabs }
export type { TabsProps, Tab }
