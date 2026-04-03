import { cn } from '@/lib/cn'
import { CardThumbnail } from './CardThumbnail'
import { RarityBadge } from './RarityBadge'
import type { CardPreviewData } from './types'

type MatchStatus = 'matched' | 'unmatched-image' | 'default'

interface CardPreviewProps {
  card: CardPreviewData
  matchStatus: MatchStatus
}

const statusConfig: Record<MatchStatus, { color: string; label: string }> = {
  matched: { color: 'bg-success', label: 'Matched' },
  'unmatched-image': { color: 'bg-warning', label: 'Unmatched image' },
  default: { color: 'bg-warning', label: 'Pending' },
}

export function CardPreview({ card, matchStatus }: CardPreviewProps) {
  const status = statusConfig[matchStatus]

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border-default bg-bg-secondary p-3 shadow-card">
      <CardThumbnail src={card.imageUrl} alt={card.name} size="sm" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-text-primary truncate">
            {card.name}
          </p>
          {/* Status dot */}
          <span className="flex items-center gap-1.5 shrink-0">
            <span
              className={cn('inline-block h-2 w-2 rounded-full', status.color)}
            />
            <span className="text-[10px] text-text-tertiary">{status.label}</span>
          </span>
        </div>

        <div className="mt-1 flex items-center gap-2">
          <RarityBadge rarity={card.rarity} size="sm" />
          <span className="text-xs text-text-secondary">{card.cardType}</span>
        </div>

        {card.eloRating !== undefined && (
          <p className="mt-1 text-xs text-text-tertiary font-mono">
            {Math.round(card.eloRating)} ELO
          </p>
        )}
      </div>
    </div>
  )
}

export type { CardPreviewProps, MatchStatus }
