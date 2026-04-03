'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { CheckboxGroup } from '@/components/ui/CheckboxGroup'
import { SearchInput } from '@/components/ui/SearchInput'

type ViewMode = 'full' | 'rarity-breakdown' | 'type-breakdown'

interface LeaderboardToolbarProps {
  rarities: string[]
  types: string[]
  selectedRarities: string[]
  onRaritiesChange: (selected: string[]) => void
  selectedTypes: string[]
  onTypesChange: (selected: string[]) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onExport: (format: 'csv' | 'full-csv' | 'json') => void
}

const viewModeButtons: { mode: ViewMode; label: string }[] = [
  { mode: 'full', label: 'Full' },
  { mode: 'rarity-breakdown', label: 'By Rarity' },
  { mode: 'type-breakdown', label: 'By Type' },
]

function LeaderboardToolbar({
  rarities,
  types,
  selectedRarities,
  onRaritiesChange,
  selectedTypes,
  onTypesChange,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onExport,
}: LeaderboardToolbarProps) {
  const [exportOpen, setExportOpen] = useState(false)

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-default bg-bg-secondary p-4">
      {/* Top row: search + view toggle + export */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search cards..."
          className="w-64"
        />

        {/* View mode toggle */}
        <div className="flex rounded-lg border border-border-default bg-bg-tertiary p-0.5">
          {viewModeButtons.map((btn) => (
            <button
              key={btn.mode}
              type="button"
              onClick={() => onViewModeChange(btn.mode)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                viewMode === btn.mode
                  ? 'bg-accent text-accent-text'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Export dropdown */}
        <div className="relative ml-auto">
          <button
            type="button"
            onClick={() => setExportOpen(!exportOpen)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border border-border-default bg-bg-tertiary px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary'
            )}
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
            </svg>
            Export
          </button>

          {exportOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-border-default bg-bg-secondary py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  onExport('csv')
                  setExportOpen(false)
                }}
                className="w-full px-3 py-2 text-left text-xs text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
              >
                CSV (Filtered)
              </button>
              <button
                type="button"
                onClick={() => {
                  onExport('full-csv')
                  setExportOpen(false)
                }}
                className="w-full px-3 py-2 text-left text-xs text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
              >
                CSV (Full)
              </button>
              <button
                type="button"
                onClick={() => {
                  onExport('json')
                  setExportOpen(false)
                }}
                className="w-full px-3 py-2 text-left text-xs text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
              >
                JSON
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-6">
        <CheckboxGroup
          label="Rarity"
          options={rarities.map((r) => ({ value: r, label: r }))}
          selected={selectedRarities}
          onChange={onRaritiesChange}
        />
        <CheckboxGroup
          label="Type"
          options={types.map((t) => ({ value: t, label: t }))}
          selected={selectedTypes}
          onChange={onTypesChange}
        />
      </div>
    </div>
  )
}

export { LeaderboardToolbar }
export type { LeaderboardToolbarProps, ViewMode }
