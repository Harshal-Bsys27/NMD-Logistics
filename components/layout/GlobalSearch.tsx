'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Package, Truck, LayoutDashboard, ClipboardList, BarChart3, Settings } from 'lucide-react';
import { mockDrivers, mockOrders } from '@/services/mockData';

interface SearchResult {
  label: string;
  detail: string;
  href: string;
  icon: typeof Package;
}

const pages: SearchResult[] = [
  { label: 'Dashboard', detail: 'Operations overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Assignments', detail: 'Dispatch and delivery activity', href: '/assignments', icon: ClipboardList },
  { label: 'Analytics', detail: 'Performance reports', href: '/analytics', icon: BarChart3 },
  { label: 'Settings', detail: 'Workspace preferences', href: '/settings', icon: Settings },
];

export default function GlobalSearch() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [shortcut, setShortcut] = useState('Ctrl K');

  useEffect(() => {
    setShortcut(/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K');
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const orders = useMemo(() => mockOrders
    .filter((order) => `${order.order_number} ${order.client_name}`.toLowerCase().includes(normalizedQuery))
    .slice(0, 4)
    .map((order) => ({ label: order.order_number, detail: order.client_name, href: `/orders/${order.id}`, icon: Package })), [normalizedQuery]);
  const drivers = useMemo(() => mockDrivers
    .filter((driver) => `${driver.employee_id} ${driver.vehicle_number}`.toLowerCase().includes(normalizedQuery))
    .slice(0, 4)
    .map((driver) => ({ label: driver.employee_id, detail: driver.vehicle_number, href: `/drivers/${driver.id}`, icon: Truck })), [normalizedQuery]);
  const filteredPages = useMemo(() => pages.filter((item) => `${item.label} ${item.detail}`.toLowerCase().includes(normalizedQuery)), [normalizedQuery]);

  const selectResult = (href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  };

  const results = [
    { title: 'Orders', items: orders },
    { title: 'Drivers', items: drivers },
    { title: 'Pages', items: filteredPages },
  ].filter((group) => group.items.length > 0);

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <div className="relative hidden md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search..."
          aria-label="Search orders, drivers, and pages"
          aria-expanded={open}
          aria-controls="global-search-results"
          className="hidden w-full min-w-[280px] max-w-[520px] rounded-lg border border-border bg-background pl-10 pr-16 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:block"
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search..."
          aria-label="Search orders, drivers, and pages"
          aria-expanded={open}
          aria-controls="global-search-results"
          className="block w-full min-w-[280px] max-w-[520px] rounded-lg border border-border bg-background pl-10 pr-16 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:hidden"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{shortcut}</kbd>
      </div>
      <button
        type="button"
        aria-label="Open search"
        title="Search"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
      >
        <Search className="h-5 w-5" />
      </button>

      {open && (
        <div id="global-search-results" role="dialog" aria-label="Search logistics records" className="absolute right-0 top-[calc(100%+8px)] z-[60] w-[min(520px,calc(100vw-32px))] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl">
          <div className="border-b border-border p-3 md:hidden">
            <label className="relative block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search orders, drivers, assignments..." className="min-h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </label>
          </div>
          <div className="max-h-[min(65vh,480px)] overflow-y-auto p-2">
            {results.length ? results.map((group) => (
              <section key={group.title} className="mb-2 last:mb-0">
                <h3 className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{group.title}</h3>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={`${group.title}-${item.href}`} type="button" onClick={() => selectResult(item.href)} className="flex min-h-11 w-full items-center gap-3 rounded-md px-2 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{item.label}</span>
                      <span className="max-w-[45%] truncate text-xs text-muted-foreground">{item.detail}</span>
                    </button>
                  );
                })}
              </section>
            )) : <p className="px-3 py-8 text-center text-sm text-muted-foreground">No matches found.</p>}
          </div>
          <div className="flex justify-end border-t border-border px-3 py-2 text-xs text-muted-foreground">Esc to close</div>
        </div>
      )}
    </div>
  );
}