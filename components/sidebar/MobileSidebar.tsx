'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

export default function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <div className="lg:hidden">
      <Button
        type="button"
        variant="ghost"
        aria-label="Open navigation menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="border border-slate-700 px-3"
      >
        Menu
      </Button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-72 border-r border-slate-800 bg-slate-950 p-5 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Navigation</h2>
              <Button type="button" variant="ghost" aria-label="Close navigation menu" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>

            <nav className="space-y-1" aria-label="Mobile navigation">
              <Link href="/dashboard" onClick={() => setOpen(false)} className="block rounded-md px-3 py-3 text-sm text-white hover:bg-slate-900">
                Dashboard
              </Link>
              <Link href="/orders" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-md px-3 py-3 text-sm text-white hover:bg-slate-900">
                Orders <Badge>4</Badge>
              </Link>
              <Link href="/drivers" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-md px-3 py-3 text-sm text-white hover:bg-slate-900">
                Drivers <Badge>3</Badge>
              </Link>
              <Link href="/assignments" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-md px-3 py-3 text-sm text-white hover:bg-slate-900">
                Assignments <Badge variant="warning">2</Badge>
              </Link>
              <Link href="/settings" onClick={() => setOpen(false)} className="block rounded-md px-3 py-3 text-sm text-white hover:bg-slate-900">
                Settings
              </Link>
            </nav>
          </aside>
        </div>
      )}
    </div>
  )
}
