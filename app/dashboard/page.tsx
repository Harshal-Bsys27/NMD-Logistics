'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { useMockOrders, useMockDrivers } from '@/services/mockData';
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
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  BellRing,
} from 'lucide-react';

// Chart data
const orderCompletionData = [
  { day: 'Mon', completed: 12, failed: 2, pending: 5 },
  { day: 'Tue', completed: 19, failed: 1, pending: 4 },
  { day: 'Wed', completed: 15, failed: 3, pending: 3 },
  { day: 'Thu', completed: 22, failed: 2, pending: 6 },
  { day: 'Fri', completed: 25, failed: 1, pending: 4 },
  { day: 'Sat', completed: 18, failed: 2, pending: 5 },
  { day: 'Sun', completed: 14, failed: 0, pending: 3 },
];

const revenueData = [
  { week: 'Week 1', revenue: 45000, target: 50000 },
  { week: 'Week 2', revenue: 52000, target: 50000 },
  { week: 'Week 3', revenue: 48000, target: 50000 },
  { week: 'Week 4', revenue: 61000, target: 50000 },
];

const deliveryTimeData = [
  { range: '0-30m', count: 25, percentage: 35 },
  { range: '30-60m', count: 30, percentage: 42 },
  { range: '60-90m', count: 10, percentage: 14 },
  { range: '90m+', count: 6, percentage: 9 },
];

const driverPerformanceData = [
  { name: 'EMP001', deliveries: 45, rating: 4.8 },
  { name: 'EMP002', deliveries: 38, rating: 4.6 },
  { name: 'EMP003', deliveries: 22, rating: 4.7 },
];

const chartTheme = {
  grid: 'hsl(var(--border))',
  label: 'hsl(var(--muted-foreground))',
  tooltipBackground: 'hsl(var(--popover))',
  tooltipForeground: 'hsl(var(--popover-foreground))',
  tooltipBorder: '1px solid hsl(var(--border))',
  colors: [
    'hsl(var(--info-foreground))',
    'hsl(var(--success-foreground))',
    'hsl(var(--warning-foreground))',
    'hsl(var(--destructive))',
  ],
};

const sampleStats = [
  {
    label: 'Active orders',
    value: 28,
    suffix: '',
    icon: Package,
    accent: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    chip: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-500/25',
    sparkline: [3, 5, 4, 7, 6, 8, 7],
    trend: '+12.4%',
  },
  {
    label: 'Pending assignments',
    value: 14,
    suffix: '',
    icon: MapPin,
    accent: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    chip: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-500/25',
    sparkline: [7, 5, 6, 4, 5, 3, 4],
    trend: '+8.1%',
  },
  {
    label: 'On-time deliveries',
    value: 96,
    suffix: '%',
    icon: CheckCircle2,
    accent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-500/25',
    sparkline: [4, 5, 6, 6, 7, 8, 8],
    trend: '+2.8%',
  },
  {
    label: 'Operational uptime',
    value: '99.8',
    suffix: '%',
    icon: ShieldCheck,
    accent: 'bg-slate-200 text-slate-700 dark:bg-slate-700/80 dark:text-slate-200',
    chip: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    border: 'border-slate-200 dark:border-slate-700/80',
    sparkline: [7, 7, 8, 8, 8, 9, 9],
    trend: '+0.6%',
  },
];

const routeHealth = [
  { label: 'City routes', value: 87, tone: 'text-success-foreground', bar: 'bg-success-foreground' },
  { label: 'Outskirts', value: 72, tone: 'text-info-foreground', bar: 'bg-info-foreground' },
  { label: 'High priority', value: 91, tone: 'text-warning-foreground', bar: 'bg-warning-foreground' },
];

