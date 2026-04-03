'use client'

import { cn } from '@/lib/cn'
import { useDropzone } from 'react-dropzone'

interface DropzoneProps {
  accept?: Record<string, string[]>
  multiple?: boolean
  onDrop: (files: File[]) => void
  label: string
  sublabel?: string
  fileInfo?: string
  status?: 'idle' | 'ready' | 'error'
  className?: string
  disabled?: boolean
}

const statusBorderStyles: Record<string, string> = {
  idle: 'border-border-default',
  ready: 'border-success',
  error: 'border-error',
}

function Dropzone({
  accept,
  multiple = false,
  onDrop,
  label,
  sublabel,
  fileInfo,
  status = 'idle',
  className,
  disabled = false,
}: DropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    multiple,
    onDrop,
    disabled,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer',
        'bg-bg-secondary',
        isDragActive
          ? 'border-accent bg-accent/5'
          : statusBorderStyles[status] || statusBorderStyles.idle,
        !isDragActive && !disabled && 'hover:border-border-strong hover:bg-bg-tertiary',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input {...getInputProps()} />

      {/* Upload icon */}
      <svg
        className={cn(
          'h-10 w-10',
          isDragActive ? 'text-accent' : 'text-text-tertiary'
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
        />
      </svg>

      <p className="text-sm font-medium text-text-primary">{label}</p>

      {sublabel && (
        <p className="text-xs text-text-tertiary">{sublabel}</p>
      )}

      {fileInfo && (
        <p
          className={cn(
            'text-xs font-medium',
            status === 'error' ? 'text-error' : 'text-success'
          )}
        >
          {fileInfo}
        </p>
      )}
    </div>
  )
}

export { Dropzone }
export type { DropzoneProps }
