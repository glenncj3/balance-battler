'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { VoteCard } from './VoteCard'
import { SkipButton } from './SkipButton'
import { Modal } from '@/components/ui/Modal'
import type { VoteCard as VoteCardType } from '@/types'

interface VotingPairProps {
  cardA: VoteCardType
  cardB: VoteCardType
  showMetadata: boolean
  onVote: (winnerId: string) => void
  onSkip: () => void
  isTransitioning: boolean
}

function VotingPair({
  cardA,
  cardB,
  showMetadata,
  onVote,
  onSkip,
  isTransitioning,
}: VotingPairProps) {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)

  return (
    <>
      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            'grid w-full grid-cols-1 items-start gap-4 md:grid-cols-[1fr_auto_1fr]',
            'transition-opacity duration-200 ease-in-out',
            isTransitioning ? 'opacity-0' : 'opacity-100'
          )}
        >
          {/* Card A */}
          <div className="flex justify-center md:justify-end">
            <VoteCard
              card={cardA}
              side="left"
              showMetadata={showMetadata}
              onVote={() => onVote(cardA.id)}
              onZoom={() => setZoomedImage(cardA.imageUrl)}
            />
          </div>

          {/* VS divider */}
          <div className="flex items-center justify-center self-center py-2 md:py-0">
            <span
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full',
                'bg-bg-tertiary border border-border-default',
                'text-sm font-bold text-text-tertiary',
                'select-none'
              )}
            >
              VS
            </span>
          </div>

          {/* Card B */}
          <div className="flex justify-center md:justify-start">
            <VoteCard
              card={cardB}
              side="right"
              showMetadata={showMetadata}
              onVote={() => onVote(cardB.id)}
              onZoom={() => setZoomedImage(cardB.imageUrl)}
            />
          </div>
        </div>

        {/* Skip button */}
        <div
          className={cn(
            'transition-opacity duration-200 ease-in-out',
            isTransitioning ? 'opacity-0' : 'opacity-100'
          )}
        >
          <SkipButton onSkip={onSkip} />
        </div>
      </div>

      {/* Lightbox modal for zoomed card */}
      <Modal
        open={zoomedImage !== null}
        onClose={() => setZoomedImage(null)}
        size="lg"
      >
        {zoomedImage && (
          <div className="flex items-center justify-center">
            <img
              src={zoomedImage}
              alt="Zoomed card"
              className="max-h-[80vh] w-auto rounded-lg object-contain"
            />
          </div>
        )}
      </Modal>
    </>
  )
}

export { VotingPair }
export type { VotingPairProps }
