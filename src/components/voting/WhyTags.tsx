'use client'

import { cn } from '@/lib/cn'

interface WhyTagsProps {
  tags: string[]
  selectedTag: string | null
  onSelect: (tag: string) => void
  visible: boolean
}

function WhyTags({ tags, selectedTag, onSelect, visible }: WhyTagsProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-center gap-2',
        'transition-all duration-300 ease-in-out',
        visible
          ? 'max-h-24 opacity-100'
          : 'pointer-events-none max-h-0 overflow-hidden opacity-0'
      )}
    >
      <span className="text-xs text-text-tertiary">Why?</span>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onSelect(tag)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-border-focus',
            selectedTag === tag
              ? 'bg-accent text-white'
              : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover hover:text-text-primary border border-border-default'
          )}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}

export { WhyTags }
export type { WhyTagsProps }
