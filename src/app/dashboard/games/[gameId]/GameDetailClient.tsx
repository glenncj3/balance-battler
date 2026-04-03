'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SetCard } from '@/components/dashboard/SetCard'
import { CreateSetForm } from '@/components/dashboard/CreateSetForm'

interface SetData {
  id: string
  gameId: string
  name: string
  slug: string
  cardCount: number
  voteCount: number
  votingOpen: boolean
  createdAt: string
}

interface GameData {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  sets: SetData[]
}

interface GameDetailClientProps {
  game: GameData
}

export function GameDetailClient({ game }: GameDetailClientProps) {
  const [showCreateSet, setShowCreateSet] = useState(false)

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{game.name}</h1>
          {game.description && (
            <p className="mt-1 text-sm text-text-secondary">{game.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href={`/dashboard/games/${game.id}/settings`}>
            <Button variant="secondary" size="sm">
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
              Settings
            </Button>
          </Link>
          <Button onClick={() => setShowCreateSet(true)}>
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Create Set
          </Button>
        </div>
      </div>

      {game.sets.length === 0 ? (
        <EmptyState
          title="No sets yet"
          description="Create a set to start adding cards and collecting votes."
          action={{
            label: 'Create Set',
            onClick: () => setShowCreateSet(true),
          }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {game.sets.map((set) => (
            <SetCard
              key={set.id}
              id={set.id}
              gameId={set.gameId}
              name={set.name}
              slug={set.slug}
              cardCount={set.cardCount}
              voteCount={set.voteCount}
              votingOpen={set.votingOpen}
              createdAt={set.createdAt}
            />
          ))}
        </div>
      )}

      <CreateSetForm
        open={showCreateSet}
        onClose={() => setShowCreateSet(false)}
        gameId={game.id}
      />
    </div>
  )
}
