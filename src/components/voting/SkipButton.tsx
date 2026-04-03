'use client'

import { Button } from '@/components/ui/Button'

interface SkipButtonProps {
  onSkip: () => void
}

function SkipButton({ onSkip }: SkipButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onSkip}
      className="text-text-tertiary hover:text-text-secondary"
    >
      Can&apos;t decide &mdash; Skip
    </Button>
  )
}

export { SkipButton }
export type { SkipButtonProps }
