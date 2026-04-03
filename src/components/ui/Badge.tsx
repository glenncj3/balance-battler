'use client'

import { cn } from '@/lib/cn'
import { ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-bg-tertiary text-text-secondary border-border-default',
  success: 'bg-green-900/30 text-success border-green-800/50',
  warning: 'bg-yellow-900/30 text-warning border-yellow-800/50',
  error: 'bg-red-900/30 text-error border-red-800/50',
  info: 'bg-blue-900/30 text-info border-blue-800/50',
}

function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export { Badge }
export type { BadgeProps, BadgeVariant }
