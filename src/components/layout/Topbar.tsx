import { ReactNode } from 'react'
import { Breadcrumbs, type BreadcrumbItem } from './Breadcrumbs'

interface TopbarProps {
  breadcrumbs: BreadcrumbItem[]
  actions?: ReactNode
}

export function Topbar({ breadcrumbs, actions }: TopbarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border-default bg-bg-secondary px-6">
      <Breadcrumbs items={breadcrumbs} />
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  )
}

export type { TopbarProps }
