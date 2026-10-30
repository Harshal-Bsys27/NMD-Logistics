'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import type { OrderStatus } from '@/types';
import { assignmentService, orderService } from '@/services/database';
import { useOperationsData } from '@/hooks/useOperationsData';
import { cn, formatDate, toTitleCase } from '@/utils/helpers';
import { AlertCircle, ChevronRight, Package, Search, Plus, ArrowRight } from 'lucide-react';

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
    return drivers.filter((driver) => driver.current_status === 'available' && !assignedDriverIds.has(driver.id));
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

  return (
    <div className="bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-9">
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
          <div className="max-h-[min(70vh,720px)] overflow-auto rounded-md">
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
                    const nextStatus = advanceStatus(order.status);
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
                          <div className="flex flex-col items-end justify-center gap-2">
                            {canManageOrders && ['pending', 'confirmed'].includes(order.status) && (
                              <div className="flex items-center gap-2">
                                <select
                                  value={selectedDrivers[order.id] ?? availableDrivers[0]?.id ?? ''}
                                  disabled={availableDrivers.length === 0 || busyOrderId === order.id}
                                  onClick={(event) => event.stopPropagation()}
                                  onChange={(event) => {
                                    event.stopPropagation();
                                    setSelectedDrivers((current) => ({ ...current, [order.id]: event.target.value }));
                                  }}
                                  className="min-h-9 rounded-md border border-border bg-background px-2 py-1 text-[10px] text-foreground"
                                >
                                  {availableDrivers.length === 0 ? (
                                    <option value="">No drivers</option>
                                  ) : (
                                    availableDrivers.map((driver) => (
                                      <option key={driver.id} value={driver.id}>
                                        {driver.full_name || driver.employee_id} ({driver.employee_id})
                                      </option>
                                    ))
                                  )}
                                </select>
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleAssignDriver(order.id);
                                  }}
                                  disabled={availableDrivers.length === 0 || busyOrderId === order.id}
                                  className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary transition hover:bg-primary/10"
                                >
                                  {busyOrderId === order.id ? 'Saving…' : 'Assign'}
                                  <ArrowRight className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                            {canManageOrders && nextStatus && (
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void updateOrderStatus(order.id, nextStatus);
                                }}
                                disabled={busyOrderId === order.id}
                                className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary transition hover:bg-primary/10"
                              >
                                {busyOrderId === order.id ? 'Saving…' : 'Ready for dispatch'}
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              aria-label={`View ${order.order_number}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                router.push(`/orders/${order.id}`);
                              }}
                              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
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
            Showing <span className="font-semibold tabular-nums text-foreground">{visibleOrders.length}</span> of{' '}
            <span className="font-semibold tabular-nums text-foreground">{filteredOrders.length}</span> matching orders
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="min-h-11 rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              className="min-h-11 rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
