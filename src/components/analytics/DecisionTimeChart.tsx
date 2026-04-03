'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatDuration } from '@/lib/format'

interface DecisionTimePoint {
  cardName: string
  avgDecisionMs: number
}

interface DecisionTimeChartProps {
  data: DecisionTimePoint[]
}

function DecisionTimeChart({ data }: DecisionTimeChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-text-tertiary">
        No decision time data available.
      </div>
    )
  }

  // Sort by decision time descending
  const sorted = [...data].sort((a, b) => b.avgDecisionMs - a.avgDecisionMs)

  // Dynamic height based on number of bars
  const chartHeight = Math.max(300, sorted.length * 32)

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={sorted}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 120, bottom: 10 }}
      >
        <CartesianGrid stroke="#2a2a3d" strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: '#9394a5', fontSize: 11 }}
          axisLine={{ stroke: '#3d3d5c' }}
          tickFormatter={(value: number) => formatDuration(value)}
        />
        <YAxis
          type="category"
          dataKey="cardName"
          tick={{ fill: '#9394a5', fontSize: 11 }}
          axisLine={{ stroke: '#3d3d5c' }}
          width={110}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a2e',
            border: '1px solid #3d3d5c',
            color: '#e2e2e9',
            borderRadius: '8px',
          }}
          formatter={(value) => [formatDuration(Number(value)), 'Avg Decision Time']}
        />
        <Bar
          dataKey="avgDecisionMs"
          fill="#6366f1"
          radius={[0, 4, 4, 0]}
          name="Avg Decision Time"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

export { DecisionTimeChart }
export type { DecisionTimeChartProps, DecisionTimePoint }
