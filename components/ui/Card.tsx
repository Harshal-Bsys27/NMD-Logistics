import React from 'react'

type CardProps = React.HTMLAttributes<HTMLDivElement>

export default function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div className={`rounded-lg bg-slate-900/60 border border-slate-800 p-4 ${className}`} {...props}>
      {children}
    </div>
  )
}
