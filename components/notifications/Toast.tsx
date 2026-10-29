'use client'

import React, { useEffect } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastProps {
  id: string
  message: string
  type?: ToastType
  duration?: number
  onClose: (id: string) => void
}

const toastStyles: Record<ToastType, { bg: string; border: string; icon: React.ReactNode; text: string }> = {
  success: {
    bg: 'bg-success',
    border: 'border-success/30',
    icon: <CheckCircle2 className="h-5 w-5 text-success-foreground" />,
    text: 'text-success-foreground',
  },
  error: {
    bg: 'bg-danger',
    border: 'border-danger/30',
    icon: <AlertCircle className="h-5 w-5 text-danger-foreground" />,
    text: 'text-danger-foreground',
  },
  info: {
    bg: 'bg-info',
    border: 'border-info/30',
    icon: <Info className="h-5 w-5 text-info-foreground" />,
    text: 'text-info-foreground',
  },
  warning: {
    bg: 'bg-warning',
    border: 'border-warning/30',
    icon: <AlertCircle className="h-5 w-5 text-warning-foreground" />,
    text: 'text-warning-foreground',
  },
}

export default function Toast({ id, message, type = 'info', duration = 5000, onClose }: ToastProps) {
  const style = toastStyles[type]

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onClose(id), duration)
      return () => clearTimeout(timer)
    }
  }, [id, duration, onClose])

  return (
    <div
      className={`${style.bg} ${style.border} animate-in flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg`}
      role="alert"
    >
      {style.icon}
      <p className={`flex-1 text-sm ${style.text}`}>{message}</p>
      <button
        type="button"
        aria-label="Close notification"
        onClick={() => onClose(id)}
        className="min-h-[44px] min-w-[44px] text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
