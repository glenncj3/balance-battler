'use client'

import { cn } from '@/lib/cn'
import { Checkbox } from './Checkbox'

interface CheckboxGroupOption {
  value: string
  label: string
}

interface CheckboxGroupProps {
  label?: string
  options: CheckboxGroupOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  className?: string
}

function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
  className,
}: CheckboxGroupProps) {
  const allSelected = options.length > 0 && selected.length === options.length
  const someSelected = selected.length > 0 && selected.length < options.length

  function handleToggle(value: string, checked: boolean) {
    if (checked) {
      onChange([...selected, value])
    } else {
      onChange(selected.filter((v) => v !== value))
    }
  }

  function handleSelectAll() {
    onChange(options.map((o) => o.value))
  }

  function handleDeselectAll() {
    onChange([])
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {label && (
        <span className="text-sm font-medium text-text-secondary">{label}</span>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-xs text-accent hover:text-accent-hover transition-colors"
        >
          Select All
        </button>
        <span className="text-text-tertiary">|</span>
        <button
          type="button"
          onClick={handleDeselectAll}
          className="text-xs text-accent hover:text-accent-hover transition-colors"
        >
          Deselect All
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <Checkbox
            key={option.value}
            label={option.label}
            checked={selected.includes(option.value)}
            onChange={(checked) => handleToggle(option.value, checked)}
          />
        ))}
      </div>
    </div>
  )
}

export { CheckboxGroup }
export type { CheckboxGroupProps, CheckboxGroupOption }
