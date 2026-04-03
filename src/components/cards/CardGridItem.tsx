'use client'

import { cn } from '@/lib/cn'
import { CardThumbnail } from './CardThumbnail'
import { RarityBadge } from './RarityBadge'
import type { CardItem } from './types'

interface CardGridItemProps {
  card: CardItem
  selected?: boolean
  onSelect?: (selected: boolean) => void
  onClick?: (card: CardItem) => void
  showMetadata?: boolean
}

export function CardGridItem({
  card,
  selected = false,
  onSelect,
  onClick,
  showMetadata = true,
}: CardGridItemProps) {
  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-xl border bg-bg-secondary p-2 transition-all duration-200',
        selected
          ? 'border-accent shadow-card-hover ring-1 ring-accent'
          : 'border-border-default shadow-card hover:shadow-card-hover hover:border-border-strong'
      )}
    >
      {/* Selection checkbox */}
      {onSelect && (
        <label className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(e.target.checked)}
            className="sr-only"
          />
          <div
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded border-2 transition-colors cursor-pointer',
              selected
                ? 'border-accent bg-accent'
                : 'border-border-strong bg-bg-tertiary/80 opacity-0 group-hover:opacity-100'
            )}
          >
            {selected && (
              <svg
                className="h-3 w-3 text-white"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </label>
      )}

      {/* Thumbnail */}
      <CardThumbnail
        src={card.thumbnailLg || card.thumbnailSm || card.imageUrl}
        alt={card.name}
        size="sm"
        onClick={onClick ? () => onClick(card) : undefined}
        className="w-full max-w-none"
      />

      {/* Metadata */}
      {showMetadata && (
        <div className="mt-2 flex flex-col gap-1 px-0.5">
          <p className="text-sm font-medium text-text-primary truncate">
            {card.name}
          </p>
          <div className="flex items-center gap-1.5">
            <RarityBadge rarity={card.rarity} size="sm" />
            <span className="text-[10px] text-text-tertiary truncate">
              {card.cardType}
            </span>
          </div>
          {card.eloRating !== undefined && (
            <p className="text-xs text-text-secondary font-mono">
              {Math.round(card.eloRating)} ELO
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export type { CardGridItemProps }
