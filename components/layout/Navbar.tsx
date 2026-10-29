'use client';

import Link from 'next/link';
import { PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import GlobalSearch from '@/components/layout/GlobalSearch';
import ThemeToggle from '@/components/layout/ThemeToggle';
import NotificationsMenu from '@/components/layout/NotificationsMenu';
import ProfileMenu from '@/components/layout/ProfileMenu';
import MobileSidebar from '@/components/sidebar/MobileSidebar';

interface NavbarProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
}

export default function Navbar({ collapsed, onToggleSidebar }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 h-16 w-full border-b border-border bg-navbar/95 text-foreground backdrop-blur-sm shadow-[0_1px_3px_rgba(15,23,42,0.08)] dark:border-border dark:shadow-none">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary via-primary/80 to-cyan-500/80" aria-hidden="true" />
      <div className="relative flex h-full items-center justify-between gap-3 px-4 md:px-6 xl:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex items-center gap-2 lg:hidden">
            <MobileSidebar />
            <Link href="/dashboard" className="flex items-center gap-2 rounded-lg px-1 py-1">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">N</span>
            </Link>
          </div>

          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:inline-flex"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>

          <div className="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
            <div className="min-w-0 flex-1">
              <Breadcrumbs />
            </div>
          </div>
        </div>

        <div className="flex flex-1 justify-center md:flex-initial">
          <div className="w-full max-w-[520px] min-w-0">
            <GlobalSearch />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="hidden items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden lg:inline">New Order</span>
            <span className="lg:hidden">New</span>
          </button>

          <div className="hidden items-center gap-2 sm:flex">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Live
            </span>
          </div>

          <ThemeToggle />
          <NotificationsMenu />
          <div className="hidden h-6 w-px bg-border lg:block" />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
