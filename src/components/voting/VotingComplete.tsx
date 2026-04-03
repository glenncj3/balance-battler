'use client'

interface VotingCompleteProps {
  totalVotes: number
}

function VotingComplete({ totalVotes }: VotingCompleteProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/20">
        <svg
          className="h-10 w-10 text-accent"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-text-primary">
          All pairs compared!
        </h2>
        <p className="text-text-secondary">
          You compared{' '}
          <span className="font-semibold text-accent tabular-nums">
            {totalVotes}
          </span>{' '}
          {totalVotes === 1 ? 'pair' : 'pairs'} this session.
        </p>
      </div>

      <p className="max-w-sm text-sm text-text-tertiary">
        Thank you for contributing! Your votes help build more accurate rankings
        for this set.
      </p>
    </div>
  )
}

export { VotingComplete }
export type { VotingCompleteProps }
