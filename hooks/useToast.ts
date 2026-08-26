'use client'

import { useContext } from 'react'
import { ToastContext, ToastContextType } from '@/components/notifications/ToastContainer'

export function useToast(): ToastContextType {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastContainer provider')
  }
  return context
}
