'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Circle, PackageCheck, Settings2, ShieldAlert } from 'lucide-react';
import { mockNotifications, type MockNotification } from '@/services/mockNotifications';
import { cn } from '@/utils/helpers';

const iconMap = {
  order: PackageCheck,
  assignment: ShieldAlert,
  system: Settings2,
};

export default function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Node) || !containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const unreadCount = mockNotifications.filter((item) => item.unread).length;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        title="Notifications"
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <button type="button" className="text-sm text-muted-foreground transition hover:text-foreground">
              Mark all as read
            </button>
          </div>
          <div className="max-h-[420px] overflow-y-auto p-2">
            {mockNotifications.length ? (
              mockNotifications.map((item: MockNotification) => {
                const Icon = iconMap[item.kind];
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={cn(
                      'flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      item.unread && 'bg-muted/70'
                    )}
                  >
                    <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                        {item.unread && <Circle className="h-2 w-2 fill-current text-primary" />}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{item.timeAgo}</p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 px-4 py-6 text-center text-sm text-muted-foreground">
                <CheckCheck className="h-8 w-8" />
                <p>You’re all caught up.</p>
              </div>
            )}
          </div>
          <div className="border-t border-border px-4 py-3 text-center text-sm font-medium text-primary">
            View all
          </div>
        </div>
      )}
    </div>
  );
}
