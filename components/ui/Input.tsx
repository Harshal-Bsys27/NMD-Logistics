import React from 'react'

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export default function Input(props: InputProps) {
  return (
    <input
      {...props}
      className={`mt-1 block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${props.className ?? ''}`}
    />
  )
}
