import React from 'react'

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

export default function Select(props: SelectProps) {
  return (
    <select
      {...props}
      className={`mt-1 block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${props.className ?? ''}`}
    />
  )
}
