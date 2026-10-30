'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCheck, Circle, PackageCheck, ShieldAlert, Settings2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks';
import { useOperationsData } from '@/hooks/useOperationsData';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/utils/helpers';

type NotificationKind = 'order' | 'assignment' | 'system';
type RealtimeState = 'connecting' | 'live' | 'offline';
type BrowserPermission = NotificationPermission | 'unsupported';

interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  createdAt: string;
  href: string;
  unread: boolean;
}

interface NotificationStore {
  userId: string | null;
  items: AppNotification[];
}

const iconMap = {
  order: PackageCheck,
  assignment: ShieldAlert,
  system: Settings2,
};

const storageKey = (userId: string) => `nmd-notifications-${userId}`;
const notificationLimit = 30;

function isAppNotification(value: unknown): value is AppNotification {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    (item.kind === 'order' || item.kind === 'assignment' || item.kind === 'system') &&
    typeof item.title === 'string' &&
    typeof item.detail === 'string' &&
    typeof item.createdAt === 'string' &&
    typeof item.href === 'string' &&
    typeof item.unread === 'boolean'
  );
}

function loadNotifications(userId: string): AppNotification[] {
  try {
    const stored = window.localStorage.getItem(storageKey(userId));
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      console.warn('Saved notifications were invalid and have been ignored.');
      return [];
    }
    return parsed.filter(isAppNotification).slice(0, notificationLimit);
  } catch (error) {
    console.warn('Unable to load saved notifications.', error);
    return [];
  }
}

function getString(record: Record<string, unknown>, key: string): string {
  return typeof record[key] === 'string' ? record[key] as string : '';
}

function getRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

