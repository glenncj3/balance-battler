'use client'

import { useParams } from 'next/navigation'
import { SetSettingsForm } from '@/components/settings/SetSettingsForm'

export default function SetSettingsPage() {
  const params = useParams<{ gameId: string; setId: string }>()

  return (
    <div>
      <SetSettingsForm setId={params.setId} gameId={params.gameId} />
    </div>
  )
}
