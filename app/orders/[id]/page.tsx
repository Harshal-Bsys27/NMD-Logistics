'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMockOrders } from '@/services/mockData';
import { orderService } from '@/services/database';
import { OrderForm } from '@/components/forms/OrderForm';
import { CreateOrderInput } from '@/lib/validations/schemas';
import { formatDate } from '@/utils/helpers';
import { ArrowLeft, AlertCircle, MapPin, Calendar, DollarSign, Package } from 'lucide-react';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { orders } = useMockOrders();
  const [isLoading, setIsLoading] = useState(false);
  const [dbOrder, setDbOrder] = useState(null);
  const [loadingDb, setLoadingDb] = useState(true);

  // Try to load from database first, fall back to mock data
  useEffect(() => {
    const loadOrder = async () => {
      try {
        const { data, error } = await orderService.getById(orderId);
        if (!error && data) {
          setDbOrder(data);
        }
      } catch (err) {
        console.log('Database order fetch failed, using mock data');
      } finally {
        setLoadingDb(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const order = dbOrder || useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);

  if (loadingDb) {
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
          <div className="flex items-center gap-3 rounded-lg border border-danger/30 bg-danger p-4 text-danger-foreground">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">Order not found</p>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (data: CreateOrderInput) => {
    setIsLoading(true);
    try {
      const { error } = await orderService.update(orderId, data);

      if (error) {
        throw new Error(error);
      }

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
        </div>

        {/* Edit Form */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">Edit Order</h2>
          <div className="surface-glass rounded-lg p-6 sm:p-8">
            <OrderForm initialOrder={order} onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