const priorityAlerts = [
  { title: 'Orders due in 30 mins', count: 6, level: 'High', border: 'border-l-red-500 bg-red-500/5', badge: 'bg-red-500/10 text-red-700 dark:bg-red-500/15 dark:text-red-300' },
  { title: 'Vehicle maintenance due', count: 3, level: 'Medium', border: 'border-l-amber-500 bg-amber-500/5', badge: 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
  { title: 'Customer escalations', count: 1, level: 'Low', border: 'border-l-emerald-500 bg-emerald-500/5', badge: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
];

const dispatchBoard = [
  { id: 'NMD-1048', zone: 'Downtown', driver: 'Rahul K.', eta: '12 min', status: 'On route' },
  { id: 'NMD-1037', zone: 'Industrial', driver: 'Amit P.', eta: '18 min', status: 'Picking up' },
  { id: 'NMD-1024', zone: 'Airport', driver: 'Sonia R.', eta: '26 min', status: 'Delayed' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { orders } = useMockOrders();
  const { drivers } = useMockDrivers();

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
      pending: orders.filter((o) => o.status === 'draft' || o.status === 'confirmed').length,
      failed: orders.filter((o) => o.status === 'failed').length,
    };
  }, [orders]);

  const driverStats = useMemo(() => {
    return {
      total: drivers.length,
      available: drivers.filter((d) => d.current_status === 'available').length,
      onDelivery: drivers.filter((d) => d.current_status === 'on_delivery').length,
      avgRating: (drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length).toFixed(1),
    };
  }, [drivers]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground">
      <div className="flex w-full flex-col gap-4">
        <header className="order-1 flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{welcomeTitle}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Today’s orders, fleet status, and delivery performance.</p>
          </div>
        </header>

        <div className="order-2 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {sampleStats.map((stat) => {
            const Icon = stat.icon;
            const min = Math.min(...stat.sparkline);
            const max = Math.max(...stat.sparkline);
            const range = max - min || 1;
            const points = stat.sparkline
              .map((value, index) => `${(index / (stat.sparkline.length - 1)) * 100},${22 - ((value - min) / range) * 18}`)
              .join(' ');
            return (
              <div key={stat.label} className={cn('surface-glass flex h-full min-h-[160px] items-start justify-between gap-4 rounded-xl border p-4 transition hover:border-ring/50', stat.border)}>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className={cn('mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg', stat.accent)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{stat.label}</p>
                  <div className="mt-3 flex items-end gap-2">
                    <p className="text-3xl font-bold tabular-nums text-foreground">{stat.value}{stat.suffix}</p>
                    <span className={cn('inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold', stat.chip)}>{stat.trend}</span>
                  </div>
                </div>
                <svg className="mt-auto h-10 w-20 shrink-0 self-end text-foreground/70" viewBox="0 0 100 24" role="img" aria-label={`${stat.label} seven-day trend`}>
                  <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            );
          })}
        </div>

        <div className="order-3 grid grid-cols-12 gap-4">
          <section className="surface-glass col-span-12 rounded-xl border border-border p-4 md:p-5 xl:col-span-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Operations overview</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">Service performance</h2>
              </div>
              <span className="inline-flex min-h-7 items-center gap-2 rounded-full border border-success/30 bg-success px-3 py-1 text-xs font-semibold text-success-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                +12.4%
              </span>
            </div>

            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={orderCompletionData} margin={{ top: 12, right: 20, left: 0, bottom: 8 }}>
                <defs>
                  <linearGradient id="serviceCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartTheme.colors[1]} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={chartTheme.colors[1]} stopOpacity={0} />
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
                <Area type="monotone" dataKey="completed" name="Completed" stroke={chartTheme.colors[1]} fill="url(#serviceCompleted)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="failed" name="Failed" stroke={chartTheme.colors[3]} fill="url(#serviceFailed)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </section>

          <section className="surface-glass col-span-12 rounded-xl border border-border p-4 md:p-5 xl:col-span-4">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Priority alerts</p>
                <h2 className="mt-2 text-lg font-semibold text-foreground">Watchlist</h2>
              </div>
              <BellRing className="h-5 w-5 text-primary" />
            </div>

            <div className="space-y-3">
              {priorityAlerts.map((alert) => (
                <div key={alert.title} className={cn('flex items-center justify-between gap-3 rounded-md border border-l-4 border-border bg-muted/30 p-3', alert.border)}>
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
          </section>
        </div>

        <div className="order-5 grid grid-cols-12 gap-4">
          <div className="surface-glass col-span-12 rounded-xl border border-border p-4 md:p-5">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground">Route efficiency</h3>
              <p className="mt-1 text-sm text-muted-foreground">Operational route health status</p>
            </div>
            <div className="space-y-5">
              {routeHealth.map((route) => (
                <div key={route.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-foreground">{route.label}</span>
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

        <div className="order-6 grid grid-cols-12 gap-4">
          <div className="surface-glass col-span-12 rounded-xl border border-border p-4 md:p-5 xl:col-span-6">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground">Revenue Performance</h3>
              <p className="mt-1 text-sm text-muted-foreground">Weekly revenue vs target</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="week" stroke={chartTheme.label} />
                <YAxis stroke={chartTheme.label} />
                <Tooltip contentStyle={{ backgroundColor: chartTheme.tooltipBackground, border: chartTheme.tooltipBorder, color: chartTheme.tooltipForeground }} />
                <Legend />
                <Bar dataKey="revenue" fill={chartTheme.colors[0]} radius={[6, 6, 0, 0]} />
                <Bar dataKey="target" fill={chartTheme.grid} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="surface-glass col-span-12 rounded-xl border border-border p-4 md:p-5 xl:col-span-6">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground">Delivery Time Distribution</h3>
              <p className="mt-1 text-sm text-muted-foreground">How long deliveries take</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deliveryTimeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
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

        <div className="order-7 grid grid-cols-12 gap-4">
          <div className="surface-glass col-span-12 rounded-xl border border-border p-4 md:p-5 xl:col-span-6">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground">Top Driver Performance</h3>
              <p className="mt-1 text-sm text-muted-foreground">Deliveries and customer ratings</p>
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

          <div className="surface-glass col-span-12 rounded-xl border border-border p-4 md:p-5 xl:col-span-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Dispatch board</h3>
                <p className="mt-1 text-sm text-muted-foreground">Current route assignments</p>
              </div>
            </div>

            <div className="space-y-3">
              {dispatchBoard.map((job) => (
                <div key={job.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 p-3">
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

        <div className="order-4 grid grid-cols-12 gap-4">
          <section className="col-span-12 min-w-0 space-y-4 xl:col-span-8">
            <OrdersTable orders={orders.slice(0, 5)} title="Recent orders" subtitle="Latest activity" />
          </section>

          <section className="col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-4 xl:grid-cols-1">
            <div className="surface-glass h-full rounded-xl border border-border p-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Order Stats</h3>
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Delivered</span>
                  <span className="font-bold tabular-nums text-success-foreground">{orderStats.delivered}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">In Transit</span>
                  <span className="font-bold tabular-nums text-info-foreground">{orderStats.inTransit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="font-bold tabular-nums text-warning-foreground">{orderStats.pending}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Failed</span>
                  <span className="font-bold tabular-nums text-danger-foreground">{orderStats.failed}</span>
                </div>
              </div>
            </div>

            <div className="surface-glass h-full rounded-xl border border-border p-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Driver Stats</h3>
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

            <div className="surface-glass h-full rounded-xl border border-border p-4 sm:col-span-2 xl:col-span-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">System health</h3>
                <AlertTriangle className="h-4 w-4 text-warning-foreground" />
              </div>
              <div className="mt-5 rounded-md border border-warning/30 bg-warning p-4">
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
