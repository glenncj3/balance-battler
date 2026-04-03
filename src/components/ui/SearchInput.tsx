'use client'

import { cn } from '@/lib/cn'
import { useEffect, useRef, useState } from 'react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  function handleChange(newValue: string) {
    setLocalValue(newValue)

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      onChange(newValue)
    }, 300)
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return (
    <div className={cn('relative', className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <svg
          className="h-4 w-4 text-text-tertiary"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-lg border border-border-default bg-bg-secondary py-2 pl-9 pr-3 text-sm text-text-primary placeholder-text-tertiary',
          'transition-colors outline-none',
          'focus:border-border-focus focus:ring-1 focus:ring-border-focus'
        )}
      />
      {localValue && (
        <button
          type="button"
          onClick={() => {
            setLocalValue('')
            onChange('')
            if (timerRef.current) clearTimeout(timerRef.current)
          }}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-tertiary hover:text-text-primary transition-colors"
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
    </div>
  )
}

export { SearchInput }
export type { SearchInputProps }
