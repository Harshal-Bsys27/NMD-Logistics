import React from 'react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'

export default function Sidebar() {
  return (
    <aside className="surface-glass hidden w-64 shrink-0 self-start rounded-2xl p-3 lg:block">
      <div className="mb-5 flex items-center justify-between px-3 pt-2">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Workspace</h4>
        <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">LIVE</span>
      </div>

      <nav className="space-y-1">
        <Link href="/dashboard" className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-cyan-300">
          <span>Dashboard</span>
        </Link>

        <Link href="/orders" className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-cyan-300">
          <span>Orders</span>
          <Badge className="ml-2">4</Badge>
        </Link>

        <Link href="/drivers" className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-cyan-300">
          <span>Drivers</span>
          <Badge className="ml-2">3</Badge>
        </Link>

        <Link href="/assignments" className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-cyan-300">
          <span>Assignments</span>
          <Badge variant="warning" className="ml-2">2</Badge>
        </Link>

        <Link href="/settings" className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-cyan-300">
          <span>Settings</span>
        </Link>
      </nav>
    </aside>
  )
}
