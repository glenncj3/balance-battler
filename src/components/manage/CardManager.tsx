'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { showToast } from '@/components/ui/Toast'

interface CardData {
  id: string
  name: string
  rarity: string
  cardType: string
  imageUrl: string
  thumbnailLg: string | null
  thumbnailSm: string | null
  eloRating: number
  comparisonCount: number
  winCount: number
}

interface CardManagerProps {
  setId: string
  gameId: string
}

type SortField = 'name' | 'eloRating' | 'comparisonCount' | 'rarity' | 'cardType'
type SortDir = 'asc' | 'desc'

export function CardManager({ setId, gameId }: CardManagerProps) {
  const [cards, setCards] = useState<CardData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [rarityFilter, setRarityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchCards = useCallback(async () => {
    try {
      const res = await fetch(`/api/sets/${setId}/cards`)
      if (!res.ok) throw new Error('Failed to fetch cards')
      const data = await res.json()
      setCards(data.cards || data)
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to fetch cards')
    } finally {
      setLoading(false)
    }
  }, [setId])

  useEffect(() => {
    fetchCards()
  }, [fetchCards])

  const rarities = useMemo(() => {
    const unique = Array.from(new Set(cards.map((c) => c.rarity))).sort()
    return [{ value: 'all', label: 'All Rarities' }, ...unique.map((r) => ({ value: r, label: r }))]
  }, [cards])

  const types = useMemo(() => {
    const unique = Array.from(new Set(cards.map((c) => c.cardType))).sort()
    return [{ value: 'all', label: 'All Types' }, ...unique.map((t) => ({ value: t, label: t }))]
  }, [cards])

  const filtered = useMemo(() => {
    let result = cards.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      if (rarityFilter !== 'all' && c.rarity !== rarityFilter) return false
      if (typeFilter !== 'all' && c.cardType !== typeFilter) return false
      return true
    })

    result.sort((a, b) => {
      const av = a[sortField]
      const bv = b[sortField]
      let cmp = 0
      if (typeof av === 'string' && typeof bv === 'string') {
        cmp = av.localeCompare(bv)
      } else {
        cmp = (av as number) - (bv as number)
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [cards, search, rarityFilter, typeFilter, sortField, sortDir])

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)))
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleDeleteCard(cardId: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/sets/${setId}/cards/${cardId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete card')
      setCards((prev) => prev.filter((c) => c.id !== cardId))
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(cardId)
        return next
      })
      showToast.success('Card deleted')
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to delete card')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  async function handleBulkDelete() {
    setDeleting(true)
    const ids = Array.from(selectedIds)
    let deleted = 0

    try {
      for (const id of ids) {
        const res = await fetch(`/api/sets/${setId}/cards/${id}`, { method: 'DELETE' })
        if (res.ok) deleted++
      }
      setCards((prev) => prev.filter((c) => !selectedIds.has(c.id)))
      setSelectedIds(new Set())
      showToast.success(`Deleted ${deleted} card${deleted !== 1 ? 's' : ''}`)
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to delete cards')
    } finally {
      setDeleting(false)
      setBulkDeleteOpen(false)
    }
  }

  async function handleResetRating(cardId: string) {
    try {
      const res = await fetch(`/api/sets/${setId}/cards/${cardId}/reset`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to reset rating')
      const data = await res.json()
      setCards((prev) =>
        prev.map((c) =>
          c.id === cardId ? { ...c, eloRating: data.eloRating ?? 1500, comparisonCount: 0, winCount: 0 } : c
        )
      )
      showToast.success('Rating reset')
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to reset rating')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <svg
          className="h-8 w-8 animate-spin text-accent"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <EmptyState
        title="No cards in this set"
        description="Upload cards to start managing them."
      />
    )
  }

  return (
    <div>
      {/* Toolbar */}
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

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-text-secondary">
              {selectedIds.size} selected
            </span>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
            >
              Delete Selected
            </Button>
          </div>
        )}
      </div>

      <div className="text-sm text-text-tertiary mb-2">
        {filtered.length} of {cards.length} cards
      </div>

      {/* Card table */}
      <div className="overflow-x-auto rounded-xl border border-border-default">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default bg-bg-tertiary">
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filtered.length && filtered.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">
                <button type="button" onClick={() => toggleSort('name')} className="hover:text-text-primary transition-colors">
                  Card {sortField === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">
                <button type="button" onClick={() => toggleSort('rarity')} className="hover:text-text-primary transition-colors">
                  Rarity {sortField === 'rarity' && (sortDir === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">
                <button type="button" onClick={() => toggleSort('cardType')} className="hover:text-text-primary transition-colors">
                  Type {sortField === 'cardType' && (sortDir === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th className="px-4 py-3 text-right font-medium text-text-secondary">
                <button type="button" onClick={() => toggleSort('eloRating')} className="hover:text-text-primary transition-colors">
                  Rating {sortField === 'eloRating' && (sortDir === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th className="px-4 py-3 text-right font-medium text-text-secondary">
                <button type="button" onClick={() => toggleSort('comparisonCount')} className="hover:text-text-primary transition-colors">
                  Votes {sortField === 'comparisonCount' && (sortDir === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th className="px-4 py-3 text-right font-medium text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((card) => (
              <tr
                key={card.id}
                className={cn(
                  'border-b border-border-default transition-colors last:border-b-0',
                  selectedIds.has(card.id) ? 'bg-accent/5' : 'hover:bg-bg-hover'
                )}
              >
                <td className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(card.id)}
                    onChange={() => toggleSelect(card.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={card.thumbnailLg || card.imageUrl}
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
                  {card.comparisonCount}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => handleResetRating(card.id)}
                      className="rounded p-1.5 text-text-tertiary hover:bg-bg-hover hover:text-text-primary transition-colors"
                      title="Reset rating"
                    >
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.598a.75.75 0 00-.75.75v3.634a.75.75 0 001.5 0v-2.033l.312.311a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm-1.873-7.263a7 7 0 00-11.712 3.138.75.75 0 001.449.39 5.5 5.5 0 019.201-2.466l.312.311H10.256a.75.75 0 000 1.5h3.634a.75.75 0 00.75-.75V2.651a.75.75 0 00-1.5 0v2.033l-.312-.311a7.001 7.001 0 00.611-.212z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(card.id)}
                      className="rounded p-1.5 text-text-tertiary hover:bg-red-900/30 hover:text-error transition-colors"
                      title="Delete card"
                    >
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 01.78.72l.5 6a.75.75 0 01-1.5.12l-.5-6a.75.75 0 01.72-.78zm2.84 0a.75.75 0 01.72.78l-.5 6a.75.75 0 11-1.5-.12l.5-6a.75.75 0 01.78-.72z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete single card */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onConfirm={() => deleteTarget && handleDeleteCard(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Card"
        message="Are you sure you want to delete this card? All associated vote data will be removed."
        confirmLabel="Delete"
        variant="danger"
      />

      {/* Bulk delete */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
        title="Delete Selected Cards"
        message={`Are you sure you want to delete ${selectedIds.size} card${selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmLabel={`Delete ${selectedIds.size} Cards`}
        variant="danger"
      />
    </div>
  )
}
