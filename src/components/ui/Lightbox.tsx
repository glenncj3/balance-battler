'use client'

import { Modal } from './Modal'

interface LightboxProps {
  src: string
  alt?: string
  open: boolean
  onClose: () => void
}

function Lightbox({ src, alt = '', open, onClose }: LightboxProps) {
  return (
    <Modal open={open} onClose={onClose} size="fullscreen">
      <div
        className="flex h-full w-full items-center justify-center cursor-pointer"
        onClick={onClose}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-full max-w-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </Modal>
  )
}

export { Lightbox }
export type { LightboxProps }
