import React from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import ThemeToggle from '@/components/theme/ThemeToggle'

export default function Header() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/75 backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-950/75">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-lg font-bold text-cyan-300 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/40 dark:bg-cyan-400 dark:text-slate-950">
              N
            </div>
            <div>
              <div className="text-base font-semibold text-slate-950 dark:text-white">NMD Logistics</div>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Operations live</div>
            </div>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="hidden w-full max-w-sm sm:block">
            <input
              aria-label="Search"
              placeholder="Search orders, drivers..."
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-900/80 dark:text-white dark:placeholder-slate-500"
            />
          </div>
          <Button variant="primary" className="hidden sm:inline-flex">New Order</Button>
          <Button variant="ghost">Profile</Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
