'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks';
import { orderService } from '@/services/database';
import { useOperationsData } from '@/hooks/useOperationsData';
import { OrderForm } from '@/components/forms/OrderForm';
import { CreateOrderInput } from '@/lib/validations/schemas';
import { formatDate } from '@/utils/helpers';
import { ArrowLeft, AlertCircle, MapPin, Calendar, DollarSign, Package, ArrowRight } from 'lucide-react';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { user } = useAuth();
  const canManageOrders = user?.role === 'admin' || user?.role === 'supervisor';
  const { orders, isLoading: loadingOrder, error: loadError, refresh } = useOperationsData();
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionError, setActionError] = useState('');
  const order = orders.find((item) => item.id === orderId) ?? null;
  const nextStatus = order?.status === 'draft' ? 'pending' : null;

  const updateStatus = async () => {
    if (!order || !nextStatus) return;
    setIsUpdatingStatus(true);
    setActionError('');
    try {
      const { data, error } = await orderService.updateStatus(order.id, nextStatus);
      if (error) throw new Error(error);
      if (!data) throw new Error('The order status update returned no order');
      await refresh(true);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to update order status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (loadingOrder) {
    return (
      <div className="bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="animate-pulse space-y-4">
            <div className="h-12 w-1/3 rounded-md bg-muted" />
            <div className="space-y-3">
              <div className="h-6 w-full rounded-md bg-muted" />
              <div className="h-6 w-5/6 rounded-md bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <button
            onClick={() => router.back()}
            className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div role="alert" className="flex items-center gap-3 rounded-lg border border-danger/30 bg-danger p-4 text-danger-foreground">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{loadError || 'Order not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (data: CreateOrderInput) => {
    setIsLoading(true);
    try {
      const { data: updatedOrder, error } = await orderService.update(orderId, data);
      if (error) throw new Error(error);
      if (!updatedOrder) throw new Error('The order update returned no order');
      router.push('/orders');
    } catch (error) {
      console.error('Failed to update order:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    pending: 'bg-warning text-warning-foreground',
    confirmed: 'bg-warning text-warning-foreground',
    assigned: 'bg-info text-info-foreground',
    picked_up: 'bg-warning text-warning-foreground',
    in_transit: 'bg-info text-info-foreground',
    delivered: 'bg-success text-success-foreground',
    failed: 'bg-danger text-danger-foreground',
    cancelled: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {actionError && (
          <div role="alert" className="mb-6 flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/10 p-4 text-danger-foreground">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm">{actionError}</p>
          </div>
        )}

        {/* Order Overview */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Order Number */}
          <div className="surface-glass h-full rounded-lg p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Order Number</p>
            <p className="mt-2 text-lg font-semibold text-foreground">{order.order_number}</p>
          </div>

          {/* Status */}
          <div className="surface-glass h-full rounded-lg p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Status</p>
            <div className="mt-2">
              <span className={`inline-flex min-h-6 items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColors[order.status] ?? statusColors.draft}`}>
                {order.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Value */}
          <div className="surface-glass h-full rounded-lg p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Package Value</p>
            <p className="mt-2 flex items-center gap-1 text-lg font-semibold tabular-nums text-foreground">
              <DollarSign className="h-4 w-4" />₹{order.package_value?.toLocaleString('en-IN')}
            </p>
          </div>

          {/* Created Date */}
          <div className="surface-glass h-full rounded-lg p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Created</p>
            <p className="mt-2 flex items-center gap-1 text-sm text-foreground">
              <Calendar className="h-4 w-4" />
              {formatDate(order.created_at, 'short')}
            </p>
          </div>
        </div>

        {/* Location Info */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="surface-glass rounded-lg p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">Pickup Location</h3>
            </div>
            <p className="text-foreground">{order.pickup_location}</p>
          </div>

          <div className="surface-glass rounded-lg p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-md bg-success p-2 text-success-foreground">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">Delivery Location</h3>
            </div>
            <p className="text-foreground">{order.delivery_location}</p>
          </div>
        </div>

        {/* Package Details */}
        <div className="surface-glass mb-8 rounded-lg p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-md bg-info p-2 text-info-foreground">
              <Package className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground">Package Details</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="mt-1 text-foreground">{order.package_description}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Priority</p>
              <p className="mt-1 text-foreground">{order.priority || 'Normal'}</p>
            </div>
            {order.special_instructions && (
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">Special Instructions</p>
                <p className="mt-1 text-foreground">{order.special_instructions}</p>
              </div>
            )}
          </div>

          {canManageOrders && nextStatus && (
            <div className="mt-6 flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Lifecycle</p>
                <p className="mt-1 text-sm text-foreground">Current status: <span className="font-medium">{order.status}</span></p>
              </div>
              <button
                onClick={() => void updateStatus()}
                disabled={isUpdatingStatus}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdatingStatus ? 'Updating…' : 'Mark ready for dispatch'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Edit Form */}
        {canManageOrders && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-foreground">Edit Order</h2>
            <div className="surface-glass rounded-lg p-6 sm:p-8">
              <OrderForm initialOrder={order} onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
