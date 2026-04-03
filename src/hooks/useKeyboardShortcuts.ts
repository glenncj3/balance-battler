'use client'

import { useEffect } from 'react'

export function useKeyboardShortcuts(
  shortcuts: Record<string, () => void>,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return

    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return
      }

      const handler = shortcuts[e.key]
      if (handler) {
        e.preventDefault()
        handler()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts, enabled])
}
