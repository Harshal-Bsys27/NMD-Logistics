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
import { LogOut, Package, MapPin, CheckCircle2, ShieldCheck } from 'lucide-react';

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
        {/* Header */}
        <div className="mb-8 flex flex-col gap-6 rounded-[2rem] border border-slate-800 bg-slate-900/90 p-8 shadow-[0_35px_120px_-40px_rgba(15,23,42,0.75)] backdrop-blur-xl sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-300/80">Operations dashboard</p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{welcomeTitle}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                Real-time logistics analytics and order tracking across your operations.
              </p>
            </div>

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex items-center justify-center gap-2 rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/30 transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {sampleStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="group overflow-hidden rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-6 transition hover:border-cyan-400/20 hover:bg-slate-900">
                  <div className={cn('inline-flex rounded-3xl p-3 text-white shadow-lg shadow-cyan-500/10', stat.accent)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-6 text-sm uppercase tracking-[0.24em] text-slate-500">{stat.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{stat.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Charts Grid - Row 1 */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          {/* Order Completion Chart */}
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6">
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

          {/* Revenue vs Target */}
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6">
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
        </div>

        {/* Charts Grid - Row 2 */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          {/* Delivery Time Distribution */}
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6">
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

          {/* Driver Performance */}
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6">
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
        </div>

        {/* Bottom Section */}
        <div className="grid gap-6 xl:grid-cols-[1.9fr_1fr]">
          {/* Recent Activity */}
          <section className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-8 shadow-[0_35px_120px_-40px_rgba(15,23,42,0.75)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Latest activity</p>
                <h2 className="mt-4 text-2xl font-semibold text-white">Recent Orders</h2>
              </div>
              <span className="rounded-3xl bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">Live</span>
            </div>

            <div className="mt-8 space-y-5">
              {orders.slice(0, 3).map((order) => (
                <div key={order.id} className="rounded-[1.75rem] border border-slate-800 bg-slate-950/70 p-5 transition hover:border-cyan-400/20">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-lg font-semibold text-white">{order.order_number}</p>
                    <span className="rounded-2xl bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-400">{order.status}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{order.client_name}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <span>₹{order.package_value?.toLocaleString('en-IN')}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-600" />
                    <span>{formatDate(order.created_at, 'short')}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Stats */}
          <section className="space-y-6">
            {/* Order Stats */}
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6">
              <h3 className="text-sm uppercase tracking-[0.24em] text-slate-500">Order Stats</h3>
              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Delivered</span>
                  <span className="font-bold text-emerald-300">{orderStats.delivered}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">In Transit</span>
                  <span className="font-bold text-violet-300">{orderStats.inTransit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Pending</span>
                  <span className="font-bold text-amber-300">{orderStats.pending}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Failed</span>
                  <span className="font-bold text-rose-300">{orderStats.failed}</span>
                </div>
              </div>
            </div>

            {/* Driver Stats */}
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6">
              <h3 className="text-sm uppercase tracking-[0.24em] text-slate-500">Driver Stats</h3>
              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total</span>
                  <span className="font-bold text-cyan-300">{driverStats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Available</span>
                  <span className="font-bold text-emerald-300">{driverStats.available}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">On Delivery</span>
                  <span className="font-bold text-violet-300">{driverStats.onDelivery}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Avg Rating</span>
                  <span className="font-bold text-yellow-300">{driverStats.avgRating}⭐</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
