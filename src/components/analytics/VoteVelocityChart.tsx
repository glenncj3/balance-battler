'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface VelocityPoint {
  period: string
  votes: number
}

interface VoteVelocityChartProps {
  data: VelocityPoint[]
}

function VoteVelocityChart({ data }: VoteVelocityChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-text-tertiary">
        No velocity data available.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
        <defs>
          <linearGradient id="voteVelocityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#2a2a3d" strokeDasharray="3 3" />
        <XAxis
          dataKey="period"
          tick={{ fill: '#9394a5', fontSize: 11 }}
          axisLine={{ stroke: '#3d3d5c' }}
        />
        <YAxis
          tick={{ fill: '#9394a5', fontSize: 11 }}
          axisLine={{ stroke: '#3d3d5c' }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a2e',
            border: '1px solid #3d3d5c',
            color: '#e2e2e9',
            borderRadius: '8px',
          }}
        />
        <Area
          type="monotone"
          dataKey="votes"
          stroke="#6366f1"
          fill="url(#voteVelocityGradient)"
          strokeWidth={2}
          name="Votes"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export { VoteVelocityChart }
export type { VoteVelocityChartProps, VelocityPoint }
