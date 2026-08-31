'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OrderForm } from '@/components/forms/OrderForm';
import { CreateOrderInput } from '@/lib/validations/schemas';
import { ArrowLeft } from 'lucide-react';

export default function CreateOrderPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateOrderInput) => {
    setIsLoading(true);
    try {
      // Simulate API call - in production, call your backend
      console.log('Creating order:', data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push('/orders');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-cyan-300 transition hover:text-cyan-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <h1 className="text-4xl font-bold text-white">Create New Order</h1>
          <p className="mt-3 text-slate-400">Add a new delivery order to the system</p>
        </div>

        {/* Form Container */}
        <div className="surface-glass rounded-2xl border border-slate-700/50 p-8">
          <OrderForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
