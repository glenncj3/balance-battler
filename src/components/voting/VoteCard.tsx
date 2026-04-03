'use client'

import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/Badge'
import type { VoteCard as VoteCardType } from '@/types'

interface VoteCardProps {
  card: VoteCardType
  side: 'left' | 'right'
  showMetadata: boolean
  onVote: () => void
  onZoom: () => void
}

function VoteCard({ card, side, showMetadata, onVote, onZoom }: VoteCardProps) {
  const keyHint = side === 'left' ? '1' : '2'

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        {/* Keyboard hint badge */}
        <div
          className={cn(
            'absolute top-2 z-10 hidden md:flex',
            side === 'left' ? 'left-2' : 'right-2',
            'h-6 w-6 items-center justify-center rounded-md',
            'bg-black/60 text-xs font-semibold text-white/70',
            'backdrop-blur-sm'
          )}
        >
          {keyHint}
        </div>

        {/* Zoom button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onZoom()
          }}
          className={cn(
            'absolute top-2 z-10',
            side === 'left' ? 'right-2' : 'left-2',
            'flex h-7 w-7 items-center justify-center rounded-md',
            'bg-black/60 text-white/70 backdrop-blur-sm',
            'opacity-0 transition-opacity group-hover:opacity-100',
            'hover:bg-black/80 hover:text-white',
            'focus:outline-none focus:ring-2 focus:ring-border-focus focus:opacity-100'
          )}
          aria-label="Zoom card"
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" />
            <path d="M9 5.75a.75.75 0 01.75.75v1.75h1.75a.75.75 0 010 1.5h-1.75v1.75a.75.75 0 01-1.5 0V9.75H6.5a.75.75 0 010-1.5h1.75V6.5A.75.75 0 019 5.75z" />
          </svg>
        </button>

        {/* Card image - clickable to vote */}
        <button
          type="button"
          onClick={onVote}
          className={cn(
            'block overflow-hidden rounded-lg',
            'border-2 border-transparent',
            'transition-all duration-200 ease-out',
            'hover:scale-[1.03] hover:border-accent hover:shadow-[0_0_20px_rgba(var(--color-accent-rgb,99,102,241),0.3)]',
            'focus:outline-none focus:ring-2 focus:ring-border-focus focus:scale-[1.03]',
            'active:scale-[1.01]',
            'cursor-pointer'
          )}
          aria-label={
            card.name
              ? `Vote for ${card.name}`
              : `Vote for ${side} card`
          }
        >
          <img
            src={card.thumbnailLg}
            alt={card.name ?? `${side === 'left' ? 'Left' : 'Right'} card`}
            className="h-auto w-full max-w-[400px] object-contain"
            loading="eager"
            draggable={false}
          />
        </button>
      </div>

      {/* Card metadata */}
      {showMetadata && (card.name || card.rarity || card.cardType) && (
        <div className="flex flex-col items-center gap-1 text-center">
          {card.name && (
            <span className="text-sm font-medium text-text-primary">
              {card.name}
            </span>
          )}
          <div className="flex items-center gap-2">
            {card.rarity && <Badge>{card.rarity}</Badge>}
            {card.cardType && (
              <span className="text-xs text-text-tertiary">
                {card.cardType}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export { VoteCard }
export type { VoteCardProps }
