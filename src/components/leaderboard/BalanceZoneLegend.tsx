import { cn } from '@/lib/cn'

interface BalanceZoneLegendProps {
  threshold: number
  className?: string
}

const zones = [
  {
    colorClass: 'bg-zone-op',
    labelFn: (t: number) => `Overpowered (>${t} SD)`,
  },
  {
    colorClass: 'bg-zone-balanced',
    labelFn: () => 'Balanced',
  },
  {
    colorClass: 'bg-zone-up',
    labelFn: (t: number) => `Underpowered (<-${t} SD)`,
  },
]

function BalanceZoneLegend({ threshold, className }: BalanceZoneLegendProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-4 text-xs text-text-secondary', className)}>
      {zones.map((zone) => (
        <span key={zone.colorClass} className="inline-flex items-center gap-1.5">
          <span className={cn('inline-block h-3 w-3 rounded-sm', zone.colorClass)} />
          {zone.labelFn(threshold)}
        </span>
      ))}
    </div>
  )
}

export { BalanceZoneLegend }
export type { BalanceZoneLegendProps }
