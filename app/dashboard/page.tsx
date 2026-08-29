'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';
import { useAuth } from '@/hooks';
import { useMockOrders, useMockDrivers } from '@/services/mockData';
import { cn, formatDate } from '@/utils/helpers';
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
  LogOut,
  Package,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Clock3,
  TrendingUp,
  AlertTriangle,
  Users,
  ArrowUpRight,
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

const COLORS = ['#06b6d4', '#0ea5e9', '#6366f1', '#8b5cf6'];

const sampleStats = [
  { label: 'Active orders', value: 28, icon: Package, accent: 'from-cyan-500 to-blue-500' },
  { label: 'Pending assignments', value: 14, icon: MapPin, accent: 'from-violet-500 to-fuchsia-500' },
  { label: 'On-time deliveries', value: 96, icon: CheckCircle2, accent: 'from-emerald-500 to-teal-500' },
  { label: 'Operational uptime', value: '99.8%', icon: ShieldCheck, accent: 'from-slate-500 to-slate-700' },
];

const routeHealth = [
  { label: 'City routes', value: 87, tone: 'text-emerald-300', bar: 'bg-emerald-400' },
  { label: 'Outskirts', value: 72, tone: 'text-cyan-300', bar: 'bg-cyan-400' },
  { label: 'High priority', value: 91, tone: 'text-violet-300', bar: 'bg-violet-400' },
];

const priorityAlerts = [
  { title: 'Orders due in 30 mins', count: 6, level: 'High' },
  { title: 'Vehicle maintenance due', count: 3, level: 'Medium' },
  { title: 'Customer escalations', count: 1, level: 'Low' },
];

