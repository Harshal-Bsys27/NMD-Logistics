'use client';

import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, Truck, AlertCircle, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const chartTheme = {
  grid: 'hsl(var(--border))',
  label: 'hsl(var(--muted-foreground))',
  tooltipBackground: 'hsl(var(--popover))',
  tooltipForeground: 'hsl(var(--popover-foreground))',
  tooltipBorder: '1px solid hsl(var(--border))',
  colors: [
    'hsl(var(--success-foreground))',
    'hsl(var(--info-foreground))',
    'hsl(var(--warning-foreground))',
    'hsl(var(--destructive))',
  ],
};

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
  { name: 'Delivered', value: 285 },
  { name: 'In Transit', value: 45 },
  { name: 'Pending', value: 28 },
  { name: 'Failed', value: 12 },
];

const driverPerformance = [
  { id: 'DRV001', deliveries: 48, rating: 4.9, efficiency: 92 },
  { id: 'DRV002', deliveries: 45, rating: 4.8, efficiency: 89 },
  { id: 'DRV003', deliveries: 42, rating: 4.7, efficiency: 88 },
  { id: 'DRV004', deliveries: 38, rating: 4.6, efficiency: 85 },
  { id: 'DRV005', deliveries: 35, rating: 4.5, efficiency: 82 },
];

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  change: number;
  color: string;
}

function MetricCard({ icon: Icon, label, value, change, color }: MetricCardProps) {
  return (
  <div className="surface-glass h-full rounded-lg border border-border p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{value}</p>
        <p className={`mt-1 text-sm ${change >= 0 ? 'text-success-foreground' : 'text-danger-foreground'}`}>
          {change >= 0 ? '+' : ''}{change}% vs last week
        </p>
      </div>
      <div className={`rounded-md p-3 ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  </div>
  );
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="w-full space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Analytics & Performance</h1>
          <p className="mt-2 text-muted-foreground">Monitor business metrics, driver performance, and operational efficiency</p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={Package}
            label="Total Orders"
            value="370"
            change={12}
            color="bg-info text-info-foreground"
          />
          <MetricCard
            icon={TrendingUp}
            label="Revenue (This Month)"
            value="₹2.06L"
            change={18}
            color="bg-success text-success-foreground"
          />
          <MetricCard
            icon={Truck}
            label="Avg Delivery Time"
            value="2.4h"
            change={-8}
            color="bg-primary/10 text-primary"
          />
          <MetricCard
            icon={Users}
            label="Active Drivers"
            value="24"
            change={5}
            color="bg-warning text-warning-foreground"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Order Trends */}
          <div className="surface-glass col-span-1 rounded-lg border border-border p-5 lg:col-span-2">
            <h2 className="mb-6 text-lg font-semibold text-foreground">Order Trends (Weekly)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={orderTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="date" stroke={chartTheme.label} />
                <YAxis stroke={chartTheme.label} />
                <Tooltip contentStyle={{ backgroundColor: chartTheme.tooltipBackground, border: chartTheme.tooltipBorder, color: chartTheme.tooltipForeground }} />
                <Legend />
                <Bar dataKey="delivered" stackId="a" fill={chartTheme.colors[0]} />
                <Bar dataKey="pending" stackId="a" fill={chartTheme.colors[2]} />
                <Bar dataKey="failed" stackId="a" fill={chartTheme.colors[3]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Order Status Distribution */}
          <div className="surface-glass rounded-lg border border-border p-5">
            <h2 className="mb-6 text-lg font-semibold text-foreground">Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${entry.name}`} fill={chartTheme.colors[index % chartTheme.colors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: chartTheme.tooltipBackground, border: chartTheme.tooltipBorder, color: chartTheme.tooltipForeground }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="surface-glass rounded-lg border border-border p-5">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Revenue & Profitability (Weekly)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis dataKey="period" stroke={chartTheme.label} />
              <YAxis stroke={chartTheme.label} />
              <Tooltip contentStyle={{ backgroundColor: chartTheme.tooltipBackground, border: chartTheme.tooltipBorder, color: chartTheme.tooltipForeground }} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke={chartTheme.colors[1]} strokeWidth={2} dot={{ fill: chartTheme.colors[1] }} />
              <Line type="monotone" dataKey="profit" stroke={chartTheme.colors[0]} strokeWidth={2} dot={{ fill: chartTheme.colors[0] }} />
              <Line type="monotone" dataKey="costs" stroke={chartTheme.colors[2]} strokeWidth={2} dot={{ fill: chartTheme.colors[2] }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Driver Performance */}
        <div className="surface-glass rounded-lg border border-border p-5">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Top Performing Drivers</h2>
            <span className="text-sm text-muted-foreground">Based on this month's data</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Driver ID</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Deliveries</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Rating</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Efficiency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {driverPerformance.map((driver) => (
                  <tr key={driver.id} className="transition hover:bg-muted/50">
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-md bg-info px-3 py-1 text-sm font-semibold text-info-foreground">{driver.id}</span>
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-semibold tabular-nums text-foreground">{driver.deliveries}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm font-semibold tabular-nums text-foreground">{driver.rating}</span>
                        <span className="text-lg">⭐</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-2 w-32 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-success-foreground"
                            style={{ width: `${driver.efficiency}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-foreground">{driver.efficiency}%</span>
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
          <div className="surface-glass h-full rounded-lg border border-border p-5">
            <div className="flex items-start gap-4">
              <div className="rounded-md bg-warning p-3 text-warning-foreground">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Peak Hours Alert</h3>
                <p className="mt-1 text-sm text-muted-foreground">Orders surge by 40% during 10-12 PM. Consider hiring additional drivers.</p>
              </div>
            </div>
          </div>

          <div className="surface-glass h-full rounded-lg border border-border p-5">
            <div className="flex items-start gap-4">
              <div className="rounded-md bg-success p-3 text-success-foreground">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Performance Milestone</h3>
                <p className="mt-1 text-sm text-muted-foreground">Fleet delivered 370 orders this month - a 15% increase!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
