'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { GameCard } from '@/components/dashboard/GameCard'
import { CreateGameForm } from '@/components/dashboard/CreateGameForm'

interface GameData {
  id: string
  name: string
  slug: string
  description: string | null
  setCount: number
  createdAt: string
}

interface DashboardPageClientProps {
  games: GameData[]
  dbConnected?: boolean
}

export function DashboardPageClient({ games, dbConnected = true }: DashboardPageClientProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)

  return (
    <div>
      {!dbConnected && (
        <div className="mb-6 rounded-lg border border-warning/30 bg-warning/5 p-4">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-warning"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-medium text-warning">Database not connected</p>
              <p className="mt-1 text-sm text-text-secondary">
                You&apos;re seeing the UI preview. To create games and start voting, connect a Supabase
                database by adding environment variables. See{' '}
                <span className="font-medium text-accent-text">SETUP_GUIDE.md</span> for instructions.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Games</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage your card games and their sets.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Create Game
        </Button>
      </div>

      {games.length === 0 ? (
        <EmptyState
          title="No games yet"
          description="Create your first game to get started with balance testing."
          action={{
            label: 'Create Game',
            onClick: () => setShowCreateForm(true),
          }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard
              key={game.id}
              id={game.id}
              name={game.name}
              slug={game.slug}
              description={game.description}
              setCount={game.setCount}
              createdAt={game.createdAt}
            />
          ))}
        </div>
      )}

      <CreateGameForm
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
      />
    </div>
  )
}
