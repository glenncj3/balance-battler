'use client'

import { cn } from '@/lib/cn'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'rounded-lg border bg-bg-secondary px-3 py-2 text-text-primary placeholder-text-tertiary',
            'transition-colors outline-none',
            'focus:border-border-focus focus:ring-1 focus:ring-border-focus',
            error
              ? 'border-error'
              : 'border-border-default',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-error">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-text-tertiary">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
export type { InputProps }
