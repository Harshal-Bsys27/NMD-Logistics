'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks';
import { orderService } from '@/services/database';
import { useOperationsData } from '@/hooks/useOperationsData';
import { OrderForm } from '@/components/forms/OrderForm';
import { CreateOrderInput } from '@/lib/validations/schemas';
import { formatDate } from '@/utils/helpers';
import { ArrowLeft, AlertCircle, MapPin, Calendar, DollarSign, Package, ArrowRight, Send } from 'lucide-react';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { user } = useAuth();
  const canManageOrders = user?.role === 'admin' || user?.role === 'supervisor';
  const { orders, isLoading: loadingOrder, error: loadError, refresh } = useOperationsData();
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSendingTrackingEmail, setIsSendingTrackingEmail] = useState(false);
  const [actionError, setActionError] = useState('');
  const [trackingMessage, setTrackingMessage] = useState('');
  const [trackingError, setTrackingError] = useState('');
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

  const sendTrackingEmail = async () => {
    if (!order) return;
    setIsSendingTrackingEmail(true);
    setTrackingError('');
    setTrackingMessage('');
    try {
      const response = await fetch('/api/customer-tracking/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id }),
      });
      const result = await response.json() as { status?: string; error?: string };
      if (!response.ok || result.status !== 'accepted') {
        throw new Error(result.error || 'Unable to send the tracking email.');
      }
      setTrackingMessage('Gmail accepted the tracking email. Inbox delivery is not confirmed.');
    } catch (error) {
      setTrackingError(error instanceof Error ? error.message : 'Unable to send the tracking email.');
    } finally {
      setIsSendingTrackingEmail(false);
    }
  };

  if (loadingOrder) {
    return (
      <div className="bg-background px-3 py-5 text-foreground sm:px-6 sm:py-6 lg:px-8 lg:py-8">
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
      <div className="bg-background px-3 py-5 text-foreground sm:px-6 sm:py-6 lg:px-8 lg:py-8">
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
    <div className="bg-background px-3 py-5 text-foreground sm:px-6 sm:py-6 lg:px-8 lg:py-8">
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
              <p className="mt-1 text-foreground">{order.package_description || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Package Weight</p>
              <p className="mt-1 font-medium tabular-nums text-foreground">
                {order.package_weight != null
                  ? `${order.package_weight.toLocaleString('en-IN', { maximumFractionDigits: 2 })} kg`
                  : 'Not provided'}
              </p>
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

        {canManageOrders && (
          <section className="surface-glass mb-8 rounded-lg border border-border p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Customer tracking</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Email a private 30-day link showing delivery milestones only.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void sendTrackingEmail()}
                disabled={isSendingTrackingEmail || !order.client_email || order.status === 'draft'}
                title={!order.client_email
                  ? 'Add a customer email address first.'
                  : order.status === 'draft'
                    ? 'Release the order for dispatch before sending a tracking link.'
                    : undefined}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {isSendingTrackingEmail ? 'Sending…' : 'Email tracking link'}
              </button>
            </div>
            {!order.client_email && (
              <p className="mt-3 text-xs text-muted-foreground">Add the customer email address to enable tracking emails.</p>
            )}
            {order.status === 'draft' && order.client_email && (
              <p className="mt-3 text-xs text-muted-foreground">Release this order for dispatch before sending its tracking link.</p>
            )}
            {trackingMessage && <p role="status" className="mt-3 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success-foreground">{trackingMessage}</p>}
            {trackingError && <p role="alert" className="mt-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger-foreground">{trackingError}</p>}
          </section>
        )}

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
