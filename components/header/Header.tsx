import React from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function Header() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800/90 bg-slate-950/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15 text-lg text-cyan-400 ring-1 ring-cyan-500/30">
              N
            </div>
            <div>
              <div className="text-base font-semibold text-white">NMD Logistics</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Operations live</div>
            </div>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="hidden w-full max-w-sm sm:block">
            <input
              aria-label="Search"
              placeholder="Search orders, drivers..."
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
          <Button variant="primary" className="hidden sm:inline-flex">New Order</Button>
          <Button variant="ghost">Profile</Button>
        </div>
      </div>
    </header>
  )
}
