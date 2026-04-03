'use client'

function VotingPaused() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-900/30">
        <svg
          className="h-10 w-10 text-warning"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-text-primary">
          Voting is currently paused
        </h2>
        <p className="text-text-secondary">
          The set owner has temporarily paused voting. Please check back later.
        </p>
      </div>
    </div>
  )
}

export { VotingPaused }
