'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { OrderForm } from '@/components/forms/OrderForm';
import { CreateOrderInput } from '@/lib/validations/schemas';
import { orderService } from '@/services/database';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function CreateOrderPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const canManageOrders = user?.role === 'admin' || user?.role === 'supervisor';
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateOrderInput) => {
    setIsLoading(true);
    try {
      const { error } = await orderService.create(data);
      if (error) throw new Error(error);

      router.push('/orders');
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return <div className="px-4 py-12 text-center text-muted-foreground" role="status">Checking access…</div>;
  }

  if (!canManageOrders) {
    return (
      <div className="bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div role="alert" className="flex items-center gap-3 rounded-lg border border-danger/30 bg-danger/10 p-4 text-danger-foreground">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">You do not have permission to create orders.</p>
          </div>
          <button type="button" onClick={() => router.push('/orders')} className="mt-4 min-h-11 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <h1 className="text-3xl font-semibold text-foreground">Create New Order</h1>
          <p className="mt-2 text-muted-foreground">Add a new delivery order to the system</p>
        </div>

        {/* Form Container */}
        <div className="surface-glass rounded-lg p-6 sm:p-8">
          <OrderForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
