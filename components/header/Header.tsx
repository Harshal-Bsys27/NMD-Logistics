import React from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function Header() {
  return (
    <header className="w-full border-b border-slate-800 bg-slate-950/50">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/">
            <span className="text-xl font-bold text-white">NMD Logistics</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <input
              placeholder="Search orders, drivers..."
              className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500"
            />
          </div>
          <Button variant="ghost">New Order</Button>
          <Button variant="ghost">Profile</Button>
        </div>
      </div>
    </header>
  )
}
