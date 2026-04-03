'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import { useEffect } from 'react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg
        className="h-5 w-5"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  // Lock body scroll when sidebar overlay is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border-default px-5">
        <svg
          className="h-7 w-7 text-accent-text"
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
        <span className="text-lg font-bold text-accent-text tracking-tight">
          CardRank
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent-muted text-accent-text'
                      : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-border-default px-5 py-3">
        <p className="text-xs text-text-tertiary">CardRank v1.0</p>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:border-r lg:border-border-default lg:bg-bg-secondary">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Slide-in sidebar */}
          <aside
            className={cn(
              'fixed inset-y-0 left-0 z-50 w-60 bg-bg-secondary border-r border-border-default',
              'transform transition-transform duration-200 ease-out',
              isOpen ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}

export type { SidebarProps }
