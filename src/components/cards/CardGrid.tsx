'use client'

import { cn } from '@/lib/cn'
import { CardGridItem } from './CardGridItem'
import type { CardItem } from './types'

interface CardGridProps {
  cards: CardItem[]
  selectable?: boolean
  selectedIds?: Set<string>
  onSelect?: (ids: Set<string>) => void
  onCardClick?: (card: CardItem) => void
  emptyMessage?: string
}

export function CardGrid({
  cards,
  selectable = false,
  selectedIds = new Set(),
  onSelect,
  onCardClick,
  emptyMessage = 'No cards found.',
}: CardGridProps) {
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
        <svg
          className="mb-3 h-10 w-10 text-text-tertiary"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M9 9h.01M15 9h.01M9 15h6" />
        </svg>
        <p className="text-sm">{emptyMessage}</p>
      </div>
    )
  }

  function handleSelect(cardId: string, checked: boolean) {
    if (!onSelect) return
    const next = new Set(selectedIds)
    if (checked) {
      next.add(cardId)
    } else {
      next.delete(cardId)
    }
    onSelect(next)
  }

  return (
    <div
      className={cn(
        'grid gap-3',
        'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
      )}
    >
      {cards.map((card) => (
        <CardGridItem
          key={card.id}
          card={card}
          selected={selectedIds.has(card.id)}
          onSelect={
            selectable ? (checked) => handleSelect(card.id, checked) : undefined
          }
          onClick={onCardClick}
          showMetadata
        />
      ))}
    </div>
  )
}

export type { CardGridProps }
