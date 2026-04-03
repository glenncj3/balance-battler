'use client'

import { Dropzone } from '@/components/ui/Dropzone'

interface CsvDropzoneProps {
  file: File | null
  onDrop: (files: File[]) => void
  disabled?: boolean
}

export function CsvDropzone({ file, onDrop, disabled }: CsvDropzoneProps) {
  const status = file ? 'ready' : 'idle'
  const fileInfo = file ? file.name : undefined

  return (
    <Dropzone
      accept={{
        'text/csv': ['.csv'],
        'application/vnd.ms-excel': ['.csv'],
      }}
      multiple={false}
      onDrop={onDrop}
      label="Drop CSV metadata file here"
      sublabel="CSV with columns: filename, name, rarity, type"
      fileInfo={fileInfo}
      status={status}
      disabled={disabled}
    />
  )
}
