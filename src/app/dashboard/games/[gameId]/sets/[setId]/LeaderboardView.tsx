'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/Badge'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'

interface LeaderboardCard {
  id: string
  rank: number
  name: string
  rarity: string
  cardType: string
  imageUrl: string
  thumbnailLg: string
  eloRating: number
  comparisonCount: number
  winCount: number
  winRate: number
  confidence: 'low' | 'medium' | 'high'
  zone: 'op' | 'balanced' | 'up'
  deviation: number
}

interface LeaderboardViewProps {
  cards: LeaderboardCard[]
  totalCards: number
  totalComparisons: number
  meanRating: number
  stdDev: number
  balanceZoneSd: number
  setSlug: string
}

export function LeaderboardView({
  cards,
  totalCards,
  totalComparisons,
  meanRating,
  stdDev,
  setSlug,
}: LeaderboardViewProps) {
  const [search, setSearch] = useState('')
  const [rarityFilter, setRarityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const rarities = useMemo(() => {
    const unique = Array.from(new Set(cards.map((c) => c.rarity))).sort()
    return [{ value: 'all', label: 'All Rarities' }, ...unique.map((r) => ({ value: r, label: r }))]
  }, [cards])

  const types = useMemo(() => {
    const unique = Array.from(new Set(cards.map((c) => c.cardType))).sort()
    return [{ value: 'all', label: 'All Types' }, ...unique.map((t) => ({ value: t, label: t }))]
  }, [cards])

  const filtered = useMemo(() => {
    return cards.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      if (rarityFilter !== 'all' && c.rarity !== rarityFilter) return false
      if (typeFilter !== 'all' && c.cardType !== typeFilter) return false
      return true
    })
  }, [cards, search, rarityFilter, typeFilter])

  const votingUrl = typeof window !== 'undefined' ? `${window.location.origin}/vote/${setSlug}` : `/vote/${setSlug}`

  return (
    <div>
      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatBlock label="Total Cards" value={totalCards.toString()} />
        <StatBlock label="Total Votes" value={totalComparisons.toString()} />
        <StatBlock label="Mean Rating" value={Math.round(meanRating).toString()} />
        <StatBlock label="Std Dev" value={stdDev.toFixed(1)} />
      </div>

      {/* Voting link */}
      <div className="mb-6 rounded-xl border border-border-default bg-bg-secondary p-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-secondary">Voting Link</p>
          <p className="text-sm text-accent-text truncate font-mono">{votingUrl}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(votingUrl)
          }}
          className="shrink-0 rounded-lg border border-border-default bg-bg-tertiary px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-bg-hover transition-colors"
        >
          Copy
        </button>
      </div>

      {cards.length === 0 ? (
        <EmptyState
          title="No cards yet"
          description="Upload cards to this set to see them ranked on the leaderboard."
        />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search cards..."
              className="w-64"
            />
            <Select
              options={rarities}
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value)}
            />
            <Select
              options={types}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
          </div>

          {/* Leaderboard table */}
          <div className="overflow-x-auto rounded-xl border border-border-default">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default bg-bg-tertiary">
                  <th className="px-4 py-3 text-left font-medium text-text-secondary w-16">#</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Card</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Rarity</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Type</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">Rating</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">Win Rate</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">Votes</th>
                  <th className="px-4 py-3 text-center font-medium text-text-secondary">Confidence</th>
                  <th className="px-4 py-3 text-center font-medium text-text-secondary">Zone</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((card) => (
                  <tr
                    key={card.id}
                    className={cn(
                      'border-b border-border-default transition-colors last:border-b-0',
                      card.zone === 'op' && 'bg-zone-op',
                      card.zone === 'up' && 'bg-zone-up',
                      card.zone === 'balanced' && 'bg-zone-balanced',
                      'hover:bg-bg-hover'
                    )}
                  >
                    <td className="px-4 py-3 text-text-tertiary font-mono">{card.rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={card.thumbnailLg}
                          alt={card.name}
                          className="h-10 w-8 rounded object-cover bg-bg-tertiary"
                        />
                        <span className="font-medium text-text-primary">{card.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{card.rarity}</td>
                    <td className="px-4 py-3 text-text-secondary">{card.cardType}</td>
                    <td className="px-4 py-3 text-right font-mono text-text-primary">
                      {Math.round(card.eloRating)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-text-secondary">
                      {card.comparisonCount > 0 ? `${(card.winRate * 100).toFixed(1)}%` : '--'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-text-secondary">
                      {card.comparisonCount}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={
                          card.confidence === 'high'
                            ? 'success'
                            : card.confidence === 'medium'
                              ? 'warning'
                              : 'error'
                        }
                      >
                        {card.confidence}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          card.zone === 'op' && 'bg-red-900/30 text-error',
                          card.zone === 'balanced' && 'bg-green-900/30 text-success',
                          card.zone === 'up' && 'bg-blue-900/30 text-info'
                        )}
                      >
                        {card.zone === 'op' ? 'OP' : card.zone === 'up' ? 'UP' : 'Balanced'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-text-secondary">
              No cards match your filters.
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-default bg-bg-secondary px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-text-tertiary">{label}</p>
      <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
    </div>
  )
}
