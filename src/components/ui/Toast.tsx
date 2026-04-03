'use client'

import toast, { Toaster } from 'react-hot-toast'

function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border-default)',
          borderRadius: '0.75rem',
          padding: '12px 16px',
          fontSize: '0.875rem',
        },
        success: {
          iconTheme: {
            primary: 'var(--color-success)',
            secondary: 'var(--color-bg-secondary)',
          },
        },
        error: {
          iconTheme: {
            primary: 'var(--color-error)',
            secondary: 'var(--color-bg-secondary)',
          },
        },
      }}
    />
  )
}

const showToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) =>
    toast(message, {
      icon: '\u2139\uFE0F',
    }),
  warning: (message: string) =>
    toast(message, {
      icon: '\u26A0\uFE0F',
    }),
  loading: (message: string) => toast.loading(message),
  dismiss: (toastId?: string) => toast.dismiss(toastId),
}

export { ToastProvider, showToast }
