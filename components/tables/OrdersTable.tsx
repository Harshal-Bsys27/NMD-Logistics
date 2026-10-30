'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Eye, Edit2, Trash2, Search, PackageCheck } from 'lucide-react';
import { cn } from '@/utils/helpers';
import type { Order } from '@/types';

interface OrdersTableProps {
  orders: Order[];
  title?: string;
  subtitle?: string;
  onEdit?: (order: Order) => void;
  onDelete?: (orderId: string) => void;
  onView?: (order: Order) => void;
}

type SortKey = 'order_number' | 'client_name' | 'status' | 'created_at' | 'package_value';

export default function OrdersTable({ orders, title, subtitle, onEdit, onDelete, onView }: OrdersTableProps) {
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
    draft: { bg: 'bg-muted', text: 'text-muted-foreground' },
    pending: { bg: 'bg-warning/10', text: 'text-warning-foreground' },
    confirmed: { bg: 'bg-warning/10', text: 'text-warning-foreground' },
    assigned: { bg: 'bg-primary/10', text: 'text-primary' },
    picked_up: { bg: 'bg-violet/10', text: 'text-violet-foreground' },
    in_transit: { bg: 'bg-violet/10', text: 'text-violet-foreground' },
    delivered: { bg: 'bg-success/10', text: 'text-success-foreground' },
    failed: { bg: 'bg-danger/10', text: 'text-danger-foreground' },
    cancelled: { bg: 'bg-muted', text: 'text-muted-foreground' },
  };

  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    pending: 'Pending',
    confirmed: 'Confirmed',
    assigned: 'Assigned',
    picked_up: 'Picked up',
    in_transit: 'In transit',
    delivered: 'Delivered',
    failed: 'Failed',
    cancelled: 'Cancelled',
  };

  const TableHeader = ({ label, sortable, sortKey: headerKey }: { label: string; sortable?: boolean; sortKey?: SortKey }) => (
    <button
      onClick={() => sortable && headerKey && toggleSort(headerKey)}
      className={cn(
        'flex min-h-11 items-center gap-1 text-left text-[11px] font-bold uppercase tracking-wide text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        sortable && 'cursor-pointer hover:text-foreground'
      )}
      disabled={!sortable}
    >
      {label}
      {sortable && headerKey && sortKey === headerKey && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
    </button>
  );

  return (
    <div className="surface-glass w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-border p-4 md:p-5">
      {(title || subtitle) && (
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-500"><PackageCheck className="h-5 w-5" /></span>
            <div>
              {subtitle && <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{subtitle}</p>}
              {title && <h2 className="mt-1 text-lg font-semibold text-foreground">{title}</h2>}
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search order number, client name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 w-full rounded-xl border border-input bg-background px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-11 flex items-center gap-2 rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [color-scheme:light] dark:[color-scheme:dark]"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="assigned">Assigned</option>
          <option value="picked_up">Picked up</option>
          <option value="in_transit">In transit</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="w-full min-w-0 max-w-full max-h-[min(70vh,720px)] overflow-auto overscroll-x-contain rounded-lg border border-border/80">
        <table className="w-full min-w-full table-fixed border-separate border-spacing-0 lg:min-w-[900px]">
          <thead className="sticky top-0 z-10 bg-muted/60 backdrop-blur-sm">
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left" style={{ width: '110px' }}>
                <TableHeader label="Order #" sortable sortKey="order_number" />
              </th>
              <th className="px-4 py-3 text-left">
                <TableHeader label="Client" sortable sortKey="client_name" />
              </th>
              <th className="hidden px-4 py-3 text-left sm:table-cell" style={{ width: '130px' }}>
                <TableHeader label="Status" sortable sortKey="status" />
              </th>
              <th className="hidden px-4 py-3 text-right md:table-cell" style={{ width: '110px' }}>
                <TableHeader label="Value" />
              </th>
              <th className="hidden px-4 py-3 text-left lg:table-cell">
                <TableHeader label="Pickup" />
              </th>
              <th className="hidden px-4 py-3 text-left lg:table-cell">
                <TableHeader label="Delivery" />
              </th>
              <th className="px-4 py-3 text-right" style={{ width: '80px' }}>
                <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredAndSortedOrders.length > 0 ? (
              filteredAndSortedOrders.map((order) => {
                const statusColor = statusColors[order.status] || statusColors.draft;
                return (
                  <tr key={order.id} className="transition hover:bg-muted/50">
                    <td className="px-4 py-4 align-middle">
                      <div className="truncate text-sm font-semibold text-foreground" title={order.order_number}>{order.order_number}</div>
                      <div className="truncate text-xs text-muted-foreground sm:hidden" title={order.client_name}>{order.client_name}</div>
                    </td>
                    <td className="hidden px-4 py-4 align-middle sm:table-cell">
                      <div className="truncate text-sm text-foreground" title={order.client_name}>{order.client_name}</div>
                      <div className="truncate text-xs text-muted-foreground" title={order.client_phone}>{order.client_phone}</div>
                    </td>
                    <td className="hidden px-4 py-4 align-middle sm:table-cell">
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', statusColor.bg, statusColor.text)}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {statusLabels[order.status] ?? order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="hidden px-4 py-4 text-right align-middle md:table-cell">
                      <div className="truncate text-right text-sm font-semibold tabular-nums text-foreground" title={`₹${(order.package_value ?? 0).toLocaleString('en-IN')}`}>
                        ₹{(order.package_value ?? 0).toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td className="hidden px-4 py-4 align-middle lg:table-cell">
                      <div className="truncate text-sm text-foreground" title={order.pickup_location}>{order.pickup_location}</div>
                    </td>
                    <td className="hidden px-4 py-4 align-middle lg:table-cell">
                      <div className="truncate text-sm text-foreground" title={order.delivery_location}>{order.delivery_location}</div>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center justify-center gap-2">
                        {onView && (
                          <button
                            onClick={() => onView(order)}
                            className="min-h-11 min-w-11 rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(order)}
                            className="min-h-11 min-w-11 rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(order.id)}
                            className="min-h-11 min-w-11 rounded-md p-2 text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  <p className="text-muted-foreground">No orders found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground">
        <span>Showing {filteredAndSortedOrders.length} of {orders.length} orders</span>
        {filteredAndSortedOrders.length > 0 && <span className="text-xs">Click column headers to sort</span>}
      </div>
    </div>
  );
}
