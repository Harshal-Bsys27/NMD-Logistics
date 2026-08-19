import React from 'react'

type BadgeProps = {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-slate-800 text-white',
    success: 'bg-green-600 text-white',
    warning: 'bg-yellow-500 text-black',
    danger: 'bg-red-600 text-white',
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
