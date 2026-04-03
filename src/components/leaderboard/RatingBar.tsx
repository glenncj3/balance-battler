'use client'

import { cn } from '@/lib/cn'

interface RatingBarProps {
  rating: number
  min: number
  max: number
  className?: string
}

function ratingToColor(pct: number): string {
  // Blue (low) -> Green (mid) -> Red (high)
  if (pct < 0.5) {
    // Blue to Green
    const t = pct * 2
    const r = Math.round(59 * t)
    const g = Math.round(130 + 69 * t)
    const b = Math.round(246 - 150 * t)
    return `rgb(${r}, ${g}, ${b})`
  }
  // Green to Red
  const t = (pct - 0.5) * 2
  const r = Math.round(59 + 189 * t)
  const g = Math.round(199 - 128 * t)
  const b = Math.round(96 - 72 * t)
  return `rgb(${r}, ${g}, ${b})`
}

function RatingBar({ rating, min, max, className }: RatingBarProps) {
  const range = max - min
  const pct = range > 0 ? Math.min(1, Math.max(0, (rating - min) / range)) : 0.5

  return (
    <div
      className={cn('h-2 w-20 overflow-hidden rounded-full bg-bg-tertiary', className)}
      title={`${rating}`}
    >
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${pct * 100}%`,
          backgroundColor: ratingToColor(pct),
        }}
      />
    </div>
  )
}

export { RatingBar }
export type { RatingBarProps }
