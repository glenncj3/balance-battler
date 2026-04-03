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

interface HistogramBin {
  bucket: string
  count: number
}

interface RatingHistogramProps {
  data: HistogramBin[]
}

function RatingHistogram({ data }: RatingHistogramProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-text-tertiary">
        No distribution data available.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
        <CartesianGrid stroke="#2a2a3d" strokeDasharray="3 3" />
        <XAxis
          dataKey="bucket"
          tick={{ fill: '#9394a5', fontSize: 11 }}
          axisLine={{ stroke: '#3d3d5c' }}
          angle={-45}
          textAnchor="end"
          height={60}
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
          cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
        />
        <Bar
          dataKey="count"
          fill="#6366f1"
          radius={[4, 4, 0, 0]}
          name="Cards"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

export { RatingHistogram }
export type { RatingHistogramProps, HistogramBin }
