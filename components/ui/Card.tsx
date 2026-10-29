import React from 'react'

type CardProps = React.HTMLAttributes<HTMLDivElement>

export default function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div className={`rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm ${className}`} {...props}>
      {children}
    </div>
  )
}
