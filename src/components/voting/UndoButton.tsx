'use client'

import { cn } from '@/lib/cn'

interface UndoButtonProps {
  visible: boolean
  onUndo: () => void
  timeRemaining: number
}

function UndoButton({ visible, onUndo, timeRemaining }: UndoButtonProps) {
  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 z-40 -translate-x-1/2',
        'transition-all duration-300 ease-in-out',
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-4 opacity-0'
      )}
    >
      <button
        onClick={onUndo}
        className={cn(
          'flex items-center gap-2 rounded-full',
          'bg-bg-tertiary border border-border-default px-4 py-2',
          'text-sm font-medium text-text-primary',
          'shadow-lg hover:bg-bg-hover transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-border-focus'
        )}
      >
        <svg
          className="h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M7.793 2.232a.75.75 0 01-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 010 10.75H10.75a.75.75 0 010-1.5h2.875a3.875 3.875 0 000-7.75H3.622l4.146 3.957a.75.75 0 01-1.036 1.085l-5.5-5.25a.75.75 0 010-1.085l5.5-5.25a.75.75 0 011.06.025z"
            clipRule="evenodd"
          />
        </svg>
        <span>Undo</span>
        <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-xs tabular-nums text-accent">
          {timeRemaining}
        </span>
      </button>
    </div>
  )
}

export { UndoButton }
export type { UndoButtonProps }
