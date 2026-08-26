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
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
    text: 'text-emerald-300',
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    icon: <AlertCircle className="h-5 w-5 text-red-400" />,
    text: 'text-red-300',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: <Info className="h-5 w-5 text-blue-400" />,
    text: 'text-blue-300',
  },
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    icon: <AlertCircle className="h-5 w-5 text-yellow-400" />,
    text: 'text-yellow-300',
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
        className="text-slate-400 hover:text-slate-300"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
