'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Eye, Edit2, Trash2, Search } from 'lucide-react';
import { cn } from '@/utils/helpers';
import type { Order } from '@/types';

interface OrdersTableProps {
  orders: Order[];
  onEdit?: (order: Order) => void;
  onDelete?: (orderId: string) => void;
  onView?: (order: Order) => void;
}

type SortKey = 'order_number' | 'client_name' | 'status' | 'created_at' | 'package_value';

export default function OrdersTable({ orders, onEdit, onDelete, onView }: OrdersTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders.filter((order) => {
      const matchesSearch =
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
      return matchesSearch && matchesFilter;
    });

    return filtered.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [orders, searchTerm, filterStatus, sortKey, sortDirection]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    draft: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300' },
    confirmed: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
    assigned: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
    picked_up: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
    in_transit: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300' },
    delivered: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
    failed: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300' },
    cancelled: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' },
  };

  const TableHeader = ({ label, sortable, sortKey: headerKey }: { label: string; sortable?: boolean; sortKey?: SortKey }) => (
    <button
      onClick={() => sortable && headerKey && toggleSort(headerKey)}
      className={cn(
        'flex items-center gap-1 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300',
        sortable && 'cursor-pointer hover:text-slate-900 dark:hover:text-slate-100'
      )}
      disabled={!sortable}
    >
      {label}
      {sortable && headerKey && sortKey === headerKey && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
    </button>
  );

  return (
    <div className="surface-glass rounded-2xl p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search order number, client name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-10 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white transition focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
          <option value="assigned">Assigned</option>
          <option value="picked_up">Picked up</option>
          <option value="in_transit">In transit</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="px-4 py-3 text-left">
                <TableHeader label="Order #" sortable sortKey="order_number" />
              </th>
              <th className="px-4 py-3 text-left">
                <TableHeader label="Client" sortable sortKey="client_name" />
              </th>
              <th className="hidden px-4 py-3 text-left sm:table-cell">
                <TableHeader label="Status" sortable sortKey="status" />
              </th>
              <th className="hidden px-4 py-3 text-right md:table-cell">
                <TableHeader label="Value" />
              </th>
              <th className="hidden px-4 py-3 text-left lg:table-cell">
                <TableHeader label="Pickup" />
              </th>
              <th className="hidden px-4 py-3 text-left lg:table-cell">
                <TableHeader label="Delivery" />
              </th>
              <th className="px-4 py-3 text-center">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {filteredAndSortedOrders.length > 0 ? (
              filteredAndSortedOrders.map((order) => {
                const statusColor = statusColors[order.status] || statusColors.draft;
                return (
                  <tr key={order.id} className="transition hover:bg-slate-800/50">
                    <td className="px-4 py-4">
                      <div className="text-sm font-semibold text-white">{order.order_number}</div>
                      <div className="text-xs text-slate-400 sm:hidden">{order.client_name}</div>
                    </td>
                    <td className="hidden px-4 py-4 sm:table-cell">
                      <div className="text-sm text-white">{order.client_name}</div>
                      <div className="text-xs text-slate-400">{order.client_phone}</div>
                    </td>
                    <td className="hidden px-4 py-4 sm:table-cell">
                      <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold', statusColor.bg, statusColor.text)}>
                        {order.status}
                      </span>
                    </td>
                    <td className="hidden px-4 py-4 text-right md:table-cell">
                      <div className="text-sm font-semibold text-cyan-300">₹{(order.package_value ?? 0).toLocaleString('en-IN')}</div>
                    </td>
                    <td className="hidden px-4 py-4 lg:table-cell">
                      <div className="text-sm text-slate-300">{order.pickup_location}</div>
                    </td>
                    <td className="hidden px-4 py-4 lg:table-cell">
                      <div className="text-sm text-slate-300">{order.delivery_location}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {onView && (
                          <button
                            onClick={() => onView(order)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-700 hover:text-cyan-300"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(order)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-700 hover:text-blue-300"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(order.id)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-700 hover:text-rose-300"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center">
                  <p className="text-slate-400">No orders found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-700/50 pt-4 text-sm text-slate-400">
        <span>Showing {filteredAndSortedOrders.length} of {orders.length} orders</span>
        {filteredAndSortedOrders.length > 0 && <span className="text-xs">Click column headers to sort</span>}
      </div>
    </div>
  );
}
