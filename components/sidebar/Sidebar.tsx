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
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { cn } from '@/utils/helpers';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
  { href: '/orders', label: 'Orders', icon: Package, badge: '4' },
  { href: '/drivers', label: 'Drivers', icon: Truck, badge: '3' },
  { href: '/assignments', label: 'Assignments', icon: Zap, badge: '2' },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, badge: null },
];

const bottomItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/help', label: 'Help & Support', icon: HelpCircle },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="surface-glass hidden w-64 shrink-0 self-start flex-col rounded-2xl p-4 lg:flex">
      {/* Workspace Header */}
      <div className="mb-6 flex items-center justify-between px-2">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Workspace</h4>
        <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">LIVE</span>
      </div>

      {/* Main Navigation */}
      <nav className="mb-8 flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition',
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-600 dark:text-cyan-300'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>
              {item.badge && <Badge className="ml-auto">{item.badge}</Badge>}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mb-4 h-px bg-gradient-to-r from-slate-800 via-slate-700 to-transparent" />

      {/* Bottom Navigation */}
      <nav className="space-y-1">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition',
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-600 dark:text-cyan-300'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <button className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20">
        <LogOut className="h-5 w-5" />
        <span>Sign out</span>
      </button>
    </aside>
  );
}
