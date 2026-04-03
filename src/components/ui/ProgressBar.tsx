'use client'

import { cn } from '@/lib/cn'

interface ProgressBarProps {
  value: number
  max: number
  color?: string
  className?: string
}

function ProgressBar({
  value,
  max,
  color = 'bg-accent',
  className,
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0

  return (
    <div
      className={cn(
        'h-2.5 w-full overflow-hidden rounded-full bg-bg-tertiary',
        className
      )}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-500 ease-out', color)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

export { ProgressBar }
export type { ProgressBarProps }
