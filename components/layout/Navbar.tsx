'use client';

import { PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react';
import Logo from '@/components/brand/Logo';
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
    <header className="sticky top-0 z-50 h-16 w-full bg-[image:var(--navbar-gradient)] text-on-brand shadow-nav backdrop-blur-sm sm:h-[72px] lg:h-20">
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-accent via-warning to-brand-500" aria-hidden="true" />
      <div className="relative flex h-full items-center gap-2 px-3 sm:gap-3 sm:px-5 xl:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <div className="lg:hidden">
            <MobileSidebar />
          </div>
          <Logo size="sm" compact className="lg:hidden" />

          <div className="hidden shrink-0 items-center gap-2 border-r border-on-brand/15 pr-2 lg:flex">
            <Logo size="md" className="shrink-0" />
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-on-brand/80 transition-colors duration-150 hover:bg-on-brand/10 hover:text-on-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>

          <div className="hidden min-w-0 flex-1 xl:block">
            <Breadcrumbs />
          </div>
        </div>

        <div className="hidden min-w-0 max-w-xl flex-1 justify-center lg:flex">
          <GlobalSearch />
        </div>
        <div className="lg:hidden">
          <GlobalSearch compact />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label="Create new order"
            title="New Order"
            className="inline-flex h-10 w-10 items-center justify-center gap-2 rounded-xl bg-accent text-accent-foreground shadow-accent-button transition-all duration-150 hover:-translate-y-0.5 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-brand sm:w-auto sm:px-3 sm:text-sm sm:font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Order</span>
          </button>

          <div className="hidden items-center gap-2 sm:flex">
            <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-success-on-brand/40 bg-success-on-brand/15 px-3 text-[13px] font-medium text-success-on-brand shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-success-on-brand motion-reduce:animate-none" />
              Live
            </span>
          </div>

          <div className="hidden lg:block"><ThemeToggle /></div>
          <NotificationsMenu />
          <div className="hidden h-7 w-px bg-on-brand/20 lg:block" />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
