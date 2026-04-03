'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

interface GameCardProps {
  id: string
  name: string
  slug: string
  description: string | null
  setCount: number
  createdAt: string
}

export function GameCard({ id, name, description, setCount, createdAt }: GameCardProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Link
      href={`/dashboard/games/${id}`}
      className="group flex flex-col rounded-xl border border-border-default bg-bg-secondary p-5 shadow-card transition-all hover:shadow-card-hover hover:border-border-strong"
    >
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent-text transition-colors">
          {name}
        </h3>
        <Badge variant={setCount > 0 ? 'info' : 'default'}>
          {setCount} {setCount === 1 ? 'set' : 'sets'}
        </Badge>
      </div>

      {description && (
        <p className="mt-2 text-sm text-text-secondary line-clamp-2">
          {description}
        </p>
      )}

      <div className="mt-auto pt-4 flex items-center text-xs text-text-tertiary">
        <svg
          className="mr-1.5 h-3.5 w-3.5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z"
            clipRule="evenodd"
          />
        </svg>
        Created {formattedDate}
      </div>
    </Link>
  )
}
