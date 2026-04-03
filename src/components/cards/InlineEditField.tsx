'use client'

import { cn } from '@/lib/cn'
import { useCallback, useEffect, useRef, useState } from 'react'

interface InlineEditFieldProps {
  value: string
  onSave: (newValue: string) => void
  className?: string
}

export function InlineEditField({
  value,
  onSave,
  className,
}: InlineEditFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync external value changes
  useEffect(() => {
    if (!editing) {
      setDraft(value)
    }
  }, [value, editing])

  // Focus input when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleSave = useCallback(() => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== value) {
      onSave(trimmed)
    } else {
      setDraft(value)
    }
    setEditing(false)
  }, [draft, value, onSave])

  const handleCancel = useCallback(() => {
    setDraft(value)
    setEditing(false)
  }, [value])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSave()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleCancel()
      }
    },
    [handleSave, handleCancel]
  )

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={cn(
          'rounded border border-border-focus bg-bg-tertiary px-2 py-1 text-text-primary outline-none',
          'ring-1 ring-border-focus',
          className
        )}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        'group inline-flex items-center gap-1.5 rounded px-2 py-1 text-left transition-colors',
        'hover:bg-bg-hover',
        className
      )}
    >
      <span className="text-text-primary">{value}</span>
      <svg
        className="h-3.5 w-3.5 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
      </svg>
    </button>
  )
}

export type { InlineEditFieldProps }
