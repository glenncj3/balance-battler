'use client'

export function DatabaseError() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-lg rounded-lg border border-border-default bg-bg-secondary p-8 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
          <svg
            className="h-8 w-8 text-warning"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
            />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-bold text-text-primary">
          Database Not Connected
        </h2>
        <p className="mb-4 text-text-secondary">
          CardRank needs a Supabase database to store games, cards, and votes.
          Follow the setup guide to get connected.
        </p>
        <div className="rounded-md border border-border-default bg-bg-tertiary p-4 text-left text-sm text-text-secondary">
          <p className="mb-2 font-medium text-text-primary">Quick setup:</p>
          <ol className="list-inside list-decimal space-y-1">
            <li>Create a free project at <span className="text-accent-text">supabase.com</span></li>
            <li>Copy your database URL and API keys</li>
            <li>Add them to <code className="rounded bg-bg-active px-1 py-0.5 text-accent-text">.env.local</code> (or Netlify environment variables)</li>
            <li>Run <code className="rounded bg-bg-active px-1 py-0.5 text-accent-text">npm run db:push</code> to create tables</li>
          </ol>
          <p className="mt-3 text-text-tertiary">
            See <span className="text-accent-text">SETUP_GUIDE.md</span> in the repo for the full walkthrough.
          </p>
        </div>
      </div>
    </div>
  )
}
