'use client'

import { cn } from '@/lib/cn'
import { useEffect, useRef } from 'react'

interface CheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  indeterminate?: boolean
  disabled?: boolean
  className?: string
}

function Checkbox({
  label,
  checked,
  onChange,
  indeterminate = false,
  disabled = false,
  className,
}: CheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate
    }
  }, [indeterminate])

  return (
    <label
      className={cn(
        'inline-flex items-center gap-2 cursor-pointer select-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        <input
          ref={inputRef}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="peer sr-only"
        />
        <div
          className={cn(
            'h-5 w-5 rounded border-2 transition-colors',
            'flex items-center justify-center',
            checked || indeterminate
              ? 'bg-accent border-accent'
              : 'bg-bg-secondary border-border-default',
            !disabled && !checked && !indeterminate && 'hover:border-border-strong',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-border-focus peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-transparent'
          )}
        >
          {checked && !indeterminate && (
            <svg
              className="h-3.5 w-3.5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {indeterminate && (
            <svg
              className="h-3.5 w-3.5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>
      <span className="text-sm text-text-primary">{label}</span>
    </label>
  )
}

export { Checkbox }
export type { CheckboxProps }
