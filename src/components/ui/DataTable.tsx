'use client'

import { cn } from '@/lib/cn'
import { ReactNode } from 'react'
import { Checkbox } from './Checkbox'
import { EmptyState } from './EmptyState'

type SortDir = 'asc' | 'desc'

interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (value: unknown, row: T) => ReactNode
  className?: string
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[]
  data: T[]
  sortable?: boolean
  onSort?: (key: string, dir: SortDir) => void
  sortBy?: string
  sortDir?: SortDir
  selectable?: boolean
  selectedIds?: Set<string>
  onSelectionChange?: (selectedIds: Set<string>) => void
  emptyState?: ReactNode
}

function DataTable<T extends { id: string }>({
  columns,
  data,
  sortable = false,
  onSort,
  sortBy,
  sortDir,
  selectable = false,
  selectedIds,
  onSelectionChange,
  emptyState,
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && selectedIds?.size === data.length
  const someSelected =
    selectedIds != null && selectedIds.size > 0 && selectedIds.size < data.length

  function handleSelectAll(checked: boolean) {
    if (!onSelectionChange) return
    if (checked) {
      onSelectionChange(new Set(data.map((row) => row.id)))
    } else {
      onSelectionChange(new Set())
    }
  }

  function handleSelectRow(id: string, checked: boolean) {
    if (!onSelectionChange || !selectedIds) return
    const next = new Set(selectedIds)
    if (checked) {
      next.add(id)
    } else {
      next.delete(id)
    }
    onSelectionChange(next)
  }

  function handleSort(key: string) {
    if (!onSort) return
    const newDir: SortDir =
      sortBy === key && sortDir === 'asc' ? 'desc' : 'asc'
    onSort(key, newDir)
  }

  function getNestedValue(obj: T, key: string): unknown {
    return (obj as Record<string, unknown>)[key]
  }

  if (data.length === 0) {
    return (
      <>
        {emptyState || (
          <EmptyState title="No data" description="There are no items to display." />
        )}
      </>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-default">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default bg-bg-tertiary">
            {selectable && (
              <th className="w-12 px-4 py-3">
                <Checkbox
                  label=""
                  checked={allSelected ?? false}
                  indeterminate={someSelected}
                  onChange={handleSelectAll}
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left font-medium text-text-secondary',
                  sortable && col.sortable !== false && 'cursor-pointer select-none hover:text-text-primary',
                  col.className
                )}
                onClick={() => {
                  if (sortable && col.sortable !== false) {
                    handleSort(col.key)
                  }
                }}
              >
                <span className="inline-flex items-center gap-1.5">
                  {col.label}
                  {sortable && col.sortable !== false && sortBy === col.key && (
                    <svg
                      className={cn(
                        'h-3.5 w-3.5 transition-transform',
                        sortDir === 'desc' && 'rotate-180'
                      )}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const isSelected = selectedIds?.has(row.id) ?? false
            return (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-border-default transition-colors last:border-b-0',
                  isSelected ? 'bg-accent/5' : 'hover:bg-bg-hover'
                )}
              >
                {selectable && (
                  <td className="w-12 px-4 py-3">
                    <Checkbox
                      label=""
                      checked={isSelected}
                      onChange={(checked) => handleSelectRow(row.id, checked)}
                    />
                  </td>
                )}
                {columns.map((col) => {
                  const value = getNestedValue(row, col.key)
                  return (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 text-text-primary',
                        col.className
                      )}
                    >
                      {col.render ? col.render(value, row) : String(value ?? '')}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export { DataTable }
export type { DataTableProps, Column, SortDir }
