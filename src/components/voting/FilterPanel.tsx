'use client'

import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { CheckboxGroup } from '@/components/ui/CheckboxGroup'

interface FilterPanelProps {
  rarities: string[]
  types: string[]
  selectedRarities: string[]
  selectedTypes: string[]
  showMetadata: boolean
  defaultShowMetadata: boolean
  onRaritiesChange: (selected: string[]) => void
  onTypesChange: (selected: string[]) => void
  onMetadataToggle: (show: boolean) => void
  onStartVoting: () => void
}

function FilterPanel({
  rarities,
  types,
  selectedRarities,
  selectedTypes,
  showMetadata,
  defaultShowMetadata,
  onRaritiesChange,
  onTypesChange,
  onMetadataToggle,
  onStartVoting,
}: FilterPanelProps) {
  const hasFilters = rarities.length > 0 || types.length > 0
  const canStart =
    (rarities.length === 0 || selectedRarities.length > 0) &&
    (types.length === 0 || selectedTypes.length > 0)

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div
        className={cn(
          'rounded-xl border border-border-default bg-bg-secondary p-6',
          'flex flex-col gap-6'
        )}
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-text-primary">
            Configure Your Session
          </h2>
          <p className="text-sm text-text-secondary">
            Choose which cards to compare, then start voting.
          </p>
        </div>

        {rarities.length > 0 && (
          <CheckboxGroup
            label="Rarity"
            options={rarities.map((r) => ({ value: r, label: r }))}
            selected={selectedRarities}
            onChange={onRaritiesChange}
          />
        )}

        {types.length > 0 && (
          <CheckboxGroup
            label="Type"
            options={types.map((t) => ({ value: t, label: t }))}
            selected={selectedTypes}
            onChange={onTypesChange}
          />
        )}

        {/* Metadata toggle */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text-secondary">
              Show card info during voting
            </span>
            <span className="text-xs text-text-tertiary">
              Display name, rarity, and type below each card
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showMetadata}
            onClick={() => onMetadataToggle(!showMetadata)}
            className={cn(
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-1 focus:ring-offset-transparent',
              showMetadata ? 'bg-accent' : 'bg-bg-tertiary border border-border-default'
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                showMetadata ? 'translate-x-5' : 'translate-x-0.5',
                'mt-0.5'
              )}
            />
          </button>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={onStartVoting}
        disabled={!canStart}
        className="w-full"
      >
        Start Voting
      </Button>

      {!canStart && hasFilters && (
        <p className="text-center text-xs text-text-tertiary">
          Select at least one option in each category to begin.
        </p>
      )}
    </div>
  )
}

export { FilterPanel }
export type { FilterPanelProps }
