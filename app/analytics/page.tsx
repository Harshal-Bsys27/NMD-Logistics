'use client';

import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, Truck, AlertCircle, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useOperationsData } from '@/hooks/useOperationsData';

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

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  color: string;
}

function MetricCard({ icon: Icon, label, value, detail, color }: MetricCardProps) {
  return (
  <div className="surface-glass h-full rounded-lg border border-border p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      </div>
      <div className={`rounded-md p-3 ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  </div>
  );
}

export default function AnalyticsPage() {
  const { orders, drivers, assignments, isLoading, error } = useOperationsData();

  const orderTrendData = React.useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const dayOrders = orders.filter((order) => new Date(order.created_at).toDateString() === date.toDateString());
      return {
        date: date.toLocaleDateString('en-IN', { weekday: 'short' }),
        delivered: dayOrders.filter((order) => order.status === 'delivered').length,
        pending: dayOrders.filter((order) => ['draft', 'pending', 'confirmed', 'assigned'].includes(order.status)).length,
        failed: dayOrders.filter((order) => order.status === 'failed').length,
      };
    });
  }, [orders]);
  const revenueData = React.useMemo(() => {
    const now = new Date();
    return Array.from({ length: 4 }, (_, index) => {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (3 - index) * 7 - 6);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const declaredValue = orders
        .filter((order) => {
          const createdAt = new Date(order.created_at).getTime();
          return createdAt >= weekStart.getTime() && createdAt < weekEnd.getTime();
        })
        .reduce((sum, order) => sum + (order.package_value ?? 0), 0);
      return { period: `Week ${index + 1}`, declared_value: declaredValue };
    });
  }, [orders]);
  const statusDistribution = React.useMemo(() => {
    const counts = orders.reduce<Record<string, number>>((result, order) => {
      result[order.status] = (result[order.status] ?? 0) + 1;
      return result;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));
  }, [orders]);
  const driverPerformance = React.useMemo(
    () => drivers
      .map((driver) => ({
        id: driver.employee_id,
        deliveries: driver.total_deliveries_completed,
        rating: driver.rating,
        status: driver.current_status.replace(/_/g, ' '),
      }))
      .sort((left, right) => right.deliveries - left.deliveries)
      .slice(0, 10),
    [drivers]
  );
  const now = new Date();
  const monthlyOrders = orders.filter((order) => {
    const createdAt = new Date(order.created_at);
    return createdAt.getFullYear() === now.getFullYear() && createdAt.getMonth() === now.getMonth();
  });
  const activeAssignments = assignments.filter((assignment) => ['pending', 'accepted', 'in_progress'].includes(assignment.status)).length;
  const declaredValue = monthlyOrders.reduce((sum, order) => sum + (order.package_value ?? 0), 0);

  return (
    <div className="space-y-8 bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="w-full space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Analytics & Performance</h1>
          <p className="mt-2 text-muted-foreground">Monitor operational metrics from current order, assignment, and driver records.</p>
        </div>

        {error && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger-foreground">{error}</p>}
        {isLoading && <p role="status" className="text-sm text-muted-foreground">Loading analytics…</p>}

        {/* Key Metrics */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={Package}
            label="Total Orders"
            value={orders.length.toLocaleString('en-IN')}
            detail="All available orders"
            color="bg-info text-info-foreground"
          />
          <MetricCard
            icon={TrendingUp}
            label="Declared Value (This Month)"
            value={`₹${declaredValue.toLocaleString('en-IN')}`}
            detail="Package value, not collected revenue"
            color="bg-success text-success-foreground"
          />
          <MetricCard
            icon={Truck}
            label="Active Assignments"
            value={activeAssignments.toLocaleString('en-IN')}
            detail="Pending, accepted, or in progress"
            color="bg-primary/10 text-primary"
          />
          <MetricCard
            icon={Users}
            label="Active Drivers"
            value={drivers.filter((driver) => driver.current_status !== 'off_duty').length.toLocaleString('en-IN')}
            detail={`${drivers.filter((driver) => driver.current_status === 'available').length} currently available`}
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

        {/* Declared value chart */}
        <div className="surface-glass rounded-lg border border-border p-5">
          <h2 className="text-lg font-semibold text-foreground">Declared Package Value (Weekly)</h2>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">Package values are not collected revenue or profit.</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis dataKey="period" stroke={chartTheme.label} />
              <YAxis stroke={chartTheme.label} />
              <Tooltip contentStyle={{ backgroundColor: chartTheme.tooltipBackground, border: chartTheme.tooltipBorder, color: chartTheme.tooltipForeground }} />
              <Legend />
              <Line type="monotone" dataKey="declared_value" name="Declared package value" stroke={chartTheme.colors[1]} strokeWidth={2} dot={{ fill: chartTheme.colors[1] }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Driver Performance */}
        <div className="surface-glass rounded-lg border border-border p-5">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Top Performing Drivers</h2>
            <span className="text-sm text-muted-foreground">Current driver records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Driver ID</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Deliveries</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Rating</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {driverPerformance.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">No driver records available.</td></tr>
                ) : driverPerformance.map((driver) => (
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
                      <span className="text-sm font-semibold capitalize text-foreground">{driver.status}</span>
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
                <h3 className="font-semibold text-foreground">Delivery timing data unavailable</h3>
                <p className="mt-1 text-sm text-muted-foreground">The current schema does not record enough timestamps to calculate delivery-time trends.</p>
              </div>
            </div>
          </div>

          <div className="surface-glass h-full rounded-lg border border-border p-5">
            <div className="flex items-start gap-4">
              <div className="rounded-md bg-success p-3 text-success-foreground">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Performance snapshot</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {orders.filter((order) => order.status === 'delivered').length} orders are currently marked delivered.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
