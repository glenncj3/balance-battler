'use client'

import { cn } from '@/lib/cn'
import { useEffect, useRef } from 'react'
import { CardThumbnail } from './CardThumbnail'
import { RarityBadge } from './RarityBadge'
import type { CardDetail } from '@/types'

interface CardDetailModalProps {
  card: CardDetail | null
  open: boolean
  onClose: () => void
}

export function CardDetailModal({ card, open, onClose }: CardDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open || !card) return null

  const winRate =
    card.comparisonCount > 0
      ? Math.round((card.winCount / card.comparisonCount) * 100)
      : 0

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />

      {/* Modal */}
      <div
        className={cn(
          'relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto',
          'rounded-xl border border-border-default bg-bg-secondary shadow-modal'
        )}
        role="dialog"
        aria-modal="true"
        aria-label={`Card details: ${card.name}`}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 rounded-lg p-1.5 text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
          aria-label="Close"
        >
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>

        <div className="flex flex-col sm:flex-row gap-6 p-6">
          {/* Card image */}
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            <CardThumbnail
              src={card.thumbnailLgUrl || card.imageUrl}
              alt={card.name}
              size="lg"
            />
          </div>

          {/* Card info */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Title */}
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                {card.name}
              </h2>
              <div className="mt-1.5 flex items-center gap-2">
                <RarityBadge rarity={card.rarity} size="md" />
                <span className="text-sm text-text-secondary">
                  {card.cardType}
                </span>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatBlock label="Elo Rating" value={Math.round(card.eloRating).toString()} />
              <StatBlock label="Rank" value={`#${card.rank}`} />
              <StatBlock label="Comparisons" value={card.comparisonCount.toString()} />
              <StatBlock label="Win Rate" value={`${winRate}%`} />
              <StatBlock label="Wins" value={card.winCount.toString()} />
              <StatBlock
                label="Confidence"
                value={card.confidence}
                valueClassName={cn(
                  card.confidence === 'low' && 'text-confidence-low',
                  card.confidence === 'medium' && 'text-confidence-medium',
                  card.confidence === 'high' && 'text-confidence-high'
                )}
              />
            </div>

            {/* Recent comparisons */}
            {card.recentComparisons && card.recentComparisons.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-text-secondary">
                  Recent Comparisons
                </h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {card.recentComparisons.map((comp) => (
                    <div
                      key={comp.id}
                      className="flex items-center justify-between rounded-lg bg-bg-tertiary px-3 py-2 text-sm"
                    >
                      <span className="text-text-primary truncate flex-1">
                        vs {comp.opponentName}
                      </span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span
                          className={cn(
                            'text-xs font-mono',
                            comp.ratingChange >= 0
                              ? 'text-success'
                              : 'text-error'
                          )}
                        >
                          {comp.ratingChange >= 0 ? '+' : ''}
                          {Math.round(comp.ratingChange)}
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-medium',
                            comp.won
                              ? 'bg-success/20 text-success'
                              : 'bg-error/20 text-error'
                          )}
                        >
                          {comp.won ? 'W' : 'L'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatBlock({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="rounded-lg bg-bg-tertiary px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-text-tertiary">
        {label}
      </p>
      <p
        className={cn(
          'mt-0.5 text-lg font-semibold text-text-primary capitalize',
          valueClassName
        )}
      >
        {value}
      </p>
    </div>
  )
}

export type { CardDetailModalProps }
