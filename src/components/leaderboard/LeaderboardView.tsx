'use client'

import { useMemo, useState, useCallback } from 'react'
import { classifyBalanceZone } from '@/lib/analytics'
import { formatNumber, formatPercentage } from '@/lib/format'
import { LeaderboardToolbar, type ViewMode } from './LeaderboardToolbar'
import { LeaderboardTable, type LeaderboardCardRow } from './LeaderboardTable'
import { RarityBreakdown } from './RarityBreakdown'
import { TypeBreakdown } from './TypeBreakdown'
import { BalanceZoneLegend } from './BalanceZoneLegend'

type SortDir = 'asc' | 'desc'

interface LeaderboardCardData {
  id: string
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
}

interface LeaderboardStats {
  mean: number
  stddev: number
  totalVotes: number
  uniqueVoters: number
}

interface LeaderboardSetConfig {
  rarities: string[]
  types: string[]
  minVoteThreshold: number
  balanceZoneSd: number
}

interface LeaderboardViewProps {
  initialData: LeaderboardCardData[]
  stats: LeaderboardStats
  setConfig: LeaderboardSetConfig
}

function LeaderboardView({ initialData, stats, setConfig }: LeaderboardViewProps) {
  const [selectedRarities, setSelectedRarities] = useState<string[]>(setConfig.rarities)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(setConfig.types)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('eloRating')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [viewMode, setViewMode] = useState<ViewMode>('full')

  // Enrich cards with balance zone + filter + sort
  const processedCards = useMemo(() => {
    // Enrich with balance zone
    const enriched: LeaderboardCardRow[] = initialData.map((card) => ({
      ...card,
      rank: 0, // will be set after filtering/sorting
      balanceZone: classifyBalanceZone(
        card.eloRating,
        stats.mean,
        stats.stddev,
        setConfig.balanceZoneSd
      ),
    }))

    // Filter
    let filtered = enriched

    if (selectedRarities.length < setConfig.rarities.length) {
      filtered = filtered.filter((c) => selectedRarities.includes(c.rarity))
    }

    if (selectedTypes.length < setConfig.types.length) {
      filtered = filtered.filter((c) => {
        const cardTypes = c.cardType
          .split(/[,/]/)
          .map((t) => t.trim().toLowerCase())
        return selectedTypes.some((st) =>
          cardTypes.includes(st.toLowerCase())
        )
      })
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(q))
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const aVal = a[sortBy as keyof LeaderboardCardRow]
      const bVal = b[sortBy as keyof LeaderboardCardRow]
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal))
    })

    // Assign ranks
    return sorted.map((card, i) => ({ ...card, rank: i + 1 }))
  }, [initialData, stats, setConfig, selectedRarities, selectedTypes, searchQuery, sortBy, sortDir])

  const handleSort = useCallback((key: string, dir: SortDir) => {
    setSortBy(key)
    setSortDir(dir)
  }, [])

  const handleExport = useCallback(
    (format: 'csv' | 'full-csv' | 'json') => {
      const dataToExport = format === 'full-csv' ? initialData : processedCards

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
          type: 'application/json',
        })
        downloadBlob(blob, 'leaderboard.json')
        return
      }

      // CSV
      const headers = ['Rank', 'Name', 'Rarity', 'Type', 'Rating', 'Confidence', 'Comparisons', 'Win Rate']
      const rows = (format === 'full-csv'
        ? initialData
            .sort((a, b) => b.eloRating - a.eloRating)
            .map((c, i) => ({ ...c, rank: i + 1 }))
        : processedCards
      ).map((c) => [
        c.rank,
        `"${c.name}"`,
        c.rarity,
        c.cardType,
        Math.round(c.eloRating),
        c.confidence,
        c.comparisonCount,
        formatPercentage(c.winRate),
      ])

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      downloadBlob(blob, 'leaderboard.csv')
    },
    [processedCards, initialData]
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Votes" value={formatNumber(stats.totalVotes)} />
        <StatCard label="Unique Voters" value={formatNumber(stats.uniqueVoters)} />
        <StatCard label="Mean Rating" value={Math.round(stats.mean).toString()} />
        <StatCard label="Std Deviation" value={stats.stddev.toFixed(1)} />
      </div>

      {/* Toolbar */}
      <LeaderboardToolbar
        rarities={setConfig.rarities}
        types={setConfig.types}
        selectedRarities={selectedRarities}
        onRaritiesChange={setSelectedRarities}
        selectedTypes={selectedTypes}
        onTypesChange={setSelectedTypes}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onExport={handleExport}
      />

      {/* Balance zone legend */}
      <BalanceZoneLegend threshold={setConfig.balanceZoneSd} />

      {/* Results count */}
      <p className="text-sm text-text-tertiary">
        Showing {processedCards.length} of {initialData.length} cards
      </p>

      {/* Content based on view mode */}
      {viewMode === 'full' && (
        <LeaderboardTable
          cards={processedCards}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
        />
      )}

      {viewMode === 'rarity-breakdown' && (
        <RarityBreakdown
          cards={processedCards}
          rarities={setConfig.rarities}
        />
      )}

      {viewMode === 'type-breakdown' && (
        <TypeBreakdown
          cards={processedCards}
          types={setConfig.types}
        />
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-default bg-bg-secondary p-4">
      <p className="text-xs text-text-tertiary">{label}</p>
      <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
    </div>
  )
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export { LeaderboardView }
export type { LeaderboardViewProps, LeaderboardCardData, LeaderboardStats, LeaderboardSetConfig }
