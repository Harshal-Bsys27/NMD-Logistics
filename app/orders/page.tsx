'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import type { OrderStatus } from '@/types';
import { assignmentService, orderService } from '@/services/database';
import { useOperationsData } from '@/hooks/useOperationsData';
import { cn, formatDate, toTitleCase } from '@/utils/helpers';
import { AlertCircle, ChevronRight, Download, Package, Search, Plus, ArrowRight } from 'lucide-react';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending: 'bg-warning text-warning-foreground',
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
  const { user } = useAuth();
  const canManageOrders = user?.role === 'admin' || user?.role === 'supervisor';
  const { orders, drivers, assignments, isLoading, error: loadError, refresh } = useOperationsData();
  const [actionError, setActionError] = useState('');
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedDrivers, setSelectedDrivers] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterStatus]);

  const filteredOrders = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch =
        !search ||
        order.order_number.toLowerCase().includes(search) ||
        order.client_name.toLowerCase().includes(search) ||
        order.client_phone.toLowerCase().includes(search);
      const matchesStatus = !filterStatus || order.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, filterStatus]);
  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const visibleOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  const advanceStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    return currentStatus === 'draft' ? 'pending' : null;
  };

  const exportOrders = () => {
    const escapeCell = (value: string | number | undefined) => {
      const text = String(value ?? '');
      const safeText = /^[\t\r ]*[=+\-@]/.test(text) ? `'${text}` : text;
      return `"${safeText.replace(/"/g, '""')}"`;
    };
    const headers = [
      'Order number',
      'Customer',
      'Phone',
      'Email',
      'Status',
      'Priority',
      'Pickup location',
      'Delivery location',
      'Package description',
      'Package weight',
      'Package dimensions',
      'Package value',
      'Expected delivery',
      'Delivered at',
      'Special instructions',
      'Created at',
    ];
    const rows = filteredOrders.map((order) => [
      order.order_number,
      order.client_name,
      order.client_phone,
      order.client_email,
      order.status.replace(/_/g, ' '),
      order.priority || 'normal',
      order.pickup_location,
      order.delivery_location,
      order.package_description,
      order.package_weight,
      order.package_dimensions,
      order.package_value,
      order.expected_delivery_time ? formatDate(order.expected_delivery_time, 'short') : '',
      order.actual_delivery_time ? formatDate(order.actual_delivery_time, 'short') : '',
      order.special_instructions,
      formatDate(order.created_at, 'short'),
    ].map(escapeCell));
    const csv = `\uFEFF${[headers.map(escapeCell).join(','), ...rows.map((row) => row.join(','))].join('\r\n')}`;
    const downloadUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `nmd-orders-${filterStatus || 'all'}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  };

  const statusStats = {
    draft: orders.filter((o) => o.status === 'draft').length,
    pending: orders.filter((o) => o.status === 'pending').length,
    confirmed: orders.filter((o) => o.status === 'confirmed').length,
    assigned: orders.filter((o) => o.status === 'assigned').length,
    picked_up: orders.filter((o) => o.status === 'picked_up').length,
    in_transit: orders.filter((o) => o.status === 'in_transit').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    failed: orders.filter((o) => o.status === 'failed').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  const availableDrivers = useMemo(() => {
    const assignedDriverIds = new Set(
      assignments
        .filter((assignment) => ['pending', 'accepted', 'in_progress'].includes(assignment.status))
        .map((assignment) => assignment.personnel_id)
    );
    return drivers.filter(
      (driver) =>
        driver.user_status !== 'suspended' &&
        driver.current_status === 'available' &&
        !assignedDriverIds.has(driver.id)
    );
  }, [assignments, drivers]);

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setBusyOrderId(orderId);
    setActionError('');
    try {
      const { error } = await orderService.updateStatus(orderId, status);
      if (error) throw new Error(error);
      await refresh(true);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to update order status');
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleAssignDriver = async (orderId: string) => {
    const order = orders.find((item) => item.id === orderId);
    if (!order) return;

    const driverId = selectedDrivers[orderId] || availableDrivers[0]?.id;
    if (!driverId) return;

    setBusyOrderId(orderId);
    setActionError('');
    try {
      const assignment = await assignmentService.create({
        order_id: orderId,
        personnel_id: driverId,
        estimated_duration_minutes: 45,
        notes: `Assigned for ${order.order_number}`,
      });
      if (assignment.error || !assignment.data) throw new Error(assignment.error || 'Unable to create assignment');

      await refresh(true);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to assign this order');
    } finally {
      setBusyOrderId(null);
    }
  };

  const renderOrderActions = (order: (typeof orders)[number]) => {
    const nextStatus = advanceStatus(order.status);

    return (
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center xl:flex-col xl:items-stretch">
        {canManageOrders && ['pending', 'confirmed'].includes(order.status) && (
          <div className="flex min-w-0 flex-1 gap-2">
            <select
              aria-label={`Select driver for ${order.order_number}`}
              value={selectedDrivers[order.id] ?? availableDrivers[0]?.id ?? ''}
              disabled={availableDrivers.length === 0 || busyOrderId === order.id}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => {
                event.stopPropagation();
                setSelectedDrivers((current) => ({ ...current, [order.id]: event.target.value }));
              }}
              className="min-h-11 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-xs text-foreground"
            >
              {availableDrivers.length === 0 ? (
                <option value="">No drivers available</option>
              ) : (
                availableDrivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.full_name || driver.employee_id} ({driver.employee_id})
                  </option>
                ))
              )}
            </select>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void handleAssignDriver(order.id);
              }}
              disabled={availableDrivers.length === 0 || busyOrderId === order.id}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-3 text-xs font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busyOrderId === order.id ? 'Saving…' : 'Assign'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
        {canManageOrders && nextStatus && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void updateOrderStatus(order.id, nextStatus);
            }}
            disabled={busyOrderId === order.id}
            className="inline-flex min-h-11 items-center justify-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-3 text-xs font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busyOrderId === order.id ? 'Saving…' : 'Ready for dispatch'}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          aria-label={`View ${order.order_number}`}
          onClick={(event) => {
            event.stopPropagation();
            router.push(`/orders/${order.id}`);
          }}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:shrink-0"
        >
          View order
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="bg-background px-3 py-5 text-foreground sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Orders</h1>
            <p className="mt-2 text-muted-foreground">Manage all delivery orders and track their status</p>
          </div>
          {canManageOrders && (
            <button
              onClick={() => router.push('/orders/create')}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="h-5 w-5" />
              New Order
            </button>
          )}
        </div>


        {/* Stats Row */}
        <div
          role="region"
          aria-label="Order status summary"
          tabIndex={0}
          className="flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible lg:grid-cols-4 2xl:grid-cols-9"
        >
          {Object.entries(statusStats).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setFilterStatus(filterStatus === status ? null : status)}
              aria-pressed={filterStatus === status}
              className={cn(
                'surface-glass min-h-20 w-32 shrink-0 snap-start rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-24 sm:w-auto sm:p-4',
                filterStatus === status
                  ? 'border-primary/50 bg-primary/10'
                  : 'border-border hover:border-ring/50'
              )}
            >
              <p className="truncate text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:text-xs sm:tracking-[0.16em]">
                {status.replace(/_/g, ' ')}
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-foreground sm:mt-2 sm:text-2xl">{count}</p>
            </button>
          ))}
        </div>
        <p className="-mt-4 text-[11px] text-muted-foreground sm:hidden">Swipe sideways to browse order statuses.</p>

        {/* Search & Filter */}
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by order #, client name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search orders by order number or customer"
              className="min-h-11 w-full rounded-lg border border-input bg-background px-12 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <button
            type="button"
            onClick={exportOrders}
            disabled={isLoading || filteredOrders.length === 0}
            aria-label={`Export ${filteredOrders.length} filtered orders as CSV`}
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        {(loadError || actionError) && (
          <div role="alert" className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/10 p-4 text-danger-foreground">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm">{loadError || actionError}</p>
              {loadError && (
                <button type="button" onClick={() => void refresh()} className="mt-2 text-sm font-semibold underline">
                  Try again
                </button>
              )}
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="surface-glass overflow-hidden rounded-lg border border-border">
          <div className="space-y-3 p-3 xl:hidden">
            {isLoading ? (
              <p role="status" className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                Loading orders…
              </p>
            ) : visibleOrders.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                {orders.length === 0 ? 'No orders yet. Create an order to get started.' : 'No orders found matching your filters.'}
              </p>
            ) : visibleOrders.map((order) => {
              const colors = statusColors[order.status] ?? statusColors.draft;
              return (
                <article key={order.id} className="min-w-0 rounded-lg border border-border bg-background p-3">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{order.order_number}</p>
                      <p className="mt-1 truncate text-sm font-medium text-foreground">{order.client_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{order.client_phone}</p>
                    </div>
                    <span className={cn('inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold', colors)}>
                      {toTitleCase(order.status)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                    <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', priorityColors[order.priority || 'normal'])}>
                      {toTitleCase(order.priority || 'normal')} priority
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      ₹{(order.package_value ?? 0).toLocaleString('en-IN')}
                    </span>
                    <span className="w-full text-xs text-muted-foreground">
                      Created {formatDate(order.created_at, 'short')}
                    </span>
                  </div>
                  <div className="mt-3">
                    {renderOrderActions(order)}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hidden max-h-[min(70vh,720px)] overflow-auto rounded-md xl:block">
            <table className="w-full min-w-[900px]">
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
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground" aria-live="polite">
                      Loading orders…
                    </td>
                  </tr>
                ) : visibleOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <p className="text-muted-foreground">
                        {orders.length === 0 ? 'No orders yet. Create an order to get started.' : 'No orders found matching your filters.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  visibleOrders.map((order) => {
                    const colors = statusColors[order.status] ?? statusColors.draft;
                    return (
                      <tr
                        key={order.id}
                        onClick={() => router.push(`/orders/${order.id}`)}
                        onKeyDown={(event) => {
                          if (event.target !== event.currentTarget) return;
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            router.push(`/orders/${order.id}`);
                          }
                        }}
                        tabIndex={0}
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
                          <div className="flex items-center gap-2">
                            <span className={cn('inline-flex min-h-6 items-center rounded-full px-3 py-1 text-xs font-semibold', colors)}>
                              {toTitleCase(order.status)}
                            </span>
                          </div>
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
                          {renderOrderActions(order)}
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
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold tabular-nums text-foreground">{visibleOrders.length}</span> of{' '}
            <span className="font-semibold tabular-nums text-foreground">{filteredOrders.length}</span> matching orders
          </p>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="min-h-11 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none sm:px-4"
            >
              Previous
            </button>
            <span className="flex min-h-11 items-center px-2 text-sm tabular-nums text-muted-foreground" aria-live="polite">
              {page} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              disabled={page >= pageCount}
              className="min-h-11 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none sm:px-4"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
