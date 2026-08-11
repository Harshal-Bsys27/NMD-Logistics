'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMockOrders } from '@/services/mockData';
import { cn, formatDate, toTitleCase } from '@/utils/helpers';
import { ChevronRight, Package, Search, Filter, Plus } from 'lucide-react';

const statusColors: Record<string, { bg: string; text: string; badge: string }> = {
  draft: { bg: 'bg-slate-500/10', text: 'text-slate-300', badge: 'bg-slate-700' },
  confirmed: { bg: 'bg-blue-500/10', text: 'text-blue-300', badge: 'bg-blue-700' },
  assigned: { bg: 'bg-cyan-500/10', text: 'text-cyan-300', badge: 'bg-cyan-700' },
  picked_up: { bg: 'bg-amber-500/10', text: 'text-amber-300', badge: 'bg-amber-700' },
  in_transit: { bg: 'bg-violet-500/10', text: 'text-violet-300', badge: 'bg-violet-700' },
  delivered: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', badge: 'bg-emerald-700' },
  failed: { bg: 'bg-rose-500/10', text: 'text-rose-300', badge: 'bg-rose-700' },
  cancelled: { bg: 'bg-slate-500/10', text: 'text-slate-400', badge: 'bg-slate-700' },
};

const priorityColors: Record<string, string> = {
  low: 'bg-slate-700 text-slate-200',
  normal: 'bg-blue-700 text-blue-200',
  high: 'bg-orange-700 text-orange-200',
  urgent: 'bg-rose-700 text-rose-200',
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
    <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-4xl font-bold text-white">Orders</h1>
            <p className="mt-2 text-slate-400">Manage all delivery orders and track their status</p>
          </div>
          <button
            onClick={() => router.push('/orders/create')}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-3 font-semibold text-white transition hover:from-cyan-600 hover:to-blue-600"
          >
            <Plus className="h-5 w-5" />
            New Order
          </button>
        </div>

        {/* Stats Row */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {Object.entries(statusStats).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setFilterStatus(filterStatus === status ? null : status)}
              className={cn(
                'rounded-[1.5rem] border p-4 transition',
                filterStatus === status
                  ? 'border-cyan-400 bg-cyan-500/10'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
              )}
            >
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                {status.replace('_', ' ')}
              </p>
              <p className="mt-2 text-2xl font-bold text-white">{count}</p>
            </button>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by order #, client name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-[1.5rem] border border-slate-800 bg-slate-950/70 py-3 pl-12 pr-4 text-sm text-white placeholder-slate-500 outline-none transition hover:border-slate-700 focus:border-cyan-400"
            />
          </div>
          <button className="inline-flex items-center gap-2 rounded-[1.5rem] border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300 transition hover:border-slate-700">
            <Filter className="h-4 w-4" />
            More Filters
          </button>
        </div>

        {/* Orders Table */}
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Order
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Priority
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Value
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Created
                  </th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <p className="text-slate-400">No orders found matching your filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const colors = statusColors[order.status];
                    return (
                      <tr
                        key={order.id}
                        onClick={() => router.push(`/orders/${order.id}`)}
                        className="border-b border-slate-800 cursor-pointer transition hover:bg-slate-800/30"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                              <Package className="h-5 w-5 text-cyan-300" />
                            </div>
                            <div>
                              <p className="font-semibold text-white">{order.order_number}</p>
                              <p className="text-xs text-slate-400">{order.package_description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-white">{order.client_name}</p>
                            <p className="text-xs text-slate-400">{order.client_phone}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', colors.badge)}>
                            {toTitleCase(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', priorityColors[order.priority || 'normal'])}>
                            {toTitleCase(order.priority || 'normal')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-white">₹{order.package_value?.toLocaleString('en-IN')}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {formatDate(order.created_at, 'short')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="inline-flex items-center justify-center rounded-lg bg-slate-800 p-2 transition hover:bg-slate-700">
                            <ChevronRight className="h-4 w-4 text-slate-400" />
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
          <p className="text-sm text-slate-400">
            Showing <span className="font-semibold text-white">{filteredOrders.length}</span> of{' '}
            <span className="font-semibold text-white">{orders.length}</span> orders
          </p>
          <div className="flex gap-2">
            <button className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-700 disabled:opacity-50">
              Previous
            </button>
            <button className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-700">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
