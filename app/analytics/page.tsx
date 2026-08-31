'use client';

import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, Truck, AlertCircle, Users } from 'lucide-react';

const orderTrendData = [
  { date: 'Mon', orders: 32, delivered: 28, failed: 2, pending: 4 },
  { date: 'Tue', orders: 45, delivered: 42, failed: 1, pending: 2 },
  { date: 'Wed', orders: 38, delivered: 36, failed: 1, pending: 1 },
  { date: 'Thu', orders: 52, delivered: 50, failed: 1, pending: 1 },
  { date: 'Fri', orders: 48, delivered: 46, failed: 2, pending: 0 },
  { date: 'Sat', orders: 35, delivered: 33, failed: 0, pending: 2 },
  { date: 'Sun', orders: 28, delivered: 27, failed: 1, pending: 0 },
];

const revenueData = [
  { period: 'Week 1', revenue: 45000, costs: 12000, profit: 33000 },
  { period: 'Week 2', revenue: 52000, costs: 14000, profit: 38000 },
  { period: 'Week 3', revenue: 48000, costs: 13000, profit: 35000 },
  { period: 'Week 4', revenue: 61000, costs: 16000, profit: 45000 },
];

const statusDistribution = [
  { name: 'Delivered', value: 285, fill: '#10b981' },
  { name: 'In Transit', value: 45, fill: '#06b6d4' },
  { name: 'Pending', value: 28, fill: '#fbbf24' },
  { name: 'Failed', value: 12, fill: '#ef4444' },
];

const driverPerformance = [
  { id: 'DRV001', deliveries: 48, rating: 4.9, efficiency: 92 },
  { id: 'DRV002', deliveries: 45, rating: 4.8, efficiency: 89 },
  { id: 'DRV003', deliveries: 42, rating: 4.7, efficiency: 88 },
  { id: 'DRV004', deliveries: 38, rating: 4.6, efficiency: 85 },
  { id: 'DRV005', deliveries: 35, rating: 4.5, efficiency: 82 },
];

const MetricCard = ({ icon: Icon, label, value, change, color }: any) => (
  <div className="surface-glass rounded-2xl p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">{label}</p>
        <p className="mt-2 text-3xl font-bold text-white">{value}</p>
        <p className={`mt-1 text-sm ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {change >= 0 ? '+' : ''}{change}% vs last week
        </p>
      </div>
      <div className={`rounded-xl p-3 ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
);

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen space-y-8 bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white">Analytics & Performance</h1>
          <p className="mt-2 text-slate-400">Monitor business metrics, driver performance, and operational efficiency</p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={Package}
            label="Total Orders"
            value="370"
            change={12}
            color="bg-gradient-to-br from-cyan-500/20 to-blue-500/20"
          />
          <MetricCard
            icon={TrendingUp}
            label="Revenue (This Month)"
            value="₹2.06L"
            change={18}
            color="bg-gradient-to-br from-emerald-500/20 to-green-500/20"
          />
          <MetricCard
            icon={Truck}
            label="Avg Delivery Time"
            value="2.4h"
            change={-8}
            color="bg-gradient-to-br from-violet-500/20 to-purple-500/20"
          />
          <MetricCard
            icon={Users}
            label="Active Drivers"
            value="24"
            change={5}
            color="bg-gradient-to-br from-orange-500/20 to-rose-500/20"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Order Trends */}
          <div className="surface-glass col-span-1 rounded-2xl p-6 lg:col-span-2">
            <h2 className="mb-6 text-lg font-semibold text-white">Order Trends (Weekly)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={orderTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                <Legend />
                <Bar dataKey="delivered" stackId="a" fill="#10b981" />
                <Bar dataKey="pending" stackId="a" fill="#fbbf24" />
                <Bar dataKey="failed" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Order Status Distribution */}
          <div className="surface-glass rounded-2xl p-6">
            <h2 className="mb-6 text-lg font-semibold text-white">Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="surface-glass rounded-2xl p-6">
          <h2 className="mb-6 text-lg font-semibold text-white">Revenue & Profitability (Weekly)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="period" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4' }} />
              <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
              <Line type="monotone" dataKey="costs" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Driver Performance */}
        <div className="surface-glass rounded-2xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Top Performing Drivers</h2>
            <span className="text-sm text-slate-400">Based on this month's data</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Driver ID</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Deliveries</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Rating</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Efficiency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {driverPerformance.map((driver) => (
                  <tr key={driver.id} className="transition hover:bg-slate-800/50">
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-lg bg-cyan-500/20 px-3 py-1 text-sm font-semibold text-cyan-300">{driver.id}</span>
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-semibold text-white">{driver.deliveries}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm font-semibold text-white">{driver.rating}</span>
                        <span className="text-lg">⭐</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-2 w-32 rounded-full bg-slate-700">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                            style={{ width: `${driver.efficiency}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-white">{driver.efficiency}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts & Insights */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="surface-glass rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-amber-500/20 p-3">
                <AlertCircle className="h-6 w-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Peak Hours Alert</h3>
                <p className="mt-1 text-sm text-slate-400">Orders surge by 40% during 10-12 PM. Consider hiring additional drivers.</p>
              </div>
            </div>
          </div>

          <div className="surface-glass rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-emerald-500/20 p-3">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Performance Milestone</h3>
                <p className="mt-1 text-sm text-slate-400">Fleet delivered 370 orders this month - a 15% increase!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
