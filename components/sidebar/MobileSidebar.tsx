'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Activity, BarChart3, FileCode2, FileText, HelpCircle, LayoutDashboard, LogOut, Menu, Package, Settings, Truck, X, Zap, Route, Users } from 'lucide-react'
import Button from '@/components/ui/Button'
import ThemeToggle from '@/components/layout/ThemeToggle'
import { useAuth } from '@/hooks'

const mobileGroups = [
  { label: 'Main', links: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    label: 'Management',
    links: [
      { href: '/orders', label: 'Orders', icon: Package },
      { href: '/drivers', label: 'Drivers', icon: Truck },
      { href: '/users', label: 'Invites & staff', icon: Users, adminOnly: true },
      { href: '/assignments', label: 'Assignments', icon: Zap },
      { href: '/dispatch', label: 'Dispatch', icon: Route },
      { href: '/reports', label: 'Reports', icon: FileText },
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'System',
    links: [
      { href: '/status', label: 'Status', icon: Activity },
      { href: '/api-docs', label: 'API Docs', icon: FileCode2, adminOnly: true },
    ],
  },
]

export default function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()

  const handleSignOut = () => {
    setOpen(false)
    router.push('/auth/signout')
  }

  return (
    <div className="lg:hidden">
      <Button
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={open}
        title="Open navigation menu"
        onClick={() => setOpen(true)}
        className="h-10 w-10 min-h-10 justify-center rounded-lg border-0 p-0 text-on-brand hover:bg-on-brand/10 hover:text-on-brand focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-foreground/50"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-dvh max-h-screen w-[min(18rem,calc(100vw-2.5rem))] flex-col border-r border-border bg-background p-4 text-foreground shadow-2xl sm:p-5">
            <div className="mb-5 flex shrink-0 items-center justify-between sm:mb-8">
              <h2 className="text-lg font-semibold text-foreground">Navigation</h2>
              <Button type="button" variant="ghost" aria-label="Close navigation menu" title="Close navigation menu" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto pb-4" aria-label="Mobile navigation">
              {mobileGroups.map((group) => {
                const visibleLinks = group.links
                  .filter(() => !loading && !!user)
                  .filter((item) => user?.role !== 'delivery_personnel' || item.href === '/assignments')
                  .filter((item) => !('adminOnly' in item) || !item.adminOnly || user?.role === 'admin')
                if (!visibleLinks.length) return null

                return (
                <section key={group.label}>
                  <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</h3>
                  <div className="space-y-1">
                    {visibleLinks.map((item) => {
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
                        </Link>
                      )
                    })}
                  </div>
                </section>
                )
              })}
            </nav>
            <div className="shrink-0 space-y-1 border-t border-border bg-background pt-3">
              {!loading && user && <Link href="/settings" onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><Settings className="h-5 w-5" />{user.role === 'delivery_personnel' ? 'My profile' : 'Settings'}</Link>}
              {!loading && user && user.role !== 'delivery_personnel' && <Link href="/help" onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><HelpCircle className="h-5 w-5" />Help & Support</Link>}
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
