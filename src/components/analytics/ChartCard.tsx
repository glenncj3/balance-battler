import { cn } from '@/lib/cn'
import { ReactNode } from 'react'

interface ChartCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}

function ChartCard({ title, subtitle, children, className }: ChartCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border-default bg-bg-secondary',
        className
      )}
    >
      <div className="border-b border-border-default px-5 py-4">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-text-tertiary">{subtitle}</p>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export { ChartCard }
export type { ChartCardProps }
