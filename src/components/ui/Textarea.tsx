'use client'

import { cn } from '@/lib/cn'
import { TextareaHTMLAttributes, forwardRef } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'rounded-lg border bg-bg-secondary px-3 py-2 text-text-primary placeholder-text-tertiary',
            'transition-colors outline-none resize-y min-h-[80px]',
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

Textarea.displayName = 'Textarea'

export { Textarea }
export type { TextareaProps }
