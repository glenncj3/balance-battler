'use client'

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ZAxis,
} from 'recharts'
import { getRarityColor } from '@/lib/rarity-colors'

interface ScatterPoint {
  name: string
  rarity: string
  rating: number
}

interface RarityRatingScatterProps {
  data: ScatterPoint[]
}

// Map Tailwind classes to hex colors for Recharts
const RARITY_HEX: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#6ee7b7',
  rare: '#93c5fd',
  epic: '#c084fc',
  mythic: '#fbbf24',
  legendary: '#fb923c',
}

function getHexColor(rarity: string): string {
  return RARITY_HEX[rarity.toLowerCase()] ?? '#d8b4fe'
}

function RarityRatingScatter({ data }: RarityRatingScatterProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-text-tertiary">
        No scatter data available.
      </div>
    )
  }

  // Group by rarity
  const rarityGroups = new Map<string, { name: string; rating: number; index: number }[]>()
  const rarityOrder: string[] = []

  for (const point of data) {
    if (!rarityGroups.has(point.rarity)) {
      rarityGroups.set(point.rarity, [])
      rarityOrder.push(point.rarity)
    }
    rarityGroups.get(point.rarity)!.push({
      name: point.name,
      rating: point.rating,
      index: rarityOrder.indexOf(point.rarity),
    })
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
        <CartesianGrid stroke="#2a2a3d" strokeDasharray="3 3" />
        <XAxis
          type="category"
          dataKey="index"
          tick={{ fill: '#9394a5', fontSize: 11 }}
          axisLine={{ stroke: '#3d3d5c' }}
          tickFormatter={(value: number) => rarityOrder[value] ?? ''}
          name="Rarity"
          allowDuplicatedCategory={false}
        />
        <YAxis
          type="number"
          dataKey="rating"
          tick={{ fill: '#9394a5', fontSize: 11 }}
          axisLine={{ stroke: '#3d3d5c' }}
          name="Rating"
          label={{
            value: 'Elo Rating',
            angle: -90,
            position: 'insideLeft',
            fill: '#9394a5',
          }}
        />
        <ZAxis range={[40, 40]} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a2e',
            border: '1px solid #3d3d5c',
            color: '#e2e2e9',
            borderRadius: '8px',
          }}
          formatter={(value, _name, props) => {
            const payload = props?.payload as { name?: string } | undefined
            return [Number(value), payload?.name ?? 'Rating']
          }}
        />
        <Legend
          verticalAlign="bottom"
          wrapperStyle={{ color: '#9394a5', fontSize: 11, paddingTop: 10 }}
        />
        {Array.from(rarityGroups.entries()).map(([rarity, points]) => (
          <Scatter
            key={rarity}
            name={rarity}
            data={points}
            fill={getHexColor(rarity)}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  )
}

export { RarityRatingScatter }
export type { RarityRatingScatterProps, ScatterPoint }
