'use client'

import { cn } from '@/lib/cn'
import { ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type ModalSize = 'sm' | 'md' | 'lg' | 'fullscreen'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: ModalSize
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-3xl',
  fullscreen: 'max-w-none w-screen h-screen',
}

function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (open) {
      // Small delay to trigger the CSS transition
      requestAnimationFrame(() => {
        setVisible(true)
      })
    } else {
      setVisible(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!mounted || !open) return null

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'transition-opacity duration-200',
        visible ? 'opacity-100' : 'opacity-0'
      )}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Content */}
      <div
        className={cn(
          'relative w-full',
          sizeStyles[size],
          size !== 'fullscreen' &&
            'mx-4 rounded-xl border border-border-default bg-bg-secondary shadow-2xl',
          size === 'fullscreen' && 'bg-black'
        )}
      >
        {title && size !== 'fullscreen' && (
          <div className="flex items-center justify-between border-b border-border-default px-6 py-4">
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-text-tertiary hover:bg-bg-hover hover:text-text-primary transition-colors"
            >
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        )}
        <div
          className={cn(
            size !== 'fullscreen' && 'p-6',
            size === 'fullscreen' && 'h-full w-full'
          )}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

export { Modal }
export type { ModalProps, ModalSize }
