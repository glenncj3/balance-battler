'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const SERIES_COLORS = [
  '#6366f1',
  '#34d399',
  '#f59e0b',
  '#f87171',
  '#a78bfa',
  '#22d3ee',
  '#fb923c',
  '#ec4899',
  '#84cc16',
  '#14b8a6',
]

interface ConvergenceSnapshot {
  voteNumber: number
  rating: number
}

interface ConvergenceCardData {
  cardId: string
  cardName: string
  snapshots: ConvergenceSnapshot[]
}

interface ConvergenceChartProps {
  data: ConvergenceCardData[]
}

function ConvergenceChart({ data }: ConvergenceChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-text-tertiary">
        No convergence data available.
      </div>
    )
  }

  // If more than 20 cards, show only top/bottom 10 by final rating
  let displayData = data
  let isTruncated = false

  if (data.length > 20) {
    const sorted = [...data].sort((a, b) => {
      const aFinal = a.snapshots[a.snapshots.length - 1]?.rating ?? 0
      const bFinal = b.snapshots[b.snapshots.length - 1]?.rating ?? 0
      return bFinal - aFinal
    })
    displayData = [...sorted.slice(0, 10), ...sorted.slice(-10)]
    isTruncated = true
  }

  // Build unified data points indexed by voteNumber
  const allVoteNumbers = new Set<number>()
  for (const card of displayData) {
    for (const snap of card.snapshots) {
      allVoteNumbers.add(snap.voteNumber)
    }
  }

  const sortedVoteNumbers = Array.from(allVoteNumbers).sort((a, b) => a - b)

  const chartData = sortedVoteNumbers.map((voteNum) => {
    const point: Record<string, number | string> = { voteNumber: voteNum }
    for (const card of displayData) {
      const snapshot = card.snapshots.find((s) => s.voteNumber === voteNum)
      if (snapshot) {
        point[card.cardId] = snapshot.rating
      }
    }
    return point
  })

  return (
    <div>
      {isTruncated && (
        <p className="mb-2 text-xs text-text-tertiary">
          Showing top 10 and bottom 10 cards by final rating ({data.length} total).
        </p>
      )}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
          <CartesianGrid stroke="#2a2a3d" strokeDasharray="3 3" />
          <XAxis
            dataKey="voteNumber"
            tick={{ fill: '#9394a5', fontSize: 11 }}
            axisLine={{ stroke: '#3d3d5c' }}
            label={{
              value: 'Vote #',
              position: 'insideBottomRight',
              fill: '#9394a5',
              offset: -5,
            }}
          />
          <YAxis
            tick={{ fill: '#9394a5', fontSize: 11 }}
            axisLine={{ stroke: '#3d3d5c' }}
            label={{
              value: 'Rating',
              angle: -90,
              position: 'insideLeft',
              fill: '#9394a5',
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a2e',
              border: '1px solid #3d3d5c',
              color: '#e2e2e9',
              borderRadius: '8px',
            }}
          />
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{ color: '#9394a5', fontSize: 11, paddingTop: 10 }}
          />
          {displayData.map((card, index) => (
            <Line
              key={card.cardId}
              type="monotone"
              dataKey={card.cardId}
              name={card.cardName}
              stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
              dot={false}
              strokeWidth={1.5}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export { ConvergenceChart }
export type { ConvergenceChartProps, ConvergenceCardData, ConvergenceSnapshot }
