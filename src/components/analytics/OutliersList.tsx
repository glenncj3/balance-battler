import { cn } from '@/lib/cn'
import { RarityBadge } from '@/components/cards/RarityBadge'

interface OutlierItem {
  id: string
  name: string
  rarity: string
  eloRating: number
  overallDeviation: number
  rarityDeviation: number
}

interface OutliersListProps {
  outliers: OutlierItem[]
}

function deviationColor(d: number): string {
  if (d > 2) return 'text-red-400'
  if (d < -2) return 'text-blue-400'
  return 'text-text-secondary'
}

function formatDeviation(d: number): string {
  const sign = d > 0 ? '+' : ''
  return `${sign}${d.toFixed(2)} SD`
}

function OutliersList({ outliers }: OutliersListProps) {
  if (outliers.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-text-tertiary">
        No outliers detected. All cards are within 2 standard deviations of both the overall and rarity-tier means.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-default">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default bg-bg-tertiary">
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Name</th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">Rarity</th>
            <th className="px-4 py-3 text-right font-medium text-text-secondary">Rating</th>
            <th className="px-4 py-3 text-right font-medium text-text-secondary">
              Overall Deviation
            </th>
            <th className="px-4 py-3 text-right font-medium text-text-secondary">
              Rarity Deviation
            </th>
          </tr>
        </thead>
        <tbody>
          {outliers.map((outlier) => (
            <tr
              key={outlier.id}
              className="border-b border-border-default transition-colors last:border-b-0 hover:bg-bg-hover"
            >
              <td className="px-4 py-3 font-medium text-text-primary">
                {outlier.name}
              </td>
              <td className="px-4 py-3">
                <RarityBadge rarity={outlier.rarity} />
              </td>
              <td className="px-4 py-3 text-right font-mono text-text-primary">
                {Math.round(outlier.eloRating)}
              </td>
              <td
                className={cn(
                  'px-4 py-3 text-right font-mono',
                  deviationColor(outlier.overallDeviation)
                )}
              >
                {formatDeviation(outlier.overallDeviation)}
              </td>
              <td
                className={cn(
                  'px-4 py-3 text-right font-mono',
                  deviationColor(outlier.rarityDeviation)
                )}
              >
                {formatDeviation(outlier.rarityDeviation)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export { OutliersList }
export type { OutliersListProps, OutlierItem }
