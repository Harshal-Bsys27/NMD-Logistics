'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { useOperationsData } from '@/hooks/useOperationsData';
import { cn } from '@/utils/helpers';
import OrdersTable from '@/components/tables/OrdersTable';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LabelList,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Package,
  MapPin,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  AlertTriangle,
  BellRing,
  Activity,
  Truck,
  CalendarDays,
  Download,
  Clock3,
  DollarSign,
  PackageCheck,
  Route,
  Award,
  Star,
  X,
  UserPlus,
} from 'lucide-react';

const chartTheme = {
  grid: 'var(--border)',
  label: 'var(--muted-foreground)',
  tooltipBackground: 'var(--popover)',
  tooltipForeground: 'var(--popover-foreground)',
  tooltipBorder: '1px solid var(--border)',
  colors: [
    'var(--brand-600)',
    'var(--success)',
    'var(--warning)',
    'var(--danger)',
  ],
};

const statStyles = [
  { label: 'Active orders', icon: Package, accent: 'bg-brand-600/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-500', border: 'border-t-brand-600 dark:border-t-brand-500' },
  { label: 'Pending assignments', icon: MapPin, accent: 'bg-warning/10 text-warning-foreground dark:bg-warning/15 dark:text-warning-foreground', border: 'border-t-warning' },
  { label: 'Delivered orders', icon: CheckCircle2, accent: 'bg-success/10 text-success-foreground dark:bg-success/15 dark:text-success-foreground', border: 'border-t-success' },
  { label: 'Available drivers', icon: Truck, accent: 'bg-violet/10 text-violet-foreground dark:bg-violet/15 dark:text-violet-foreground', border: 'border-t-violet' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState('30');
  const [isDriverPerformanceOpen, setIsDriverPerformanceOpen] = useState(false);
  const { user, loading } = useAuth();
  const {
    orders,
    drivers,
    assignments,
    isLoading: isLoadingOperations,
    error: operationsError,
    realtimeStatus,
    refresh,
  } = useOperationsData();

  useEffect(() => {
    if (!isDriverPerformanceOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsDriverPerformanceOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDriverPerformanceOpen]);

  const filteredOrders = useMemo(() => {
    if (dateRange === 'all') return orders;
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - Number(dateRange) + 1);
    return orders.filter((order) => new Date(order.created_at).getTime() >= cutoff.getTime());
  }, [orders, dateRange]);

  const exportOrders = () => {
    const columns = ['Order #', 'Client', 'Status', 'Value', 'Pickup', 'Delivery', 'Created At'];
    const rows = filteredOrders.map((order) => [
      order.order_number,
      order.client_name,
      order.status,
      order.package_value ?? 0,
      order.pickup_location,
      order.delivery_location,
      order.created_at,
    ]);
    const csv = [columns, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const downloadUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `nmd-orders-${dateRange === 'all' ? 'all' : `${dateRange}-days`}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/signin');
    }
  }, [loading, user, router]);

  const welcomeTitle = useMemo(() => {
    const firstName = user?.full_name?.trim().split(/\s+/)[0]?.slice(0, 24);
    return firstName ? `Welcome back, ${firstName}` : 'Welcome back';
  }, [user?.full_name]);
  const canManageOperations = user?.role === 'admin' || user?.role === 'supervisor';

  const orderStats = useMemo(() => {
    return {
      total: orders.length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      inTransit: orders.filter((o) => o.status === 'in_transit').length,
      pending: orders.filter((o) => o.status === 'draft' || o.status === 'pending' || o.status === 'confirmed').length,
      failed: orders.filter((o) => o.status === 'failed').length,
    };
  }, [orders]);

  const activeDriverIds = useMemo(
    () => new Set(
      assignments
        .filter((assignment) => ['pending', 'accepted', 'in_progress'].includes(assignment.status))
        .map((assignment) => assignment.personnel_id)
    ),
    [assignments]
  );

  const driverStats = useMemo(() => {
    return {
      total: drivers.length,
      available: drivers.filter((d) => d.current_status === 'available' && !activeDriverIds.has(d.id)).length,
      onDelivery: drivers.filter((d) => d.current_status === 'on_delivery').length,
      avgRating: drivers.length
        ? (drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length).toFixed(1)
        : '—',
    };
  }, [activeDriverIds, drivers]);

  const orderTrendData = useMemo(() => {
    const unit = dateRange === 'all' ? 'month' : Number(dateRange) <= 30 ? 'day' : 'week';
    const startOfPeriod = (date: Date) => {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      if (unit === 'week') {
        start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      } else if (unit === 'month') {
        start.setDate(1);
      }
      return start;
    };
    const now = new Date();
    const firstOrderDate = filteredOrders.reduce<Date | null>((first, order) => {
      const createdAt = new Date(order.created_at);
      return !first || createdAt < first ? createdAt : first;
    }, null);
    const rangeStart = dateRange === 'all'
      ? startOfPeriod(firstOrderDate ?? now)
      : startOfPeriod(new Date(new Date().setDate(now.getDate() - Number(dateRange) + 1)));
    const buckets = new Map<string, {
      date: Date;
      completed: number;
      failed: number;
      active: number;
      cancelled: number;
      declaredValue: number;
    }>();

    for (const date = new Date(rangeStart); date <= now;) {
      const key = date.toISOString().slice(0, 10);
      buckets.set(key, { date: new Date(date), completed: 0, failed: 0, active: 0, cancelled: 0, declaredValue: 0 });
      if (unit === 'day') date.setDate(date.getDate() + 1);
      else if (unit === 'week') date.setDate(date.getDate() + 7);
      else date.setMonth(date.getMonth() + 1);
    }

    for (const order of filteredOrders) {
      const createdAt = new Date(order.created_at);
      const bucket = buckets.get(startOfPeriod(createdAt).toISOString().slice(0, 10));
      if (!bucket) continue;

      bucket.declaredValue += order.package_value ?? 0;
      if (order.status === 'delivered') bucket.completed += 1;
      else if (order.status === 'failed') bucket.failed += 1;
      else if (order.status === 'cancelled') bucket.cancelled += 1;
      else bucket.active += 1;
    }

    return Array.from(buckets.values()).map((bucket) => ({
      period: unit === 'day'
        ? bucket.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        : unit === 'week'
          ? `Week of ${bucket.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
          : bucket.date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      ...bucket,
    }));
  }, [filteredOrders, dateRange]);

  const deliveryTimeData = useMemo(() => {
    const statuses = ['pending', 'accepted', 'in_progress', 'completed', 'rejected', 'cancelled'];
    return statuses.map((status) => {
      const count = assignments.filter((assignment) => assignment.status === status).length;
      return {
        range: status.replace(/_/g, ' '),
        count,
        percentage: assignments.length ? (count / assignments.length) * 100 : 0,
      };
    }).filter((entry) => entry.count > 0);
  }, [assignments]);

  const driverPerformanceData = useMemo(
    () => drivers
      .map((driver) => ({
        id: driver.id,
        name: driver.full_name || driver.employee_id,
        employeeId: driver.employee_id,
        deliveries: driver.total_deliveries_completed,
        rating: driver.rating,
        ratingLabel: driver.rating > 0 ? `${driver.rating.toFixed(1)} / 5` : 'Not rated',
        status: driver.current_status,
      }))
      .sort((left, right) => right.deliveries - left.deliveries),
    [drivers]
  );
  const topDriverPerformanceData = driverPerformanceData.slice(0, 10);
  const maxDriverDeliveries = Math.max(1, ...topDriverPerformanceData.map((driver) => driver.deliveries));
  const maxAllDriverDeliveries = Math.max(1, ...driverPerformanceData.map((driver) => driver.deliveries));
  const ratedDrivers = driverPerformanceData.filter((driver) => driver.rating > 0);
  const averageDriverRating = ratedDrivers.length
    ? ratedDrivers.reduce((total, driver) => total + driver.rating, 0) / ratedDrivers.length
    : 0;

  const routeHealth = useMemo(() => {
    const statuses = [
      { key: 'available', label: 'Available', tone: 'text-success-foreground', bar: 'bg-success-foreground' },
      { key: 'assigned', label: 'Assigned', tone: 'text-primary', bar: 'bg-primary' },
      { key: 'on_delivery', label: 'On delivery', tone: 'text-info-foreground', bar: 'bg-info-foreground' },
      { key: 'on_break', label: 'On break', tone: 'text-warning-foreground', bar: 'bg-warning-foreground' },
      { key: 'off_duty', label: 'Off duty', tone: 'text-muted-foreground', bar: 'bg-muted-foreground' },
    ];
    return statuses.map((status) => {
      const count = status.key === 'assigned'
        ? drivers.filter((driver) => driver.current_status === 'available' && activeDriverIds.has(driver.id)).length
        : status.key === 'available'
          ? drivers.filter((driver) => driver.current_status === 'available' && !activeDriverIds.has(driver.id)).length
          : drivers.filter((driver) => driver.current_status === status.key).length;
      return { ...status, value: drivers.length ? Math.round((count / drivers.length) * 100) : 0, count };
    });
  }, [activeDriverIds, drivers]);

  const priorityAlerts = useMemo(() => [
    { title: 'Unassigned orders', count: orders.filter((order) => ['draft', 'pending', 'confirmed'].includes(order.status)).length, level: 'High', border: 'border-l-danger bg-danger/5', badge: 'bg-danger/10 text-danger-foreground' },
    { title: 'Orders marked failed', count: orders.filter((order) => order.status === 'failed').length, level: 'Medium', border: 'border-l-warning bg-warning/5', badge: 'bg-warning/10 text-warning-foreground' },
    { title: 'Drivers unavailable', count: drivers.filter((driver) => driver.current_status === 'off_duty').length, level: 'Info', border: 'border-l-success bg-success/5', badge: 'bg-success/10 text-success-foreground' },
  ], [orders, drivers]);

  const dashboardStats = [
    orders.filter((order) => !['delivered', 'failed', 'cancelled'].includes(order.status)).length,
    assignments.filter((assignment) => assignment.status === 'pending').length,
    orderStats.delivered,
    driverStats.available,
  ];

  const dispatchBoard = useMemo(() => {
    return assignments.slice(0, 3).map((assignment) => {
      const driver = drivers.find((person) => person.id === assignment.personnel_id);
      const order = orders.find((item) => item.id === assignment.order_id);

      return {
        id: order?.order_number ?? assignment.id.slice(0, 8).toUpperCase(),
        zone: order?.pickup_location ?? 'Metro route',
        driver: driver ? `${driver.full_name || driver.employee_id} (${driver.employee_id})` : 'Unassigned',
        eta: assignment.status === 'completed' ? 'Delivered' : assignment.status === 'in_progress' ? 'In progress' : 'Awaiting start',
        status: assignment.status === 'completed' ? 'Completed' : assignment.status === 'in_progress' ? 'On route' : 'Queued',
      };
    });
  }, [assignments, drivers, orders]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground">
      <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
        <header className="order-1 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">{welcomeTitle}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Today’s orders, fleet status, and delivery performance.</p>
          </div>
          <div className="flex w-full shrink-0 gap-2 sm:w-auto sm:flex-wrap sm:items-center sm:gap-3">
            <label className="relative inline-flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-input bg-card pl-3 pr-2 text-sm text-foreground shadow-sm focus-within:ring-2 focus-within:ring-ring sm:flex-none">
              <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="sr-only">Recent order date range</span>
              <select value={dateRange} onChange={(event) => setDateRange(event.target.value)} aria-label="Recent order date range" className="h-full min-w-0 flex-1 bg-transparent pr-2 text-sm focus:outline-none [color-scheme:light] dark:[color-scheme:dark] sm:min-w-32 sm:flex-none">
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </label>
            <button type="button" onClick={exportOrders} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-input bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </header>

        {user?.role === 'admin' ? (
          <section className="order-1 flex flex-col gap-4 rounded-xl border border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserPlus className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold text-foreground">Invite your team</h2>
                <p className="mt-1 text-sm text-muted-foreground">Send a role-based invite to a supervisor or delivery team member.</p>
              </div>
            </div>
            <Link href="/users" className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto">
              <UserPlus className="h-4 w-4" />
              Invite team member
            </Link>
          </section>
        ) : user ? (
          <p className="order-1 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Team invitations are available to administrators only. Your current role is <span className="font-semibold text-foreground">{user.role === 'delivery_personnel' ? 'Delivery personnel' : 'Supervisor'}</span>. If you own this project and need to send invites, ask the project owner to promote your account to admin in Supabase.
          </p>
        ) : null}

        {operationsError && (
          <div role="alert" className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/10 p-4 text-danger-foreground">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1 text-sm">
              <p>{operationsError}</p>
              <button type="button" onClick={() => void refresh()} className="mt-2 font-semibold underline">
                Try again
              </button>
            </div>
          </div>
        )}
        {isLoadingOperations && <p role="status" className="text-sm text-muted-foreground">Loading operations data…</p>}

        <div className="order-2 grid grid-cols-2 gap-3 sm:gap-6 xl:grid-cols-4">
          {statStyles.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={cn('surface-glass flex h-full min-h-[132px] min-w-0 items-start justify-between gap-2 rounded-xl border border-t-[3px] p-3 transition hover:border-ring/50 sm:min-h-[160px] sm:gap-4 sm:p-4', stat.border)}>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className={cn('mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl sm:mb-3 sm:h-10 sm:w-10', stat.accent)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-[10px] font-medium uppercase leading-4 tracking-[0.08em] text-muted-foreground sm:text-xs sm:tracking-[0.12em]">{stat.label}</p>
                  <div className="mt-3 flex items-end gap-2">
                    <p className="text-2xl font-bold tabular-nums text-foreground sm:text-3xl">{dashboardStats[index].toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="order-3 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-12 xl:gap-6">
          <section className="surface-glass min-w-0 rounded-xl border border-border border-t-[3px] border-t-brand-600 p-4 shadow-lg shadow-brand-950/[0.04] transition-shadow hover:shadow-xl hover:shadow-brand-950/[0.07] dark:shadow-black/15 dark:hover:shadow-black/25 md:p-5 xl:col-span-8">
            <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-500"><Activity className="h-5 w-5" /></span>
                <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Operations overview</p>
                <h2 className="mt-2 text-lg font-semibold text-foreground sm:text-xl">Order status by created date</h2>
                <p className="mt-1 text-sm text-muted-foreground">Current status of orders created in the selected period</p>
                </div>
              </div>
              <span className="inline-flex min-h-7 w-fit max-w-full items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-semibold text-muted-foreground sm:shrink-0">
                <TrendingUp className="h-3.5 w-3.5" />
                {orderStats.total.toLocaleString('en-IN')} total orders
              </span>
            </div>
            <p className="mb-3 text-xs text-muted-foreground" role="status">
              {realtimeStatus === 'live'
                ? 'Live updates enabled'
                : realtimeStatus === 'polling'
                  ? 'Live connection unavailable; refreshing every 30 seconds'
                  : 'Connecting to live updates…'}
            </p>

            {filteredOrders.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={orderTrendData} margin={{ top: 12, right: 20, left: 0, bottom: 8 }}>
                  <defs>
                    <linearGradient id="serviceCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartTheme.colors[0]} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={chartTheme.colors[0]} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="serviceActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartTheme.colors[2]} stopOpacity={0.32} />
                      <stop offset="95%" stopColor={chartTheme.colors[2]} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="serviceFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartTheme.colors[3]} stopOpacity={0.34} />
                      <stop offset="95%" stopColor={chartTheme.colors[3]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                  <XAxis dataKey="period" stroke={chartTheme.label} tick={{ fill: chartTheme.label, fontSize: 11 }} tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis stroke={chartTheme.label} width={32} tick={{ fill: chartTheme.label, fontSize: 11 }} tickLine={false} axisLine={false} tickMargin={10} allowDecimals={false} />
                  <Tooltip
                    cursor={{ stroke: chartTheme.grid, strokeWidth: 1 }}
                    contentStyle={{ backgroundColor: chartTheme.tooltipBackground, border: chartTheme.tooltipBorder, color: chartTheme.tooltipForeground, borderRadius: '0.75rem', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.16)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 12, fontSize: '12px' }} />
                  <Area type="monotone" dataKey="completed" name="Delivered" stroke={chartTheme.colors[0]} fill="url(#serviceCompleted)" strokeWidth={3} activeDot={{ r: 5, strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="active" name="Active" stroke={chartTheme.colors[2]} fill="url(#serviceActive)" strokeWidth={2.5} activeDot={{ r: 5, strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="failed" name="Failed" stroke={chartTheme.colors[3]} fill="url(#serviceFailed)" strokeWidth={2.5} activeDot={{ r: 5, strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="cancelled" name="Cancelled" stroke={chartTheme.label} fill={chartTheme.label} fillOpacity={0.08} strokeWidth={2} activeDot={{ r: 4, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
                No orders in this date range.
              </div>
            )}
          </section>

          <section className="surface-glass min-w-0 rounded-xl border border-border border-t-[3px] border-t-danger p-4 md:p-5 xl:col-span-4">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger dark:bg-danger/15 dark:text-danger-foreground"><BellRing className="h-5 w-5" /></span>
                <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Priority alerts</p>
                <h2 className="mt-2 text-lg font-semibold text-foreground">Watchlist</h2>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {priorityAlerts.map((alert) => (
                <div key={alert.title} className={cn('flex items-center justify-between gap-3 rounded-lg border border-l-4 border-border p-3', alert.border)}>
                  <div>
                    <p className="text-sm font-medium text-foreground">{alert.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{alert.count} {alert.count === 1 ? 'item' : 'items'} needing attention</p>
                  </div>
                  <span className={cn('inline-flex min-h-6 items-center rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]', alert.badge)}>
                    {alert.level}
                  </span>
                </div>
              ))}
            </div>
            <Link href="/dispatch" className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-primary transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">View all alerts <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
          </section>
        </div>

        <div className="order-5 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-12 xl:gap-6">
          <div className="surface-glass min-w-0 rounded-xl border border-border border-t-[3px] border-t-info p-4 md:p-5 xl:col-span-12">
            <div className="mb-6 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-info/10 text-info-foreground"><MapPin className="h-5 w-5" /></span>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Fleet availability</h3>
                <p className="mt-1 text-sm text-muted-foreground">Driver distribution by availability and active assignment</p>
              </div>
            </div>
            <div className="space-y-5">
              {routeHealth.map((route) => (
                <div key={route.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-foreground">{route.label} ({route.count})</span>
                    <span className={cn('font-semibold', route.tone)}>{route.value}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className={cn('h-full rounded-full', route.bar)} style={{ width: `${route.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="order-6 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-12 xl:gap-6">
          <div className="surface-glass min-w-0 rounded-xl border border-border border-t-[3px] border-t-brand-600 p-4 shadow-lg shadow-brand-950/[0.04] transition-shadow hover:shadow-xl hover:shadow-brand-950/[0.07] dark:shadow-black/15 dark:hover:shadow-black/25 md:p-5 xl:col-span-6">
            <div className="mb-6 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-500"><DollarSign className="h-5 w-5" /></span>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Declared Package Value</h3>
                <p className="mt-1 text-sm text-muted-foreground">Package values are not collected revenue.</p>
              </div>
            </div>
            {filteredOrders.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={orderTrendData}>
                  <defs>
                    <linearGradient id="declaredValueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartTheme.colors[0]} stopOpacity={1} />
                      <stop offset="100%" stopColor={chartTheme.colors[0]} stopOpacity={0.55} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 5" stroke={chartTheme.grid} vertical={false} />
                  <XAxis dataKey="period" stroke={chartTheme.label} tick={{ fill: chartTheme.label, fontSize: 11 }} tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis stroke={chartTheme.label} tick={{ fill: chartTheme.label, fontSize: 11 }} tickLine={false} axisLine={false} width={44} />
                  <Tooltip contentStyle={{ backgroundColor: chartTheme.tooltipBackground, border: chartTheme.tooltipBorder, color: chartTheme.tooltipForeground, borderRadius: '0.75rem', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.16)' }} />
                  <Legend />
                  <Bar dataKey="declaredValue" name="Declared package value" fill="url(#declaredValueGradient)" radius={[8, 8, 2, 2]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No order values in this date range.
              </div>
            )}
          </div>

          <div className="surface-glass min-w-0 rounded-xl border border-border border-t-[3px] border-t-violet p-4 shadow-lg shadow-brand-950/[0.04] transition-shadow hover:shadow-xl hover:shadow-brand-950/[0.07] dark:shadow-black/15 dark:hover:shadow-black/25 md:p-5 xl:col-span-6">
            <div className="mb-6 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet/10 text-violet-foreground"><Clock3 className="h-5 w-5" /></span>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Assignment Status</h3>
                <p className="mt-1 text-sm text-muted-foreground">Distribution across all assignment outcomes.</p>
              </div>
            </div>
            {deliveryTimeData.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deliveryTimeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    paddingAngle={3}
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}
                    nameKey="range"
                    outerRadius={88}
                    fill={chartTheme.colors[0]}
                    dataKey="percentage"
                  >
                    {deliveryTimeData.map((entry, index) => (
                      <Cell key={`cell-${entry.range}`} fill={chartTheme.colors[index % chartTheme.colors.length]} stroke="var(--card)" strokeWidth={3} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: chartTheme.tooltipBackground, border: chartTheme.tooltipBorder, color: chartTheme.tooltipForeground, borderRadius: '0.75rem', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.16)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <p>No assignments are visible yet.</p>
                {canManageOperations && (
                  <p>
                    Add a driver, then assign a dispatch-ready order from{' '}
                    <Link href="/orders" className="font-semibold text-primary underline">Orders</Link>.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="order-7 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-12 xl:gap-6">
          <div className="surface-glass min-w-0 rounded-xl border border-border border-t-[3px] border-t-success p-4 shadow-lg shadow-brand-950/[0.04] transition-shadow hover:shadow-xl hover:shadow-brand-950/[0.07] dark:shadow-black/15 dark:hover:shadow-black/25 md:p-5 xl:col-span-6">
            <div className="mb-6 flex items-center justify-between gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success-foreground"><Truck className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-foreground">Top Driver Performance</h3>
                <p className="mt-1 text-sm text-muted-foreground">Completed deliveries and customer ratings</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDriverPerformanceOpen(true)}
                disabled={driverPerformanceData.length === 0}
                className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border border-success/25 bg-success/5 px-3 text-xs font-semibold text-success-foreground transition hover:bg-success/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
              >
                View all
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
            {topDriverPerformanceData.length ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative min-w-0 overflow-hidden rounded-xl border border-success/20 bg-gradient-to-br from-success/10 via-card to-card p-3 sm:p-4">
                    <div className="absolute -right-4 -top-5 h-20 w-20 rounded-full bg-success/10 blur-2xl" />
                    <div className="relative flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-success-foreground sm:text-xs">
                      <Award className="h-4 w-4" />
                      Top performer
                    </div>
                    <p className="relative mt-2 truncate text-sm font-bold text-foreground sm:text-base" title={topDriverPerformanceData[0].name}>
                      {topDriverPerformanceData[0].name}
                    </p>
                    <p className="relative mt-0.5 text-[11px] font-medium text-muted-foreground">
                      Employee ID: {topDriverPerformanceData[0].employeeId}
                    </p>
                    <p className="relative mt-1 text-xs text-muted-foreground">
                      {topDriverPerformanceData[0].deliveries.toLocaleString('en-IN')} completed deliveries
                    </p>
                  </div>
                  <div className="relative min-w-0 overflow-hidden rounded-xl border border-warning/20 bg-gradient-to-br from-warning/10 via-card to-card p-3 sm:p-4">
                    <div className="absolute -right-4 -top-5 h-20 w-20 rounded-full bg-warning/10 blur-2xl" />
                    <div className="relative flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-warning-foreground sm:text-xs">
                      <Star className="h-4 w-4 fill-current" />
                      Average rating
                    </div>
                    <p className="relative mt-2 text-sm font-bold tabular-nums text-foreground sm:text-base">
                      {averageDriverRating > 0 ? `${averageDriverRating.toFixed(1)} / 5` : 'Not rated yet'}
                    </p>
                    <p className="relative mt-1 text-xs text-muted-foreground">
                      Across {ratedDrivers.length} rated {ratedDrivers.length === 1 ? 'driver' : 'drivers'}
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-border/80 bg-gradient-to-br from-card via-card to-success/[0.035] p-2 pt-3 shadow-inner shadow-brand-950/[0.03] sm:p-4">
                  <div className="mb-1 flex items-center justify-between gap-2 pl-1 text-[9px] font-bold uppercase tracking-[0.11em] text-muted-foreground sm:text-[10px] sm:tracking-[0.14em]">
                    <span>Driver · employee ID · deliveries</span>
                    <span className="text-warning-foreground">Rating / 5</span>
                  </div>
                  <ResponsiveContainer width="100%" height={Math.max(260, topDriverPerformanceData.length * 38)}>
                  <BarChart
                    data={topDriverPerformanceData}
                    layout="vertical"
                    margin={{ top: 8, right: 6, bottom: 8, left: 0 }}
                    barCategoryGap="32%"
                  >
                    <defs>
                      <linearGradient id="driverDeliveriesGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--success)" stopOpacity={0.58} />
                        <stop offset="100%" stopColor="var(--success)" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid horizontal={false} stroke={chartTheme.grid} strokeDasharray="3 5" />
                    <XAxis
                      type="number"
                      dataKey="deliveries"
                      domain={[0, Math.ceil(maxDriverDeliveries * 1.18)]}
                      allowDecimals={false}
                      tick={{ fill: chartTheme.label, fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      type="category"
                      dataKey="employeeId"
                      width={124}
                      tick={(props: { x: number; y: number; payload: { value: string } }) => {
                        const driver = topDriverPerformanceData.find((item) => item.employeeId === props.payload.value);
                        if (!driver) return <g />;
                        const displayName = driver.name.length > 17
                          ? `${driver.name.slice(0, 16)}…`
                          : driver.name;
                        return (
                          <g>
                            <text x={props.x - 6} y={props.y} textAnchor="end" fill={chartTheme.label}>
                              <tspan x={props.x - 6} dy="-0.25em" fontSize="10" fontWeight="600">{displayName}</tspan>
                              <tspan x={props.x - 6} dy="1.25em" fontSize="9">{driver.employeeId}</tspan>
                            </text>
                          </g>
                        );
                      }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="rating"
                      type="category"
                      dataKey="ratingLabel"
                      orientation="right"
                      width={72}
                      tick={{ fill: chartTheme.label, fontSize: 10, fontWeight: 600 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--muted)', opacity: 0.45 }}
                      formatter={(value, name, item) => [
                        name === 'Completed deliveries'
                          ? Number(value).toLocaleString('en-IN')
                          : item.payload.ratingLabel,
                        name,
                      ]}
                      labelFormatter={(label) => {
                        const employeeId = String(label);
                        const driver = topDriverPerformanceData.find((item) => item.employeeId === employeeId);
                        return driver ? `${driver.name} · ${employeeId}` : `Employee ID: ${employeeId}`;
                      }}
                      contentStyle={{
                        backgroundColor: chartTheme.tooltipBackground,
                        border: chartTheme.tooltipBorder,
                        color: chartTheme.tooltipForeground,
                        borderRadius: '0.75rem',
                        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.16)',
                      }}
                    />
                    <Bar
                      dataKey="deliveries"
                      name="Completed deliveries"
                      fill="url(#driverDeliveriesGradient)"
                      background={{ fill: 'var(--muted)', radius: 7 }}
                      radius={[2, 7, 7, 2]}
                      maxBarSize={22}
                      isAnimationActive
                    >
                      <LabelList
                        dataKey="deliveries"
                        position="right"
                        formatter={(value: number | string) => Number(value).toLocaleString('en-IN')}
                        fill={chartTheme.label}
                        fontSize={10}
                        fontWeight={600}
                      />
                    </Bar>
                  </BarChart>
                  </ResponsiveContainer>
                  <p className="mt-1 text-center text-[10px] text-muted-foreground">
                    Ranked by completed deliveries · Showing top {topDriverPerformanceData.length} of {driverPerformanceData.length}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <p>No driver records are visible yet.</p>
                {canManageOperations && (
                  <Link href="/drivers" className="font-semibold text-primary underline">Add the first driver</Link>
                )}
              </div>
            )}
          </div>

          <div className="surface-glass min-w-0 rounded-xl border border-border border-t-[3px] border-t-brand-600 p-4 md:p-5 xl:col-span-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-500"><Route className="h-5 w-5" /></span>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Dispatch board</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Current route assignments</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {dispatchBoard.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No assignments yet. Assign a ready order to a driver to start dispatch tracking.
                </p>
              ) : dispatchBoard.map((job) => (
                <div key={job.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{job.id}</p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{job.zone}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{job.driver}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums text-info-foreground">{job.eta}</p>
                    <p className={`mt-1 text-[10px] uppercase tracking-[0.14em] ${job.status === 'Delayed' ? 'text-warning-foreground' : 'text-muted-foreground'}`}>{job.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="order-4 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-12 xl:gap-6">
          <section className="min-w-0 max-w-full space-y-4 overflow-hidden xl:col-span-8">
            <OrdersTable
              orders={filteredOrders.slice(0, 5)}
              title="Recent orders"
              subtitle="Latest activity"
              onView={(order) => router.push(`/orders/${order.id}`)}
            />
          </section>

          <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-4 xl:grid-cols-1">
            <div className="surface-glass h-full rounded-xl border border-border border-t-[3px] border-t-brand-600 p-4">
              <h3 className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground"><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-500"><PackageCheck className="h-5 w-5" /></span>Order Stats</h3>
              <div className="mt-6 space-y-3">
                <div>
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm text-muted-foreground"><span className="h-2 w-2 rounded-full bg-success" />Delivered</span><span className="font-bold tabular-nums text-success-foreground">{orderStats.delivered}</span></div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-success" style={{ width: `${orderStats.total ? (orderStats.delivered / orderStats.total) * 100 : 0}%` }} /></div>
                </div>
                <div>
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm text-muted-foreground"><span className="h-2 w-2 rounded-full bg-violet" />In Transit</span><span className="font-bold tabular-nums text-violet-foreground">{orderStats.inTransit}</span></div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-violet" style={{ width: `${orderStats.total ? (orderStats.inTransit / orderStats.total) * 100 : 0}%` }} /></div>
                </div>
                <div>
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm text-muted-foreground"><span className="h-2 w-2 rounded-full bg-warning" />Pending</span><span className="font-bold tabular-nums text-warning-foreground">{orderStats.pending}</span></div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-warning" style={{ width: `${orderStats.total ? (orderStats.pending / orderStats.total) * 100 : 0}%` }} /></div>
                </div>
                <div>
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm text-muted-foreground"><span className="h-2 w-2 rounded-full bg-danger" />Failed</span><span className="font-bold tabular-nums text-danger-foreground">{orderStats.failed}</span></div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-danger" style={{ width: `${orderStats.total ? (orderStats.failed / orderStats.total) * 100 : 0}%` }} /></div>
                </div>
              </div>
            </div>

            <div className="surface-glass h-full rounded-xl border border-border border-t-[3px] border-t-info p-4">
              <h3 className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground"><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-info/10 text-info-foreground"><Truck className="h-5 w-5" /></span>Driver Stats</h3>
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-bold tabular-nums text-info-foreground">{driverStats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Available</span>
                  <span className="font-bold tabular-nums text-success-foreground">{driverStats.available}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">On Delivery</span>
                  <span className="font-bold tabular-nums text-info-foreground">{driverStats.onDelivery}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Rating</span>
                  <span className="font-bold tabular-nums text-warning-foreground">{driverStats.avgRating}⭐</span>
                </div>
              </div>
            </div>

            <div className="surface-glass h-full rounded-xl border border-border border-t-[3px] border-t-warning p-4 sm:col-span-2 xl:col-span-1">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground"><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning-foreground"><AlertTriangle className="h-5 w-5" /></span>System health</h3>
              </div>
              <div className="mt-5 rounded-lg border border-warning/30 bg-warning/10 p-4">
                <p className="text-sm font-medium text-warning-foreground">2 low-priority issues</p>
                <p className="mt-2 text-xs text-warning-foreground">Vehicle checks and delayed pickups are being monitored.</p>
              </div>
            </div>
          </section>
        </div>

      </div>
      {isDriverPerformanceOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/60 p-2 backdrop-blur-sm sm:p-5"
          onClick={() => setIsDriverPerformanceOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="driver-performance-title"
            className="flex max-h-[96vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-border bg-background text-foreground shadow-2xl sm:max-h-[92vh]"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-4 border-b border-border bg-gradient-to-r from-success/10 via-background to-warning/10 px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex min-w-0 items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success-foreground">
                  <Truck className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-success-foreground sm:text-xs">Fleet analytics</p>
                  <h2 id="driver-performance-title" className="mt-1 text-lg font-bold sm:text-2xl">Top Driver Performance</h2>
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                    All {driverPerformanceData.length} drivers · ranked by completed deliveries
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDriverPerformanceOpen(false)}
                aria-label="Close driver performance details"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-3 sm:p-6">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Total drivers</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums">{driverPerformanceData.length}</p>
                </div>
                <div className="rounded-xl border border-success/20 bg-success/5 p-3 sm:p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-success-foreground">Top completed</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums">{driverPerformanceData[0]?.deliveries.toLocaleString('en-IN') ?? 0}</p>
                </div>
                <div className="rounded-xl border border-warning/20 bg-warning/5 p-3 sm:p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-warning-foreground">Average rating</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums">{averageDriverRating > 0 ? `${averageDriverRating.toFixed(1)} / 5` : '—'}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Rated drivers</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums">{ratedDrivers.length}</p>
                </div>
              </div>

              <section aria-label="All driver performance chart" className="rounded-xl border border-border bg-card p-2 sm:p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold sm:text-base">Performance by driver</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Bar length shows completed deliveries; ratings use a separate column.</p>
                  </div>
                  <span className="rounded-full bg-success/10 px-3 py-1 text-[10px] font-semibold text-success-foreground">
                    {driverPerformanceData.length} total
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <div className="min-w-[540px]">
                    <div className="mb-1 flex items-center justify-between pl-[128px] pr-[76px] text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                      <span>Completed deliveries</span>
                      <span>Rating / 5</span>
                    </div>
                    <ResponsiveContainer width="100%" height={Math.max(320, driverPerformanceData.length * 44)}>
                      <BarChart
                        data={driverPerformanceData}
                        layout="vertical"
                        margin={{ top: 8, right: 6, bottom: 8, left: 0 }}
                        barCategoryGap="30%"
                      >
                        <defs>
                          <linearGradient id="allDriverDeliveriesGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="var(--success)" stopOpacity={0.58} />
                            <stop offset="100%" stopColor="var(--success)" stopOpacity={1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid horizontal={false} stroke={chartTheme.grid} strokeDasharray="3 5" />
                        <XAxis
                          type="number"
                          dataKey="deliveries"
                          domain={[0, Math.ceil(maxAllDriverDeliveries * 1.18)]}
                          allowDecimals={false}
                          tick={{ fill: chartTheme.label, fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="employeeId"
                          width={128}
                          tick={(props: { x: number; y: number; payload: { value: string } }) => {
                            const driver = driverPerformanceData.find((item) => item.employeeId === props.payload.value);
                            if (!driver) return <g />;
                            const displayName = driver.name.length > 18 ? `${driver.name.slice(0, 17)}…` : driver.name;
                            return (
                              <g>
                                <text x={props.x - 8} y={props.y} textAnchor="end" fill={chartTheme.label}>
                                  <tspan x={props.x - 8} dy="-0.25em" fontSize="10" fontWeight="600">{displayName}</tspan>
                                  <tspan x={props.x - 8} dy="1.25em" fontSize="9">{driver.employeeId}</tspan>
                                </text>
                              </g>
                            );
                          }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          yAxisId="all-rating"
                          type="category"
                          dataKey="ratingLabel"
                          orientation="right"
                          width={76}
                          tick={{ fill: chartTheme.label, fontSize: 10, fontWeight: 600 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'var(--muted)', opacity: 0.45 }}
                          formatter={(value, name, item) => [
                            name === 'Completed deliveries'
                              ? Number(value).toLocaleString('en-IN')
                              : item.payload.ratingLabel,
                            name,
                          ]}
                          labelFormatter={(label) => {
                            const employeeId = String(label);
                            const driver = driverPerformanceData.find((item) => item.employeeId === employeeId);
                            return driver ? `${driver.name} · ${employeeId}` : `Employee ID: ${employeeId}`;
                          }}
                          contentStyle={{
                            backgroundColor: chartTheme.tooltipBackground,
                            border: chartTheme.tooltipBorder,
                            color: chartTheme.tooltipForeground,
                            borderRadius: '0.75rem',
                            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.16)',
                          }}
                        />
                        <Bar
                          dataKey="deliveries"
                          name="Completed deliveries"
                          fill="url(#allDriverDeliveriesGradient)"
                          background={{ fill: 'var(--muted)', radius: 7 }}
                          radius={[2, 7, 7, 2]}
                          maxBarSize={24}
                        >
                          <LabelList
                            dataKey="deliveries"
                            position="right"
                            formatter={(value: number | string) => Number(value).toLocaleString('en-IN')}
                            fill={chartTheme.label}
                            fontSize={10}
                            fontWeight={600}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

              <section aria-label="Driver performance details" className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="border-b border-border px-4 py-3">
                  <h3 className="text-sm font-semibold">Driver details</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="bg-muted/50 text-[10px] uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Rank</th>
                        <th className="px-4 py-3 font-semibold">Driver</th>
                        <th className="px-4 py-3 font-semibold">Employee ID</th>
                        <th className="px-4 py-3 text-right font-semibold">Completed</th>
                        <th className="px-4 py-3 text-right font-semibold">Rating</th>
                        <th className="px-4 py-3 text-right font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {driverPerformanceData.map((driver, index) => (
                        <tr key={driver.id} className="transition-colors hover:bg-muted/30">
                          <td className="px-4 py-3 font-semibold tabular-nums text-muted-foreground">#{index + 1}</td>
                          <td className="px-4 py-3 font-medium text-foreground">{driver.name}</td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{driver.employeeId}</td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums">{driver.deliveries.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums text-warning-foreground">{driver.ratingLabel}</td>
                          <td className="px-4 py-3 text-right capitalize text-muted-foreground">{driver.status.replace(/_/g, ' ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
