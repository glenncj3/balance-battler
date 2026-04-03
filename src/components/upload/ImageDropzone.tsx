'use client'

import { Dropzone } from '@/components/ui/Dropzone'

interface ImageDropzoneProps {
  files: File[]
  onDrop: (files: File[]) => void
  disabled?: boolean
}

export function ImageDropzone({ files, onDrop, disabled }: ImageDropzoneProps) {
  const fileCount = files.length
  const status = fileCount > 0 ? 'ready' : 'idle'
  const fileInfo = fileCount > 0 ? `${fileCount} image${fileCount !== 1 ? 's' : ''} selected` : undefined

  return (
    <Dropzone
      accept={{
        'image/png': ['.png'],
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/webp': ['.webp'],
      }}
      multiple
      onDrop={onDrop}
      label="Drop card images here"
      sublabel="PNG, JPG, or WebP files"
      fileInfo={fileInfo}
      status={status}
      disabled={disabled}
    />
  )
}
