import Link from 'next/link'
import { cn } from '@/lib/cn'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <span key={index} className="flex items-center gap-1.5">
            {index > 0 && (
              <svg
                className="h-3.5 w-3.5 text-text-tertiary"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className={cn(
                  'text-text-secondary hover:text-text-primary transition-colors'
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  isLast ? 'text-text-primary font-medium' : 'text-text-secondary'
                )}
              >
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}

export type { BreadcrumbItem, BreadcrumbsProps }
