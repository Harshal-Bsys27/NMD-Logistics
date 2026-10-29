'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Activity, BarChart3, FileCode2, FileText, HelpCircle, LayoutDashboard, LogOut, Package, Settings, Truck, Zap } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ThemeToggle from '@/components/layout/ThemeToggle'
import { authService } from '@/services/auth'

const mobileGroups = [
  { label: 'Main', links: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    label: 'Management',
    links: [
      { href: '/orders', label: 'Orders', icon: Package, badge: '4' },
      { href: '/drivers', label: 'Drivers', icon: Truck, badge: '3' },
      { href: '/assignments', label: 'Assignments', icon: Zap, badge: '2' },
      { href: '/reports', label: 'Reports', icon: FileText },
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'System',
    links: [
      { href: '/status', label: 'Status', icon: Activity },
      { href: '/api-docs', label: 'API Docs', icon: FileCode2 },
    ],
  },
]

export default function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const { error } = await authService.signOut()
    if (!error) {
      setOpen(false)
      router.replace('/auth/signin')
      router.refresh()
    }
  }

  return (
    <div className="lg:hidden">
      <Button
        type="button"
        variant="ghost"
        aria-label="Open navigation menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="min-h-11 border border-border px-3"
      >
        Menu
      </Button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-foreground/50"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-72 border-r border-border bg-background p-5 text-foreground shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Navigation</h2>
              <Button type="button" variant="ghost" aria-label="Close navigation menu" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>

            <nav className="max-h-[calc(100dvh-220px)] space-y-5 overflow-y-auto pb-2" aria-label="Mobile navigation">
              {mobileGroups.map((group) => (
                <section key={group.label}>
                  <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</h3>
                  <div className="space-y-1">
                    {group.links.map((item) => {
                      const Icon = item.icon
                      const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          aria-current={active ? 'page' : undefined}
                          className={`flex min-h-11 items-center justify-between rounded-md px-3 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? 'bg-primary/10 font-semibold text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                        >
                          <span className="flex items-center gap-3"><Icon className="h-5 w-5" />{item.label}</span>
                          {'badge' in item && item.badge && <Badge>{item.badge}</Badge>}
                        </Link>
                      )
                    })}
                  </div>
                </section>
              ))}
            </nav>
            <div className="absolute inset-x-0 bottom-0 space-y-1 border-t border-border bg-background p-4">
              <Link href="/settings" onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><Settings className="h-5 w-5" />Settings</Link>
              <Link href="/help" onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><HelpCircle className="h-5 w-5" />Help & Support</Link>
              <div className="flex items-center justify-between px-3 pt-2">
                <button onClick={handleSignOut} className="inline-flex min-h-11 items-center gap-2 text-sm text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><LogOut className="h-5 w-5" />Sign out</button>
                <ThemeToggle />
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
