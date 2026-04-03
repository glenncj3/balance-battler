'use client'

import { cn } from '@/lib/cn'

type SkeletonVariant = 'text' | 'rect' | 'circle'

interface SkeletonProps {
  className?: string
  variant?: SkeletonVariant
}

const variantStyles: Record<SkeletonVariant, string> = {
  text: 'h-4 w-full rounded',
  rect: 'h-24 w-full rounded-lg',
  circle: 'h-12 w-12 rounded-full',
}

function Skeleton({ className, variant = 'text' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-bg-tertiary',
        variantStyles[variant],
        className
      )}
    />
  )
}

export { Skeleton }
export type { SkeletonProps, SkeletonVariant }
