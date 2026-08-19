import React from 'react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-950/40 p-4 lg:block">
      <div className="mb-6 px-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Main</h4>
      </div>

      <nav className="space-y-1 px-2">
        <Link href="/dashboard" className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-white hover:bg-slate-900/40">
          <span>Dashboard</span>
        </Link>

        <Link href="/orders" className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-white hover:bg-slate-900/40">
          <span>Orders</span>
          <Badge className="ml-2">4</Badge>
        </Link>

        <Link href="/drivers" className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-white hover:bg-slate-900/40">
          <span>Drivers</span>
          <Badge className="ml-2">3</Badge>
        </Link>

        <Link href="/assignments" className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-white hover:bg-slate-900/40">
          <span>Assignments</span>
          <Badge variant="warning" className="ml-2">2</Badge>
        </Link>

        <Link href="/settings" className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-white hover:bg-slate-900/40">
          <span>Settings</span>
        </Link>
      </nav>
    </aside>
  )
}
