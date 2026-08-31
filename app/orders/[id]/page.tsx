'use client';

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMockOrders } from '@/services/mockData';
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

  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-cyan-300 transition hover:text-cyan-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="text-sm text-red-300">Order not found</p>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (data: CreateOrderInput) => {
    setIsLoading(true);
    try {
      console.log('Updating order:', orderId, data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push('/orders');
    } finally {
      setIsLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-600 text-slate-100',
    confirmed: 'bg-amber-600 text-amber-100',
    assigned: 'bg-blue-600 text-blue-100',
    picked_up: 'bg-violet-600 text-violet-100',
    in_transit: 'bg-cyan-600 text-cyan-100',
    delivered: 'bg-emerald-600 text-emerald-100',
    failed: 'bg-red-600 text-red-100',
    cancelled: 'bg-slate-700 text-slate-300',
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-cyan-300 transition hover:text-cyan-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Order Overview */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Order Number */}
          <div className="surface-glass rounded-2xl border border-slate-700/50 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Order Number</p>
            <p className="mt-2 text-lg font-semibold text-white">{order.order_number}</p>
          </div>

          {/* Status */}
          <div className="surface-glass rounded-2xl border border-slate-700/50 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Status</p>
            <div className="mt-2">
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusColors[order.status]}`}>
                {order.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Value */}
          <div className="surface-glass rounded-2xl border border-slate-700/50 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Package Value</p>
            <p className="mt-2 flex items-center gap-1 text-lg font-semibold text-emerald-300">
              <DollarSign className="h-4 w-4" />₹{order.package_value?.toLocaleString('en-IN')}
            </p>
          </div>

          {/* Created Date */}
          <div className="surface-glass rounded-2xl border border-slate-700/50 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Created</p>
            <p className="mt-2 flex items-center gap-1 text-sm text-slate-300">
              <Calendar className="h-4 w-4" />
              {formatDate(order.created_at, 'short')}
            </p>
          </div>
        </div>

        {/* Location Info */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="surface-glass rounded-2xl border border-slate-700/50 p-6">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-lg bg-cyan-500/20 p-2">
                <MapPin className="h-5 w-5 text-cyan-300" />
              </div>
              <h3 className="font-semibold text-white">Pickup Location</h3>
            </div>
            <p className="text-slate-300">{order.pickup_location}</p>
          </div>

          <div className="surface-glass rounded-2xl border border-slate-700/50 p-6">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-lg bg-emerald-500/20 p-2">
                <MapPin className="h-5 w-5 text-emerald-300" />
              </div>
              <h3 className="font-semibold text-white">Delivery Location</h3>
            </div>
            <p className="text-slate-300">{order.delivery_location}</p>
          </div>
        </div>

        {/* Package Details */}
        <div className="surface-glass mb-8 rounded-2xl border border-slate-700/50 p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-violet-500/20 p-2">
              <Package className="h-5 w-5 text-violet-300" />
            </div>
            <h3 className="font-semibold text-white">Package Details</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-400">Description</p>
              <p className="mt-1 text-white">{order.package_description}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Priority</p>
              <p className="mt-1 text-white">{order.priority || 'Normal'}</p>
            </div>
            {order.special_instructions && (
              <div className="sm:col-span-2">
                <p className="text-sm text-slate-400">Special Instructions</p>
                <p className="mt-1 text-white">{order.special_instructions}</p>
              </div>
            )}
          </div>
        </div>

        {/* Edit Form */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-white">Edit Order</h2>
          <div className="surface-glass rounded-2xl border border-slate-700/50 p-8">
            <OrderForm initialOrder={order} onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
