'use client'

import { cn } from '@/lib/cn'

interface ConfidenceBadgeProps {
  level: 'low' | 'medium' | 'high'
  className?: string
}

const levelConfig: Record<
  ConfidenceBadgeProps['level'],
  { dotClass: string; textClass: string; label: string }
> = {
  low: {
    dotClass: 'bg-confidence-low',
    textClass: 'text-confidence-low',
    label: 'Low',
  },
  medium: {
    dotClass: 'bg-confidence-medium',
    textClass: 'text-confidence-medium',
    label: 'Medium',
  },
  high: {
    dotClass: 'bg-confidence-high',
    textClass: 'text-confidence-high',
    label: 'High',
  },
}

function ConfidenceBadge({ level, className }: ConfidenceBadgeProps) {
  const config = levelConfig[level]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium',
        config.textClass,
        className
      )}
    >
      <span className={cn('inline-block h-2 w-2 rounded-full', config.dotClass)} />
      {config.label}
    </span>
  )
}

export { ConfidenceBadge }
export type { ConfidenceBadgeProps }
