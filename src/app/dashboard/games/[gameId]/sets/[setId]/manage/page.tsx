'use client'

import { useParams } from 'next/navigation'
import { CardManager } from '@/components/manage/CardManager'

export default function ManagePage() {
  const params = useParams<{ gameId: string; setId: string }>()

  return (
    <div>
      <CardManager setId={params.setId} gameId={params.gameId} />
    </div>
  )
}
