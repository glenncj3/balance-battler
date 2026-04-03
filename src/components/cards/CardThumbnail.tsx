'use client'

import Image from 'next/image'
import { cn } from '@/lib/cn'

interface CardThumbnailProps {
  src: string
  alt: string
  size?: 'sm' | 'lg'
  onClick?: () => void
  className?: string
}

const sizeConfig = {
  sm: { width: 80, maxWidth: 'max-w-[80px]' },
  lg: { width: 400, maxWidth: 'max-w-[400px]' },
}

export function CardThumbnail({
  src,
  alt,
  size = 'sm',
  onClick,
  className,
}: CardThumbnailProps) {
  const config = sizeConfig[size]

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      className={cn(
        'relative overflow-hidden rounded-lg border border-border-default shadow-card',
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-card-hover hover:scale-[1.03]',
        config.maxWidth,
        className
      )}
      style={{ aspectRatio: '5 / 7' }}
    >
      <Image
        src={src}
        alt={alt}
        width={config.width}
        height={Math.round(config.width * 1.4)}
        className="h-full w-full object-cover"
        unoptimized
      />
    </div>
  )
}

export type { CardThumbnailProps }
