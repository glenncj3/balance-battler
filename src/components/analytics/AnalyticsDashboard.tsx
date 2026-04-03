'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/cn'
import { ChartCard } from './ChartCard'
import { RatingHistogram, type HistogramBin } from './RatingHistogram'
import { ConvergenceChart, type ConvergenceCardData } from './ConvergenceChart'
import { VoteVelocityChart, type VelocityPoint } from './VoteVelocityChart'
import { RarityRatingScatter, type ScatterPoint } from './RarityRatingScatter'
import { DecisionTimeChart, type DecisionTimePoint } from './DecisionTimeChart'
import { OutliersList, type OutlierItem } from './OutliersList'
import { WhyTagBreakdown, type CardTagData } from './WhyTagBreakdown'
import { VoterSessionSummary, type VoterSessionData } from './VoterSessionSummary'

type TabKey =
  | 'distribution'
  | 'convergence'
  | 'head-to-head'
  | 'velocity'
  | 'outliers'
  | 'decision-time'
  | 'why-tags'
  | 'voters'
  | 'rarity-scatter'

interface TabDef {
  key: TabKey
  label: string
  metric: string
}

const TABS: TabDef[] = [
  { key: 'distribution', label: 'Distribution', metric: 'distribution' },
  { key: 'convergence', label: 'Convergence', metric: 'convergence' },
  { key: 'velocity', label: 'Velocity', metric: 'velocity' },
  { key: 'outliers', label: 'Outliers', metric: 'outliers' },
  { key: 'decision-time', label: 'Decision Time', metric: 'decision-time' },
  { key: 'why-tags', label: 'Why Tags', metric: 'why-tags' },
  { key: 'voters', label: 'Voters', metric: 'voters' },
  { key: 'rarity-scatter', label: 'Rarity Scatter', metric: 'rarity-scatter' },
]

interface AnalyticsDashboardProps {
  setId: string
}

type MetricData = {
  distribution: HistogramBin[]
  convergence: ConvergenceCardData[]
  velocity: VelocityPoint[]
  outliers: OutlierItem[]
  'decision-time': DecisionTimePoint[]
  'why-tags': CardTagData[]
  voters: VoterSessionData
  'rarity-scatter': ScatterPoint[]
  'head-to-head': unknown
}

function AnalyticsDashboard({ setId }: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('distribution')
  const [cache, setCache] = useState<Partial<Record<TabKey, unknown>>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMetric = useCallback(
    async (tab: TabKey) => {
      if (cache[tab] !== undefined) return

      setLoading(true)
      setError(null)

      try {
        const tabDef = TABS.find((t) => t.key === tab)
        if (!tabDef) return

        const res = await fetch(`/api/sets/${setId}/analytics?metric=${tabDef.metric}`)
        if (!res.ok) {
          throw new Error(`Failed to fetch ${tabDef.label} data`)
        }

        const data = await res.json()
        setCache((prev) => ({ ...prev, [tab]: data }))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    },
    [setId, cache]
  )

  useEffect(() => {
    fetchMetric(activeTab)
  }, [activeTab, fetchMetric])

  function renderTabContent() {
    if (loading && cache[activeTab] === undefined) {
      return (
        <div className="flex h-[300px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-default border-t-accent" />
            <p className="text-sm text-text-tertiary">Loading analytics...</p>
          </div>
        </div>
      )
    }

    if (error && cache[activeTab] === undefined) {
      return (
        <div className="flex h-[300px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-red-400">{error}</p>
            <button
              type="button"
              onClick={() => {
                setCache((prev) => {
                  const next = { ...prev }
                  delete next[activeTab]
                  return next
                })
                fetchMetric(activeTab)
              }}
              className="text-sm text-accent hover:text-accent-hover transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )
    }

    const data = cache[activeTab]

    switch (activeTab) {
      case 'distribution':
        return (
          <ChartCard
            title="Rating Distribution"
            subtitle="Histogram of Elo ratings across all cards"
          >
            <RatingHistogram data={(data as MetricData['distribution']) ?? []} />
          </ChartCard>
        )

      case 'convergence':
        return (
          <ChartCard
            title="Rating Convergence"
            subtitle="How card ratings have evolved over time"
          >
            <ConvergenceChart data={(data as MetricData['convergence']) ?? []} />
          </ChartCard>
        )

      case 'velocity':
        return (
          <ChartCard
            title="Vote Velocity"
            subtitle="Number of votes over time"
          >
            <VoteVelocityChart data={(data as MetricData['velocity']) ?? []} />
          </ChartCard>
        )

      case 'outliers':
        return (
          <ChartCard
            title="Outlier Cards"
            subtitle="Cards deviating significantly from both overall and rarity-tier averages"
          >
            <OutliersList outliers={(data as MetricData['outliers']) ?? []} />
          </ChartCard>
        )

      case 'decision-time':
        return (
          <ChartCard
            title="Average Decision Time"
            subtitle="How long voters take to decide on each card"
          >
            <DecisionTimeChart data={(data as MetricData['decision-time']) ?? []} />
          </ChartCard>
        )

      case 'why-tags':
        return (
          <ChartCard
            title="Why Tag Breakdown"
            subtitle="Win and loss tag counts per card"
          >
            <WhyTagBreakdown data={(data as MetricData['why-tags']) ?? []} />
          </ChartCard>
        )

      case 'voters':
        return (
          <ChartCard
            title="Voter Sessions"
            subtitle="Summary of voter engagement"
          >
            <VoterSessionSummary
              data={
                (data as MetricData['voters']) ?? {
                  uniqueVoters: 0,
                  avgVotesPerSession: 0,
                  totalSessions: 0,
                  retentionRate: 0,
                }
              }
            />
          </ChartCard>
        )

      case 'rarity-scatter':
        return (
          <ChartCard
            title="Rarity vs Rating"
            subtitle="Elo ratings plotted by rarity tier"
          >
            <RarityRatingScatter data={(data as MetricData['rarity-scatter']) ?? []} />
          </ChartCard>
        )

      case 'head-to-head':
        return (
          <ChartCard
            title="Head-to-Head"
            subtitle="Pairwise comparison results"
          >
            <div className="flex h-[300px] items-center justify-center text-sm text-text-tertiary">
              Head-to-head analysis coming soon.
            </div>
          </ChartCard>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Tab navigation */}
      <nav className="flex gap-1 overflow-x-auto border-b border-border-default">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg',
                isActive
                  ? 'text-accent'
                  : 'text-text-tertiary hover:text-text-primary hover:bg-bg-hover'
              )}
            >
              {tab.label}
              {isActive && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-accent rounded-full" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Tab content */}
      {renderTabContent()}
    </div>
  )
}

export { AnalyticsDashboard }
export type { AnalyticsDashboardProps }
