import { cn } from '@/lib/cn'
import { getRarityColor } from '@/lib/rarity-colors'

interface RarityBadgeProps {
  rarity: string
  size?: 'sm' | 'md'
}

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
}

export function RarityBadge({ rarity, size = 'sm' }: RarityBadgeProps) {
  const colors = getRarityColor(rarity)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium border leading-none capitalize',
        colors.bg,
        colors.text,
        colors.border,
        sizeStyles[size]
      )}
    >
      {rarity}
    </span>
  )
}

export type { RarityBadgeProps }
