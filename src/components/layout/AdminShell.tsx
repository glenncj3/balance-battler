'use client'

import { ReactNode, useCallback, useState } from 'react'
import { Sidebar } from './Sidebar'

interface AdminShellProps {
  children: ReactNode
}

export function AdminShell({ children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />

      {/* Main area offset by sidebar on desktop */}
      <div className="lg:pl-60">
        {/* Mobile topbar with hamburger */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border-default bg-bg-secondary px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
            aria-label="Open sidebar"
          >
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 012 10z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <span className="text-lg font-bold text-accent-text tracking-tight">
            CardRank
          </span>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}

export type { AdminShellProps }
