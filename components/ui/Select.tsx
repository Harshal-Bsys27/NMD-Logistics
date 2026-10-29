import React from 'react'

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

export default function Select(props: SelectProps) {
  return (
    <select
      {...props}
      className={`mt-1 block min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:light] dark:[color-scheme:dark] ${props.className ?? ''}`}
    />
  )
}
