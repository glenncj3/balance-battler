'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '@/lib/cn'

interface TagCount {
  tag: string
  winCount: number
  lossCount: number
}

interface CardTagData {
  cardName: string
  tags: TagCount[]
}

interface WhyTagBreakdownProps {
  data: CardTagData[]
}

function WhyTagBreakdown({ data }: WhyTagBreakdownProps) {
  const [selectedCard, setSelectedCard] = useState<string>(data[0]?.cardName ?? '')

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-text-tertiary">
        No tag data available.
      </div>
    )
  }

  const cardData = data.find((d) => d.cardName === selectedCard)
  const chartData = cardData?.tags ?? []

  return (
    <div className="flex flex-col gap-4">
      {/* Card selector dropdown */}
      <div className="flex items-center gap-3">
        <label htmlFor="why-tag-card-select" className="text-sm text-text-secondary">
          Card:
        </label>
        <select
          id="why-tag-card-select"
          value={selectedCard}
          onChange={(e) => setSelectedCard(e.target.value)}
          className={cn(
            'rounded-lg border border-border-default bg-bg-tertiary px-3 py-1.5 text-sm text-text-primary',
            'outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus'
          )}
        >
          {data.map((d) => (
            <option key={d.cardName} value={d.cardName}>
              {d.cardName}
            </option>
          ))}
        </select>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center text-sm text-text-tertiary">
          No tags recorded for this card.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <CartesianGrid stroke="#2a2a3d" strokeDasharray="3 3" />
            <XAxis
              dataKey="tag"
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
            <Legend
              verticalAlign="bottom"
              wrapperStyle={{ color: '#9394a5', fontSize: 11, paddingTop: 10 }}
            />
            <Bar
              dataKey="winCount"
              fill="#34d399"
              name="Wins"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="lossCount"
              fill="#f87171"
              name="Losses"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export { WhyTagBreakdown }
export type { WhyTagBreakdownProps, CardTagData, TagCount }