const dispatchBoard = [
  { id: 'NMD-1048', zone: 'Downtown', driver: 'Rahul K.', eta: '12 min', status: 'On route' },
  { id: 'NMD-1037', zone: 'Industrial', driver: 'Amit P.', eta: '18 min', status: 'Picking up' },
  { id: 'NMD-1024', zone: 'Airport', driver: 'Sonia R.', eta: '26 min', status: 'Delayed' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const { orders } = useMockOrders();
  const { drivers } = useMockDrivers();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/signin');
    }
  }, [loading, user, router]);

  const welcomeTitle = useMemo(
    () => (user?.full_name ? `Welcome back, ${user.full_name}` : 'Welcome to NMD Logistics'),
    [user]
  );

  const handleSignOut = async () => {
    setSigningOut(true);
    await authService.signOut();
    setSigningOut(false);
    router.replace('/auth/signin');
  };

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
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container-main mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="surface-glass mb-8 flex flex-col gap-6 rounded-3xl p-8 sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-400/80">Operations dashboard</p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">{welcomeTitle}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                Real-time analytics, order tracking, and team performance across your logistics network.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20">
                <ArrowUpRight className="h-4 w-4" />
                New dispatch
              </button>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300/20 bg-slate-100/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-100/20 hover:border-slate-300/30 dark:border-slate-700/30 dark:bg-slate-950 dark:hover:bg-slate-900 dark:hover:border-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {sampleStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="surface-glass group rounded-2xl p-6 transition hover:border-cyan-400/40">
                  <div className={cn('inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg', stat.accent)}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
                  <div className="mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 opacity-60" />
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <section className="surface-glass rounded-2xl p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Operations overview</p>
                <h2 className="mt-3 text-2xl font-bold text-white">Service performance</h2>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                <TrendingUp className="h-3.5 w-3.5" />
                +12.4%
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-sm">Avg. route time</span>
                  <Clock3 className="h-4 w-4 text-cyan-300" />
                </div>
                <p className="mt-4 text-3xl font-bold text-white">42m</p>
                <p className="mt-2 text-xs text-emerald-300">-6 min vs last week</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-sm">Fleet active</span>
                  <Truck className="h-4 w-4 text-violet-300" />
                </div>
                <p className="mt-4 text-3xl font-bold text-white">26</p>
                <p className="mt-2 text-xs text-violet-300">4 vehicles in reserve</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-sm">Support load</span>
                  <Users className="h-4 w-4 text-amber-300" />
                </div>
                <p className="mt-4 text-3xl font-bold text-white">8</p>
                <p className="mt-2 text-xs text-amber-300">2 supervisors online</p>
              </div>
            </div>
          </section>

          <section className="surface-glass rounded-2xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Priority alerts</p>
                <h2 className="mt-3 text-xl font-bold text-white">Watchlist</h2>
              </div>
              <BellRing className="h-5 w-5 text-cyan-300" />
            </div>

            <div className="space-y-3">
              {priorityAlerts.map((alert) => (
                <div key={alert.title} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                  <div>
                    <p className="text-sm font-medium text-white">{alert.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{alert.count} items needing attention</p>
                  </div>
                  <span className={cn(
                    'rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]',
                    alert.level === 'High' && 'bg-rose-500/15 text-rose-300',
                    alert.level === 'Medium' && 'bg-amber-500/15 text-amber-300',
                    alert.level === 'Low' && 'bg-emerald-500/15 text-emerald-300'
                  )}>
                    {alert.level}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <div className="surface-glass rounded-2xl p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white">Order Completion Trends</h3>
              <p className="mt-1 text-sm text-slate-400">Weekly order status distribution</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={orderCompletionData}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                <Area type="monotone" dataKey="completed" stroke="#10b981" fillOpacity={1} fill="url(#colorCompleted)" />
                <Area type="monotone" dataKey="failed" stroke="#ef4444" fillOpacity={1} fill="url(#colorFailed)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="surface-glass rounded-2xl p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white">Route efficiency</h3>
              <p className="mt-1 text-sm text-slate-400">Operational route health status</p>
            </div>
            <div className="space-y-5">
              {routeHealth.map((route) => (
                <div key={route.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-300">{route.label}</span>
                    <span className={cn('font-semibold', route.tone)}>{route.value}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div className={cn('h-full rounded-full', route.bar)} style={{ width: `${route.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <div className="surface-glass rounded-2xl p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white">Revenue Performance</h3>
              <p className="mt-1 text-sm text-slate-400">Weekly revenue vs target</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="week" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                <Legend />
                <Bar dataKey="revenue" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                <Bar dataKey="target" fill="#64748b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="surface-glass rounded-2xl p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white">Delivery Time Distribution</h3>
              <p className="mt-1 text-sm text-slate-400">How long deliveries take</p>
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
                  fill="#8884d8"
                  dataKey="percentage"
                >
                  {deliveryTimeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <div className="surface-glass rounded-2xl p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white">Top Driver Performance</h3>
              <p className="mt-1 text-sm text-slate-400">Deliveries and customer ratings</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={driverPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                <Legend />
                <Line type="monotone" dataKey="deliveries" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 4 }} />
                <Line type="monotone" dataKey="rating" stroke="#fbbf24" strokeWidth={2} dot={{ fill: '#fbbf24', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="surface-glass rounded-2xl p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Dispatch board</h3>
                <p className="mt-1 text-sm text-slate-400">Current route assignments</p>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">Live</span>
            </div>

            <div className="space-y-3">
              {dispatchBoard.map((job) => (
                <div key={job.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{job.id}</p>
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-300">{job.zone}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{job.driver}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-cyan-300">{job.eta}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">{job.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.9fr_1fr]">
          <section className="surface-glass rounded-2xl p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Latest activity</p>
                <h2 className="mt-4 text-2xl font-bold text-white">Recent Orders</h2>
              </div>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-300">LIVE</span>
            </div>

            <div className="mt-8 space-y-3">
              {orders.slice(0, 3).map((order) => (
                <div key={order.id} className="surface-glass rounded-xl p-4 transition hover:border-cyan-400/50">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-semibold text-white">{order.order_number}</p>
                    <span className="rounded-full bg-slate-700/50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-300">{order.status}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">{order.client_name}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="font-semibold text-cyan-300">₹{order.package_value?.toLocaleString('en-IN')}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-600" />
                    <span>{formatDate(order.created_at, 'short')}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-5">
            <div className="surface-glass rounded-2xl p-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Order Stats</h3>
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Delivered</span>
                  <span className="font-bold text-emerald-300">{orderStats.delivered}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">In Transit</span>
                  <span className="font-bold text-violet-300">{orderStats.inTransit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Pending</span>
                  <span className="font-bold text-amber-300">{orderStats.pending}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Failed</span>
                  <span className="font-bold text-rose-300">{orderStats.failed}</span>
                </div>
              </div>
            </div>

            <div className="surface-glass rounded-2xl p-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Driver Stats</h3>
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Total</span>
                  <span className="font-bold text-cyan-300">{driverStats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Available</span>
                  <span className="font-bold text-emerald-300">{driverStats.available}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">On Delivery</span>
                  <span className="font-bold text-violet-300">{driverStats.onDelivery}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Avg Rating</span>
                  <span className="font-bold text-yellow-300">{driverStats.avgRating}⭐</span>
                </div>
              </div>
            </div>

            <div className="surface-glass rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">System health</h3>
                <AlertTriangle className="h-4 w-4 text-amber-300" />
              </div>
              <div className="mt-5 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4">
                <p className="text-sm font-medium text-amber-200">2 low-priority issues</p>
                <p className="mt-2 text-xs text-amber-100/80">Vehicle checks and delayed pickups are being monitored.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
