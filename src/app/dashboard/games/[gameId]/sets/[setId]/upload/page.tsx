'use client'

import { useParams } from 'next/navigation'
import { UploadWizard } from '@/components/upload/UploadWizard'

export default function UploadPage() {
  const params = useParams<{ gameId: string; setId: string }>()

  return (
    <div>
      <h2 className="text-lg font-semibold text-text-primary mb-4">Upload Cards</h2>
      <UploadWizard setId={params.setId} gameId={params.gameId} />
    </div>
  )
}
