'use client'

import { useState } from 'react'
import { LeaderboardTable, type LeaderboardCardRow } from './LeaderboardTable'

type SortDir = 'asc' | 'desc'

interface TypeBreakdownProps {
  cards: LeaderboardCardRow[]
  types: string[]
}

function TypeBreakdown({ cards, types }: TypeBreakdownProps) {
  const [sortByMap, setSortByMap] = useState<Record<string, string>>({})
  const [sortDirMap, setSortDirMap] = useState<Record<string, SortDir>>({})

  // Group cards by type. A card can appear in multiple groups if its cardType
  // contains multiple types (comma-separated or slash-separated).
  const groupedByType = new Map<string, LeaderboardCardRow[]>()

  for (const type of types) {
    groupedByType.set(type, [])
  }

  for (const card of cards) {
    // Split card type on common separators
    const cardTypes = card.cardType
      .split(/[,/]/)
      .map((t) => t.trim())
      .filter(Boolean)

    for (const ct of cardTypes) {
      // Try exact match first, then case-insensitive
      const matchedType = types.find(
        (t) => t === ct || t.toLowerCase() === ct.toLowerCase()
      )
      if (matchedType) {
        const group = groupedByType.get(matchedType)!
        group.push(card)
      }
    }

    // If no match found, add to the raw cardType group
    if (cardTypes.length === 1) {
      const type = card.cardType
      if (!groupedByType.has(type)) {
        groupedByType.set(type, [card])
      } else if (!types.some((t) => t.toLowerCase() === type.toLowerCase())) {
        // Card wasn't matched to any known type
        const group = groupedByType.get(type)
        if (!group) {
          groupedByType.set(type, [card])
        }
      }
    }
  }

  function handleSort(type: string, key: string, dir: SortDir) {
    setSortByMap((prev) => ({ ...prev, [type]: key }))
    setSortDirMap((prev) => ({ ...prev, [type]: dir }))
  }

  function sortCards(group: LeaderboardCardRow[], type: string): LeaderboardCardRow[] {
    const sortKey = sortByMap[type] || 'eloRating'
    const sortDirection = sortDirMap[type] || 'desc'
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
      {Array.from(groupedByType.entries()).map(([type, group]) => {
        if (group.length === 0) return null

        return (
          <section key={type}>
            <h3 className="mb-3 text-lg font-semibold text-text-primary">
              {type}
              <span className="ml-2 text-sm font-normal text-text-tertiary">
                ({group.length} cards)
              </span>
            </h3>
            <LeaderboardTable
              cards={sortCards(group, type)}
              sortBy={sortByMap[type] || 'eloRating'}
              sortDir={sortDirMap[type] || 'desc'}
              onSort={(key, dir) => handleSort(type, key, dir)}
              compact
            />
          </section>
        )
      })}
    </div>
  )
}

export { TypeBreakdown }
export type { TypeBreakdownProps }
