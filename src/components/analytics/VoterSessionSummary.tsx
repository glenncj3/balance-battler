import { formatNumber, formatPercentage } from '@/lib/format'
import { cn } from '@/lib/cn'

interface VoterSessionData {
  uniqueVoters: number
  avgVotesPerSession: number
  totalSessions: number
  retentionRate: number
}

interface VoterSessionSummaryProps {
  data: VoterSessionData
}

interface StatCardConfig {
  label: string
  value: string
  icon: string
}

function VoterSessionSummary({ data }: VoterSessionSummaryProps) {
  const cards: StatCardConfig[] = [
    {
      label: 'Unique Voters',
      value: formatNumber(data.uniqueVoters),
      icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
    },
    {
      label: 'Avg Votes / Session',
      value: data.avgVotesPerSession.toFixed(1),
      icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
    },
    {
      label: 'Total Sessions',
      value: formatNumber(data.totalSessions),
      icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Retention Rate',
      value: formatPercentage(data.retentionRate),
      icon: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={cn(
            'rounded-xl border border-border-default bg-bg-secondary p-5',
            'flex flex-col items-center gap-3 text-center'
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
            <svg
              className="h-5 w-5 text-accent"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
            </svg>
          </div>
          <div>
            <p className="text-3xl font-bold text-text-primary">{card.value}</p>
            <p className="mt-1 text-xs text-text-tertiary">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export { VoterSessionSummary }
export type { VoterSessionSummaryProps, VoterSessionData }
