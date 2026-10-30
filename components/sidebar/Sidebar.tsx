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
  Route,
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
      { href: '/dispatch', label: 'Dispatch', icon: Route },
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
      'fixed bottom-0 left-0 top-[var(--navbar-height)] z-40 hidden flex-col border-r border-on-brand/10 bg-brand-900 text-on-brand transition-[width] duration-200 dark:bg-brand-950 lg:flex',
      collapsed ? 'w-[76px]' : 'w-[264px]'
    )}>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5" aria-label="Main navigation">
        {navigationGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-on-brand/75">{group.label}</p>}
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
                      'relative flex min-h-11 items-center rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                      collapsed ? 'justify-center px-2' : 'justify-between px-3',
                      isActive ? 'bg-on-brand/10 text-on-brand before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-accent' : 'text-on-brand/75 hover:bg-on-brand/10 hover:text-on-brand'
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </span>
                    {!collapsed && 'badge' in item && item.badge && <Badge className="ml-2 shrink-0 !bg-on-brand/15 !text-on-brand">{item.badge}</Badge>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-on-brand/10 p-3 pb-14">
        <nav className="space-y-1" aria-label="Workspace settings">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? item.label : undefined}
                className={cn(
                  'flex min-h-11 items-center rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  collapsed ? 'justify-center px-2' : 'gap-3 px-3',
                  isActive
                    ? 'bg-on-brand/10 text-on-brand'
                    : 'text-on-brand/75 hover:bg-on-brand/10 hover:text-on-brand'
                )}
              >
                <Icon className="h-5 w-5" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={cn(
          'mt-3 rounded-lg border border-on-brand/10 bg-on-brand/10 p-2',
          collapsed && 'px-1.5'
        )}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-warning text-xs font-semibold text-accent-foreground">
              HB
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-on-brand">Harshal</p>
                <p className="text-[11px] text-on-brand/75">Admin</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
