'use client'

import { cn } from '@/lib/cn'
import { Button } from './Button'

interface EmptyStateProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-16 px-4 text-center',
        className
      )}
    >
      {/* Empty illustration */}
      <svg
        className="h-16 w-16 text-text-tertiary"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
        />
      </svg>

      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-medium text-text-primary">{title}</h3>
        {description && (
          <p className="text-sm text-text-tertiary max-w-md">{description}</p>
        )}
      </div>

      {action && (
        <Button variant="secondary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

export { EmptyState }
export type { EmptyStateProps }
