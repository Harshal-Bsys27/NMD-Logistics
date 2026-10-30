'use client';

import { useEffect, useMemo, useState } from 'react';
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
  LineChart,
  Line,
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
  const { user, loading } = useAuth();
  const { orders, drivers, assignments, isLoading: isLoadingOperations, error: operationsError, refresh } = useOperationsData();

  const filteredOrders = useMemo(() => {
    if (dateRange === 'all') return orders;
    const cutoff = Date.now() - Number(dateRange) * 24 * 60 * 60 * 1000;
    return orders.filter((order) => new Date(order.created_at).getTime() >= cutoff);
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

  const orderStats = useMemo(() => {
    return {
      total: orders.length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      inTransit: orders.filter((o) => o.status === 'in_transit').length,
      pending: orders.filter((o) => o.status === 'draft' || o.status === 'pending' || o.status === 'confirmed').length,
      failed: orders.filter((o) => o.status === 'failed').length,
    };
  }, [orders]);

  const driverStats = useMemo(() => {
    return {
      total: drivers.length,
      available: drivers.filter((d) => d.current_status === 'available').length,
      onDelivery: drivers.filter((d) => d.current_status === 'on_delivery').length,
      avgRating: drivers.length
        ? (drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length).toFixed(1)
        : '—',
    };
  }, [drivers]);

  const orderCompletionData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const dayOrders = orders.filter((order) => new Date(order.created_at).toDateString() === date.toDateString());
      return {
        day: date.toLocaleDateString('en-IN', { weekday: 'short' }),
        completed: dayOrders.filter((order) => order.status === 'delivered').length,
        failed: dayOrders.filter((order) => order.status === 'failed').length,
        pending: dayOrders.filter((order) => ['draft', 'pending', 'confirmed', 'assigned'].includes(order.status)).length,
      };
    });
  }, [orders]);

  const revenueData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 4 }, (_, index) => {
      const start = new Date(today);
      start.setDate(today.getDate() - (3 - index) * 7 - 6);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      const declaredValue = orders
        .filter((order) => {
          const createdAt = new Date(order.created_at).getTime();
          return createdAt >= start.getTime() && createdAt < end.getTime();
        })
        .reduce((sum, order) => sum + (order.package_value ?? 0), 0);
      return { week: `Week ${index + 1}`, declaredValue };
    });
  }, [orders]);

  const deliveryTimeData = useMemo(() => {
    const statuses = ['pending', 'accepted', 'in_progress', 'completed'];
    const activeAssignments = assignments.filter((assignment) => statuses.includes(assignment.status));
    return statuses.map((status) => {
      const count = activeAssignments.filter((assignment) => assignment.status === status).length;
      return {
        range: status.replace(/_/g, ' '),
        count,
        percentage: activeAssignments.length ? (count / activeAssignments.length) * 100 : 0,
      };
    }).filter((entry) => entry.count > 0);
  }, [assignments]);

  const driverPerformanceData = useMemo(
    () => drivers
      .map((driver) => ({ name: driver.employee_id, deliveries: driver.total_deliveries_completed, rating: driver.rating }))
      .sort((left, right) => right.deliveries - left.deliveries)
      .slice(0, 10),
    [drivers]
  );

  const routeHealth = useMemo(() => {
    const statuses = [
      { key: 'available', label: 'Available', tone: 'text-success-foreground', bar: 'bg-success-foreground' },
      { key: 'on_delivery', label: 'On delivery', tone: 'text-info-foreground', bar: 'bg-info-foreground' },
      { key: 'on_break', label: 'On break', tone: 'text-warning-foreground', bar: 'bg-warning-foreground' },
      { key: 'off_duty', label: 'Off duty', tone: 'text-muted-foreground', bar: 'bg-muted-foreground' },
    ];
    return statuses.map((status) => {
      const count = drivers.filter((driver) => driver.current_status === status.key).length;
      return { ...status, value: drivers.length ? Math.round((count / drivers.length) * 100) : 0, count };
    });
  }, [drivers]);

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
        driver: driver ? driver.employee_id : 'Unassigned',
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
      <div className="flex w-full flex-col gap-6">
        <header className="order-1 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-[28px] font-bold tracking-tight text-foreground">{welcomeTitle}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Today’s orders, fleet status, and delivery performance.</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <label className="relative inline-flex h-11 items-center gap-2 rounded-xl border border-input bg-card pl-3 pr-2 text-sm text-foreground shadow-sm focus-within:ring-2 focus-within:ring-ring">
              <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="sr-only">Recent order date range</span>
              <select value={dateRange} onChange={(event) => setDateRange(event.target.value)} aria-label="Recent order date range" className="h-full min-w-32 bg-transparent pr-2 text-sm focus:outline-none [color-scheme:light] dark:[color-scheme:dark]">
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </label>
            <button type="button" onClick={exportOrders} className="inline-flex h-11 items-center gap-2 rounded-xl border border-input bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </header>

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

        <div className="order-2 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {statStyles.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={cn('surface-glass flex h-full min-h-[160px] items-start justify-between gap-4 rounded-xl border border-t-[3px] p-4 transition hover:border-ring/50', stat.border)}>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className={cn('mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl', stat.accent)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{stat.label}</p>
                  <div className="mt-3 flex items-end gap-2">
                    <p className="text-3xl font-bold tabular-nums text-foreground">{dashboardStats[index].toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="order-3 grid grid-cols-12 gap-6">
          <section className="surface-glass col-span-12 rounded-xl border border-border border-t-[3px] border-t-brand-600 p-4 md:p-5 xl:col-span-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-500"><Activity className="h-5 w-5" /></span>
                <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Operations overview</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">Service performance</h2>
                </div>
              </div>
              <span className="inline-flex min-h-7 items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-semibold text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                {orderStats.total.toLocaleString('en-IN')} total orders
              </span>
            </div>

            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={orderCompletionData} margin={{ top: 12, right: 20, left: 0, bottom: 8 }}>
                <defs>
                  <linearGradient id="serviceCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartTheme.colors[0]} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={chartTheme.colors[0]} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="serviceFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartTheme.colors[3]} stopOpacity={0.24} />
                    <stop offset="95%" stopColor={chartTheme.colors[3]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="day" stroke={chartTheme.label} tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis stroke={chartTheme.label} width={32} tickLine={false} axisLine={false} tickMargin={8} />
                <Tooltip
                  cursor={{ stroke: chartTheme.grid, strokeWidth: 1 }}
                  contentStyle={{ backgroundColor: chartTheme.tooltipBackground, border: chartTheme.tooltipBorder, color: chartTheme.tooltipForeground, borderRadius: '0.75rem' }}
                />
                <Legend wrapperStyle={{ paddingTop: 12, fontSize: '12px' }} />
                <Area type="monotone" dataKey="completed" name="Completed" stroke={chartTheme.colors[0]} fill="url(#serviceCompleted)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="failed" name="Failed" stroke={chartTheme.colors[3]} fill="url(#serviceFailed)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </section>

          <section className="surface-glass col-span-12 rounded-xl border border-border border-t-[3px] border-t-danger p-4 md:p-5 xl:col-span-4">
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
            <a href="/dispatch" className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-primary transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">View all alerts <ArrowUpRight className="ml-1 h-4 w-4" /></a>
          </section>
        </div>

        <div className="order-5 grid grid-cols-12 gap-6">
          <div className="surface-glass col-span-12 rounded-xl border border-border border-t-[3px] border-t-info p-4 md:p-5">
            <div className="mb-6 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-info/10 text-info-foreground"><MapPin className="h-5 w-5" /></span>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Fleet availability</h3>
                <p className="mt-1 text-sm text-muted-foreground">Driver distribution by current availability status</p>
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

        <div className="order-6 grid grid-cols-12 gap-6">
          <div className="surface-glass col-span-12 rounded-xl border border-border border-t-[3px] border-t-brand-600 p-4 md:p-5 xl:col-span-6">
            <div className="mb-6 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-500"><DollarSign className="h-5 w-5" /></span>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Declared Package Value</h3>
                <p className="mt-1 text-sm text-muted-foreground">Package values are not collected revenue.</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="week" stroke={chartTheme.label} />
                <YAxis stroke={chartTheme.label} />
                <Tooltip contentStyle={{ backgroundColor: chartTheme.tooltipBackground, border: chartTheme.tooltipBorder, color: chartTheme.tooltipForeground }} />
                <Legend />
                <Bar dataKey="declaredValue" name="Declared package value" fill={chartTheme.colors[0]} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="surface-glass col-span-12 rounded-xl border border-border border-t-[3px] border-t-violet p-4 md:p-5 xl:col-span-6">
            <div className="mb-6 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet/10 text-violet-foreground"><Clock3 className="h-5 w-5" /></span>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Assignment Status</h3>
                <p className="mt-1 text-sm text-muted-foreground">Distribution across active delivery work.</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deliveryTimeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${Math.round(percentage)}%`}
                  outerRadius={80}
                  fill={chartTheme.colors[0]}
                  dataKey="percentage"
                >
                  {deliveryTimeData.map((entry, index) => (
                    <Cell key={`cell-${entry.range}`} fill={chartTheme.colors[index % chartTheme.colors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: chartTheme.tooltipBackground, border: chartTheme.tooltipBorder, color: chartTheme.tooltipForeground }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="order-7 grid grid-cols-12 gap-6">
          <div className="surface-glass col-span-12 rounded-xl border border-border border-t-[3px] border-t-success p-4 md:p-5 xl:col-span-6">
            <div className="mb-6 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success-foreground"><Truck className="h-5 w-5" /></span>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Top Driver Performance</h3>
                <p className="mt-1 text-sm text-muted-foreground">Deliveries and customer ratings</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={driverPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="name" stroke={chartTheme.label} />
                <YAxis stroke={chartTheme.label} />
                <Tooltip contentStyle={{ backgroundColor: chartTheme.tooltipBackground, border: chartTheme.tooltipBorder, color: chartTheme.tooltipForeground }} />
                <Legend />
                <Line type="monotone" dataKey="deliveries" stroke={chartTheme.colors[0]} strokeWidth={2} dot={{ fill: chartTheme.colors[0], r: 4 }} />
                <Line type="monotone" dataKey="rating" stroke={chartTheme.colors[2]} strokeWidth={2} dot={{ fill: chartTheme.colors[2], r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="surface-glass col-span-12 rounded-xl border border-border border-t-[3px] border-t-brand-600 p-4 md:p-5 xl:col-span-6">
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
              {dispatchBoard.map((job) => (
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

        <div className="order-4 grid grid-cols-12 gap-6">
          <section className="col-span-12 min-w-0 space-y-4 xl:col-span-8">
            <OrdersTable orders={filteredOrders.slice(0, 5)} title="Recent orders" subtitle="Latest activity" />
          </section>

          <section className="col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-4 xl:grid-cols-1">
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
    </div>
  );
}
