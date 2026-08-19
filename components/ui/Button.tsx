import React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger'
}

export default function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition'
  const variants: Record<string, string> = {
    primary: 'bg-cyan-500 hover:bg-cyan-600 text-white',
    ghost: 'bg-transparent hover:bg-slate-800 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  }

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
