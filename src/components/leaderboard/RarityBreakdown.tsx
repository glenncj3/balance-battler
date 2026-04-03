'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { getRarityColor } from '@/lib/rarity-colors'
import { LeaderboardTable, type LeaderboardCardRow } from './LeaderboardTable'

type SortDir = 'asc' | 'desc'

interface RarityBreakdownProps {
  cards: LeaderboardCardRow[]
  rarities: string[]
}

function RarityBreakdown({ cards, rarities }: RarityBreakdownProps) {
  const [sortByMap, setSortByMap] = useState<Record<string, string>>({})
  const [sortDirMap, setSortDirMap] = useState<Record<string, SortDir>>({})

  const groupedByRarity = new Map<string, LeaderboardCardRow[]>()

  // Initialize groups in rarity order
  for (const rarity of rarities) {
    groupedByRarity.set(rarity, [])
  }

  for (const card of cards) {
    const group = groupedByRarity.get(card.rarity)
    if (group) {
      group.push(card)
    } else {
      groupedByRarity.set(card.rarity, [card])
    }
  }

  function handleSort(rarity: string, key: string, dir: SortDir) {
    setSortByMap((prev) => ({ ...prev, [rarity]: key }))
    setSortDirMap((prev) => ({ ...prev, [rarity]: dir }))
  }

  function sortCards(group: LeaderboardCardRow[], rarity: string): LeaderboardCardRow[] {
    const sortKey = sortByMap[rarity] || 'eloRating'
    const sortDirection = sortDirMap[rarity] || 'desc'
    const sorted = [...group].sort((a, b) => {
      const aVal = a[sortKey as keyof LeaderboardCardRow]
      const bVal = b[sortKey as keyof LeaderboardCardRow]
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      return sortDirection === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal))
    })
    return sorted.map((card, i) => ({ ...card, rank: i + 1 }))
  }

  return (
    <div className="flex flex-col gap-8">
      {Array.from(groupedByRarity.entries()).map(([rarity, group]) => {
        if (group.length === 0) return null
        const colors = getRarityColor(rarity)

        return (
          <section key={rarity}>
            <h3
              className={cn(
                'mb-3 text-lg font-semibold capitalize',
                colors.text
              )}
            >
              {rarity}
              <span className="ml-2 text-sm font-normal text-text-tertiary">
                ({group.length} cards)
              </span>
            </h3>
            <LeaderboardTable
              cards={sortCards(group, rarity)}
              sortBy={sortByMap[rarity] || 'eloRating'}
              sortDir={sortDirMap[rarity] || 'desc'}
              onSort={(key, dir) => handleSort(rarity, key, dir)}
              compact
            />
          </section>
        )
      })}
    </div>
  )
}

export { RarityBreakdown }
export type { RarityBreakdownProps }
