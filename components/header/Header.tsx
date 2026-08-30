'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Bell, ChevronDown } from 'lucide-react';

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-700/50 bg-gradient-to-b from-slate-900 to-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        {/* Logo and Brand */}
        <Link href="/dashboard" className="flex items-center gap-3 flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 text-lg font-bold text-white shadow-lg shadow-cyan-500/30">
            N
          </div>
          <div className="hidden sm:block">
            <div className="text-base font-bold text-white">NMD Logistics</div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Operations live
            </div>
          </div>
        </Link>

        {/* Search Bar - Desktop */}
        <div className="hidden flex-1 max-w-md sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="Search"
              placeholder="Search orders, drivers, assignments..."
              className="w-full rounded-xl border border-slate-700/50 bg-slate-800/40 px-10 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* New Order Button */}
          <button className="hidden items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-90 sm:inline-flex">
            <Plus className="h-4 w-4" />
            New Order
          </button>

          {/* Notifications */}
          <button className="relative rounded-xl p-2.5 text-slate-300 transition hover:bg-slate-800 hover:text-white">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
          </button>

          {/* Mobile Search Toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="sm:hidden rounded-xl p-2.5 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-bold text-white">
                HB
              </div>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {searchOpen && (
        <div className="border-t border-slate-700/50 bg-slate-900/50 px-4 py-3 sm:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="Search"
              placeholder="Search orders, drivers..."
              className="w-full rounded-xl border border-slate-700/50 bg-slate-800/40 px-10 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
}