export default function NotificationsMenu() {
  const { user } = useAuth();
  const { drivers, isLoading, orders } = useOperationsData();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [store, setStore] = useState<NotificationStore>({ userId: null, items: [] });
  const [realtimeState, setRealtimeState] = useState<RealtimeState>('connecting');
  const [browserPermission, setBrowserPermission] = useState<BrowserPermission>('unsupported');
  const containerRef = useRef<HTMLDivElement>(null);
  const seenIdsRef = useRef(new Set<string>());
  const ordersRef = useRef(orders);
  const driversRef = useRef(drivers);

  ordersRef.current = orders;
  driversRef.current = drivers;

  const driverProfile = useMemo(
    () => drivers.find((driver) => driver.user_id === user?.id),
    [drivers, user?.id]
  );
  const userId = user?.id ?? null;
  const notifications = store.userId === userId ? store.items : [];
  const unreadCount = notifications.filter((item) => item.unread).length;

  useEffect(() => {
    if (!userId) {
      setStore({ userId: null, items: [] });
      seenIdsRef.current.clear();
      return;
    }
    const items = loadNotifications(userId);
    setStore({ userId, items });
    seenIdsRef.current = new Set(items.map((item) => item.id));
  }, [userId]);

  useEffect(() => {
    if (store.userId !== userId || !userId) return;
    try {
      window.localStorage.setItem(storageKey(userId), JSON.stringify(store.items));
    } catch (error) {
      console.warn('Unable to save notification history in this browser.', error);
    }
  }, [store, userId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setBrowserPermission('unsupported');
      return;
    }
    setBrowserPermission(window.Notification.permission);
  }, []);

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

  const publishNotification = useCallback((notification: AppNotification) => {
    if (seenIdsRef.current.has(notification.id)) return;
    seenIdsRef.current.add(notification.id);
    setStore((current) => {
      if (current.userId !== userId) return current;
      return { ...current, items: [notification, ...current.items].slice(0, notificationLimit) };
    });

    addToast(`${notification.title}: ${notification.detail}`, notification.kind === 'assignment' ? 'warning' : 'info', 8000);

    if (document.visibilityState === 'hidden' && browserPermission === 'granted') {
      try {
        const browserNotification = new window.Notification(notification.title, {
          body: notification.detail,
          tag: notification.id,
        });
        browserNotification.onclick = () => {
          window.focus();
          window.location.assign(notification.href);
        };
      } catch (error) {
        console.error('Unable to display a desktop notification.', error);
      }
    }
  }, [addToast, browserPermission, userId]);

  useEffect(() => {
    if (!user || store.userId !== user.id || (user.role === 'delivery_personnel' && (isLoading || !driverProfile))) {
      setRealtimeState('connecting');
      return;
    }

    let active = true;
    const isDriver = user.role === 'delivery_personnel';
    const driverId = driverProfile?.id;

    const makeNotification = (
      id: string,
      kind: NotificationKind,
      title: string,
      detail: string,
      href: string,
      createdAt: string
    ): AppNotification => ({
      id,
      kind,
      title,
      detail,
      href,
      createdAt,
      unread: true,
    });

    const channel = supabase
      .channel(`app-notifications-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        if (!active || isDriver) return;
        const order = getRecord(payload.new);
        const orderId = getString(order, 'id');
        if (!orderId) return;
        const orderNumber = getString(order, 'order_number') || orderId.slice(0, 8).toUpperCase();
        const customer = getString(order, 'client_name');
        const detail = customer ? `${orderNumber} · ${customer}` : orderNumber;
        publishNotification(makeNotification(
          `order-created-${orderId}-${getString(order, 'created_at')}`,
          'order',
          'New order received',
          detail,
          `/orders/${orderId}`,
          getString(order, 'created_at') || new Date().toISOString()
        ));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_assignments' }, (payload) => {
        const assignment = getRecord(payload.new);
        const assignmentId = getString(assignment, 'id');
        const personnelId = getString(assignment, 'personnel_id');
        const orderId = getString(assignment, 'order_id');
        if (!assignmentId || !orderId || (isDriver && personnelId !== driverId)) return;

        const order = ordersRef.current.find((item) => item.id === orderId);
        const orderNumber = order?.order_number ?? orderId.slice(0, 8).toUpperCase();
        const driverName = driversRef.current.find((item) => item.id === personnelId);
        const detail = isDriver
          ? `${orderNumber} · ${order?.delivery_location ?? 'New delivery assigned'}`
          : `${orderNumber} assigned to ${driverName?.full_name || driverName?.employee_id || 'a driver'}`;
        publishNotification(makeNotification(
          `assignment-created-${assignmentId}`,
          'assignment',
          isDriver ? 'New delivery assigned' : 'Driver assignment created',
          detail,
          `/assignments/${assignmentId}`,
          getString(assignment, 'created_at') || new Date().toISOString()
        ));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'order_assignments' }, (payload) => {
        const previous = getRecord(payload.old);
        const assignment = getRecord(payload.new);
        const assignmentId = getString(assignment, 'id');
        const personnelId = getString(assignment, 'personnel_id');
        const orderId = getString(assignment, 'order_id');
        const previousStatus = getString(previous, 'status');
        const status = getString(assignment, 'status');
        if (!assignmentId || !orderId || previousStatus === status || (isDriver && personnelId !== driverId)) return;

        const order = ordersRef.current.find((item) => item.id === orderId);
        const orderNumber = order?.order_number ?? orderId.slice(0, 8).toUpperCase();
        const driver = driversRef.current.find((item) => item.id === personnelId);
        if (isDriver && !['rejected', 'cancelled'].includes(status)) return;

        const titleByStatus: Record<string, string> = {
          accepted: 'Driver accepted assignment',
          in_progress: 'Delivery started',
          completed: 'Delivery completed',
          rejected: 'Assignment declined',
          cancelled: 'Assignment cancelled',
        };
        const title = titleByStatus[status];
        if (!title) return;
        const detail = isDriver
          ? `${orderNumber} · This assignment is ${status}.`
          : `${orderNumber} · ${driver?.full_name || driver?.employee_id || 'Driver'} ${status === 'in_progress' ? 'started the delivery' : status === 'completed' ? 'completed the delivery' : `marked it ${status}`}.`;
        publishNotification(makeNotification(
          `assignment-${status}-${assignmentId}-${getString(assignment, 'updated_at')}`,
          'assignment',
          isDriver ? `Assignment ${status}` : title,
          detail,
          `/assignments/${assignmentId}`,
          getString(assignment, 'updated_at') || new Date().toISOString()
        ));
      })
      .subscribe((status) => {
        if (!active) return;
        if (status === 'SUBSCRIBED') {
          setRealtimeState('live');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setRealtimeState('offline');
          if (status !== 'CLOSED') {
            console.error(`Notification realtime subscription unavailable (${status}).`);
          }
        }
      });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [driverProfile, isLoading, publishNotification, store.userId, user]);

  const markRead = (notificationId: string) => {
    setStore((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === notificationId ? { ...item, unread: false } : item
      ),
    }));
  };

  const markAllRead = () => {
    setStore((current) => ({
      ...current,
      items: current.items.map((item) => ({ ...item, unread: false })),
    }));
  };

  const enableDesktopAlerts = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setBrowserPermission('unsupported');
      return;
    }
    try {
      const permission = await window.Notification.requestPermission();
      setBrowserPermission(permission);
      if (permission === 'granted') {
        addToast('Desktop alerts are enabled for new operations notifications.', 'success');
      } else {
        addToast('Desktop alerts were not enabled. In-app notifications will still appear.', 'warning');
      }
    } catch (error) {
      console.error('Unable to request desktop notification permission.', error);
      addToast('Could not enable desktop alerts. In-app notifications will still appear.', 'error');
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        title="Notifications"
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-on-brand/85 transition-colors duration-150 hover:bg-on-brand/10 hover:text-on-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-destructive-foreground ring-2 ring-brand-900 dark:ring-brand-950">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <section aria-label="Notifications" className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <h3 className="font-semibold text-foreground">Notifications</h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className={cn('h-1.5 w-1.5 rounded-full', realtimeState === 'live' ? 'bg-success' : realtimeState === 'connecting' ? 'animate-pulse bg-warning' : 'bg-danger')} />
                {realtimeState === 'live' ? 'Live updates enabled' : realtimeState === 'connecting' ? 'Connecting to live updates…' : 'Live updates unavailable'}
              </p>
            </div>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="shrink-0 text-xs font-medium text-primary transition hover:text-primary/80 disabled:cursor-default disabled:text-muted-foreground"
            >
              Mark all read
            </button>
          </div>

          {browserPermission === 'default' && (
            <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-2.5">
              <p className="text-xs text-muted-foreground">Get alerts when this tab is in the background.</p>
              <button type="button" onClick={() => void enableDesktopAlerts()} className="shrink-0 text-xs font-semibold text-primary hover:underline">
                Enable
              </button>
            </div>
          )}
          {browserPermission === 'denied' && (
            <p className="border-b border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
              Desktop alerts are blocked by your browser. In-app alerts remain enabled.
            </p>
          )}
          {browserPermission === 'granted' && (
            <p className="border-b border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
              Desktop alerts are enabled when this tab is in the background.
            </p>
          )}

          <div className="max-h-[420px] overflow-y-auto p-2">
            {notifications.length ? (
              notifications.map((item) => {
                const Icon = iconMap[item.kind];
                const createdAt = new Date(item.createdAt);
                const timeAgo = Number.isNaN(createdAt.getTime())
                  ? 'Recently'
                  : formatDistanceToNow(createdAt, { addSuffix: true });
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => {
                      markRead(item.id);
                      setOpen(false);
                    }}
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
                        {item.unread && <Circle className="h-2 w-2 shrink-0 fill-current text-primary" />}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                      <time dateTime={item.createdAt} className="mt-1 block text-[11px] text-muted-foreground">{timeAgo}</time>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="flex min-h-[140px] flex-col items-center justify-center gap-2 px-4 py-6 text-center text-sm text-muted-foreground">
                <CheckCheck className="h-8 w-8" />
                <p>You’re all caught up.</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
