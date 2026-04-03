'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { formatNumber, formatPercentage } from '@/lib/format'
import { CardThumbnail } from '@/components/cards/CardThumbnail'
import { RarityBadge } from '@/components/cards/RarityBadge'
import { Lightbox } from '@/components/ui/Lightbox'
import { RatingBar } from './RatingBar'
import { ConfidenceBadge } from './ConfidenceBadge'

type SortDir = 'asc' | 'desc'

interface LeaderboardCardRow {
  id: string
  rank: number
  name: string
  rarity: string
  cardType: string
  imageUrl: string
  thumbnailLgUrl: string
  eloRating: number
  comparisonCount: number
  winCount: number
  winRate: number
  confidence: 'low' | 'medium' | 'high'
  balanceZone?: 'overpowered' | 'balanced' | 'underpowered'
}

interface LeaderboardTableProps {
  cards: LeaderboardCardRow[]
  sortBy: string
  sortDir: SortDir
  onSort: (key: string, dir: SortDir) => void
  compact?: boolean
}

const zoneRowBg: Record<string, string> = {
  overpowered: 'bg-zone-op/10',
  balanced: 'bg-zone-balanced/10',
  underpowered: 'bg-zone-up/10',
}

interface ColumnDef {
  key: string
  label: string
  sortable: boolean
  className?: string
}

const columns: ColumnDef[] = [
  { key: 'rank', label: '#', sortable: false, className: 'w-12 text-center' },
  { key: 'thumbnail', label: '', sortable: false, className: 'w-16' },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'rarity', label: 'Rarity', sortable: false },
  { key: 'cardType', label: 'Type', sortable: false },
  { key: 'eloRating', label: 'Rating', sortable: true, className: 'w-48' },
  { key: 'confidence', label: 'Confidence', sortable: false },
  { key: 'comparisonCount', label: 'Comparisons', sortable: true, className: 'text-right' },
  { key: 'winRate', label: 'Win Rate', sortable: true, className: 'text-right' },
]

function LeaderboardTable({
  cards,
  sortBy,
  sortDir,
  onSort,
  compact = false,
}: LeaderboardTableProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  const ratingValues = cards.map((c) => c.eloRating)
  const minRating = ratingValues.length > 0 ? Math.min(...ratingValues) : 1000
  const maxRating = ratingValues.length > 0 ? Math.max(...ratingValues) : 2000

  function handleSort(key: string) {
    const newDir: SortDir = sortBy === key && sortDir === 'asc' ? 'desc' : 'asc'
    onSort(key, newDir)
  }

  if (cards.length === 0) {
    return (
      <div className="py-12 text-center text-text-tertiary">
        No cards match your filters.
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border-default">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default bg-bg-tertiary">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-3 py-3 text-left font-medium text-text-secondary',
                    col.sortable && 'cursor-pointer select-none hover:text-text-primary',
                    col.className
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortBy === col.key && (
                      <svg
                        className={cn(
                          'h-3.5 w-3.5 transition-transform',
                          sortDir === 'desc' && 'rotate-180'
                        )}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cards.map((card, index) => (
              <tr
                key={card.id}
                className={cn(
                  'border-b border-border-default transition-colors last:border-b-0',
                  card.balanceZone ? zoneRowBg[card.balanceZone] : 'hover:bg-bg-hover'
                )}
              >
                {/* Rank */}
                <td className="px-3 py-2 text-center font-mono text-text-secondary">
                  {card.rank}
                </td>

                {/* Thumbnail */}
                <td className="px-3 py-2">
                  <CardThumbnail
                    src={card.thumbnailLgUrl}
                    alt={card.name}
                    size="sm"
                    onClick={() => setLightboxSrc(card.imageUrl)}
                  />
                </td>

                {/* Name */}
                <td className="px-3 py-2 font-medium text-text-primary">
                  {card.name}
                </td>

                {/* Rarity */}
                <td className="px-3 py-2">
                  <RarityBadge rarity={card.rarity} />
                </td>

                {/* Type */}
                <td className="px-3 py-2 text-text-secondary">
                  {card.cardType}
                </td>

                {/* Rating + bar */}
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-text-primary">
                      {Math.round(card.eloRating)}
                    </span>
                    <RatingBar
                      rating={card.eloRating}
                      min={minRating}
                      max={maxRating}
                    />
                  </div>
                </td>

                {/* Confidence */}
                <td className="px-3 py-2">
                  <ConfidenceBadge level={card.confidence} />
                </td>

                {/* Comparisons */}
                <td className="px-3 py-2 text-right font-mono text-text-secondary">
                  {formatNumber(card.comparisonCount)}
                </td>

                {/* Win Rate */}
                <td className="px-3 py-2 text-right font-mono text-text-secondary">
                  {formatPercentage(card.winRate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {lightboxSrc && (
        <Lightbox
          src={lightboxSrc}
          alt="Card image"
          open
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </>
  )
}

export { LeaderboardTable }
export type { LeaderboardTableProps, LeaderboardCardRow }
