'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Users,
} from 'lucide-react';
import { cn } from '@/utils/helpers';
import { useAuth } from '@/hooks';

const navigationGroups = [
  {
    label: 'Main',
    items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Management',
    items: [
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
    items: [
      { href: '/status', label: 'Status', icon: Activity },
      { href: '/api-docs', label: 'API Docs', icon: FileCode2, adminOnly: true },
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
  const { user, loading } = useAuth();
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Account';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'N';
  const roleLabel = user?.role === 'delivery_personnel'
    ? 'Delivery personnel'
    : user?.role === 'supervisor'
      ? 'Supervisor'
      : user?.role === 'admin'
        ? 'Admin'
        : 'Workspace user';

  return (
    <aside className={cn(
      'fixed bottom-0 left-0 top-[var(--navbar-height)] z-40 hidden flex-col border-r border-on-brand/10 bg-brand-900 text-on-brand transition-[width] duration-200 dark:bg-brand-950 lg:flex',
      collapsed ? 'w-[76px]' : 'w-[264px]'
    )}>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5" aria-label="Main navigation">
        {navigationGroups.map((group) => {
          const visibleItems = group.items
            .filter(() => !loading && !!user)
            .filter((item) => user?.role !== 'delivery_personnel' || item.href === '/assignments')
            .filter((item) => !('adminOnly' in item) || !item.adminOnly || user?.role === 'admin');
          if (!visibleItems.length) return null;

          return (
          <div key={group.label}>
            {!collapsed && <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-on-brand/75">{group.label}</p>}
            <div className="space-y-1">
              {visibleItems.map((item) => {
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
                  </Link>
                );
              })}
            </div>
          </div>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-on-brand/10 p-3 pb-14">
        <nav className="space-y-1" aria-label="Workspace settings">
          {bottomItems.filter((item) => !loading && !!user && (user.role !== 'delivery_personnel' || item.href === '/settings' || item.href === '/help')).map((item) => {
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
              {loading ? '…' : initials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-on-brand">{loading ? 'Loading account' : displayName}</p>
                <p className="text-[11px] capitalize text-on-brand/75">{roleLabel}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
