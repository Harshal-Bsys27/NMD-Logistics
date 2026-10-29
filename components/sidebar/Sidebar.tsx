'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import {
  LayoutDashboard,
  Package,
  Truck,
  Zap,
  BarChart3,
  Activity,
  FileCode2,
  FileText,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/utils/helpers';

const navigationGroups = [
  {
    label: 'Main',
    items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Management',
    items: [
      { href: '/orders', label: 'Orders', icon: Package, badge: '4' },
      { href: '/drivers', label: 'Drivers', icon: Truck, badge: '3' },
      { href: '/assignments', label: 'Assignments', icon: Zap, badge: '2' },
      { href: '/reports', label: 'Reports', icon: FileText },
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/status', label: 'Status', icon: Activity },
      { href: '/api-docs', label: 'API Docs', icon: FileCode2 },
    ],
  },
];

const bottomItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/help', label: 'Help & Support', icon: HelpCircle },
];

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn(
      'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-card text-card-foreground transition-[width] duration-200 lg:flex',
      collapsed ? 'w-[72px]' : 'w-64'
    )}>
      <div className={cn('flex h-16 shrink-0 items-center border-b border-border', collapsed ? 'justify-center px-2' : 'justify-start px-4')}>
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground">N</span>
          {!collapsed && <span className="truncate text-sm font-semibold">NMD Logistics</span>}
        </Link>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        {navigationGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</p>}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    className={cn(
                      'relative flex min-h-11 items-center rounded-md text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      collapsed ? 'justify-center px-2' : 'justify-between px-3',
                      isActive ? 'bg-primary/10 text-primary before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </span>
                    {!collapsed && 'badge' in item && item.badge && <Badge className="ml-2 shrink-0">{item.badge}</Badge>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-border p-3">
        <nav className="space-y-1" aria-label="Workspace settings">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex min-h-11 items-center rounded-md text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  collapsed ? 'justify-center px-2' : 'gap-3 px-3',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={cn(
          'mt-3 rounded-xl border border-border bg-muted/40 p-2',
          collapsed && 'px-1.5'
        )}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan-500 text-xs font-semibold text-primary-foreground">
              HB
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">Harshal</p>
                <p className="text-[11px] text-muted-foreground">Admin</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
