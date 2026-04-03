'use client'

import { useParams } from 'next/navigation'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'

export default function AnalyticsPage() {
  const params = useParams<{ gameId: string; setId: string }>()

  return (
    <div>
      <AnalyticsDashboard setId={params.setId} />
    </div>
  )
}
