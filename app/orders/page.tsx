'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMockOrders } from '@/services/mockData';
import { cn, formatDate, toTitleCase } from '@/utils/helpers';
import { ChevronRight, Package, Search, Filter, Plus } from 'lucide-react';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  confirmed: 'bg-info text-info-foreground',
  assigned: 'bg-primary/10 text-primary',
  picked_up: 'bg-warning text-warning-foreground',
  in_transit: 'bg-info text-info-foreground',
  delivered: 'bg-success text-success-foreground',
  failed: 'bg-danger text-danger-foreground',
  cancelled: 'bg-muted text-muted-foreground',
};

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  normal: 'bg-info text-info-foreground',
  high: 'bg-warning text-warning-foreground',
  urgent: 'bg-danger text-danger-foreground',
};

export default function OrdersPage() {
  const router = useRouter();
  const { orders } = useMockOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusStats = {
    draft: orders.filter((o) => o.status === 'draft').length,
    confirmed: orders.filter((o) => o.status === 'confirmed').length,
    assigned: orders.filter((o) => o.status === 'assigned').length,
    picked_up: orders.filter((o) => o.status === 'picked_up').length,
    in_transit: orders.filter((o) => o.status === 'in_transit').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
  };

  return (
    <div className="bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Orders</h1>
            <p className="mt-2 text-muted-foreground">Manage all delivery orders and track their status</p>
          </div>
          <button
            onClick={() => router.push('/orders/create')}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="h-5 w-5" />
            New Order
          </button>
        </div>


        {/* Stats Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {Object.entries(statusStats).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setFilterStatus(filterStatus === status ? null : status)}
              className={cn(
                'surface-glass min-h-24 rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                filterStatus === status
                  ? 'border-primary/50 bg-primary/10'
                  : 'border-border hover:border-ring/50'
              )}
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {status.replace('_', ' ')}
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{count}</p>
            </button>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by order #, client name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-input bg-background px-12 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <button className="surface-glass flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-foreground transition hover:border-ring/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Filter className="h-4 w-4" />
            More Filters
          </button>
        </div>

        {/* Orders Table */}
        <div className="surface-glass overflow-hidden rounded-lg border border-border">
          <div className="max-h-[min(70vh,720px)] overflow-auto rounded-md">
            <table className="w-full">
              <thead>
                <tr className="sticky top-0 z-10 border-b border-border bg-muted">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Order
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Priority
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Value
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Created
                  </th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <p className="text-muted-foreground">No orders found matching your filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const colors = statusColors[order.status] ?? statusColors.draft;
                    return (
                      <tr
                        key={order.id}
                        onClick={() => router.push(`/orders/${order.id}`)}
                        className="cursor-pointer border-b border-border transition hover:bg-muted/50 focus-within:bg-muted/50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{order.order_number}</p>
                              <p className="text-xs text-muted-foreground">{order.package_description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-foreground">{order.client_name}</p>
                            <p className="text-xs text-muted-foreground">{order.client_phone}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn('inline-flex min-h-6 items-center rounded-full px-3 py-1 text-xs font-semibold', colors)}>
                            {toTitleCase(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', priorityColors[order.priority || 'normal'])}>
                            {toTitleCase(order.priority || 'normal')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-right font-semibold tabular-nums text-foreground">₹{order.package_value?.toLocaleString('en-IN')}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {formatDate(order.created_at, 'short')}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <button aria-label={`View ${order.order_number}`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                              <ChevronRight className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold tabular-nums text-foreground">{filteredOrders.length}</span> of{' '}
            <span className="font-semibold tabular-nums text-foreground">{orders.length}</span> orders
          </p>
          <div className="flex gap-2">
            <button className="min-h-11 rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground transition hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Previous
            </button>
            <button className="min-h-11 rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
