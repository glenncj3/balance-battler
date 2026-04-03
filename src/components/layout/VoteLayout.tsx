import { ReactNode } from 'react'

interface VoteLayoutProps {
  children: ReactNode
  setName?: string
}

export function VoteLayout({ children, setName }: VoteLayoutProps) {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Minimal header */}
      <header className="flex items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo top-left */}
        <div className="flex items-center gap-2">
          <svg
            className="h-6 w-6 text-accent-text"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          <span className="text-sm font-bold text-accent-text tracking-tight">
            CardRank
          </span>
        </div>

        {/* Set name centered */}
        {setName && (
          <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-medium text-text-secondary truncate max-w-[50vw]">
            {setName}
          </h1>
        )}

        {/* Spacer for balance */}
        <div className="w-20" />
      </header>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        {children}
      </div>
    </div>
  )
}

export type { VoteLayoutProps }
