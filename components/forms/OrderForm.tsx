'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateOrderInput, createOrderSchema } from '@/lib/validations/schemas';
import { Order } from '@/types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface OrderFormProps {
  initialOrder?: Order;
  onSubmit: (data: CreateOrderInput) => Promise<void>;
  isLoading?: boolean;
}

export function OrderForm({ initialOrder, onSubmit, isLoading }: OrderFormProps) {
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateOrderInput>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: initialOrder
      ? {
          client_name: initialOrder.client_name,
          client_phone: initialOrder.client_phone,
          client_email: initialOrder.client_email,
          pickup_location: initialOrder.pickup_location,
          delivery_location: initialOrder.delivery_location,
          package_description: initialOrder.package_description,
          package_value: initialOrder.package_value,
          priority: (initialOrder.priority || 'normal') as 'low' | 'normal' | 'high' | 'urgent',
          special_instructions: initialOrder.special_instructions,
        }
      : undefined,
  });

  const onFormSubmit = async (data: CreateOrderInput) => {
    try {
      setErrorMessage('');
      setSuccessMessage('');
      await onSubmit(data);
      setSuccessMessage('Order saved successfully!');
      if (!initialOrder) {
        reset();
      }
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage((error as any)?.message || 'Failed to save order');
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <p className="text-sm text-emerald-300">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <p className="text-sm text-red-300">{errorMessage}</p>
        </div>
      )}

      {/* Order Number & Status */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-white">Client Name</label>
          <input
            {...register('client_name')}
            type="text"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500"
            placeholder="John Doe"
          />
          {errors.client_name && (
            <p className="mt-1 text-xs text-red-400">{errors.client_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-white">Phone</label>
          <input
            {...register('client_phone')}
            type="tel"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500"
            placeholder="9876543210"
          />
          {errors.client_phone && (
            <p className="mt-1 text-xs text-red-400">{errors.client_phone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-white">Email (Optional)</label>
          <input
            {...register('client_email')}
            type="email"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500"
            placeholder="john@example.com"
          />
          {errors.client_email && (
            <p className="mt-1 text-xs text-red-400">{errors.client_email.message}</p>
          )}
        </div>
      </div>

      {/* Locations */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-white">Pickup Location</label>
          <input
            {...register('pickup_location')}
            type="text"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500"
            placeholder="123 Main St, Mumbai"
          />
          {errors.pickup_location && (
            <p className="mt-1 text-xs text-red-400">{errors.pickup_location.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-white">Delivery Location</label>
          <input
            {...register('delivery_location')}
            type="text"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500"
            placeholder="456 Oak Ave, Mumbai"
          />
          {errors.delivery_location && (
            <p className="mt-1 text-xs text-red-400">{errors.delivery_location.message}</p>
          )}
        </div>
      </div>

      {/* Package Details */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-white">Description</label>
          <input
            {...register('package_description')}
            type="text"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500"
            placeholder="Electronics - Laptop"
          />
          {errors.package_description && (
            <p className="mt-1 text-xs text-red-400">{errors.package_description.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-white">Package Value (₹)</label>
          <input
            {...register('package_value', { valueAsNumber: true })}
            type="number"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500"
            placeholder="50000"
          />
          {errors.package_value && (
            <p className="mt-1 text-xs text-red-400">{errors.package_value.message}</p>
          )}
        </div>
      </div>

      {/* Priority & Instructions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-white">Priority</label>
          <select
            {...register('priority')}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white"
          >
            <option value="Normal">Normal</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
          {errors.priority && (
            <p className="mt-1 text-xs text-red-400">{errors.priority.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-white">Special Instructions</label>
          <input
            {...register('special_instructions')}
            type="text"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500"
            placeholder="Leave at door if not home"
          />
          {errors.special_instructions && (
            <p className="mt-1 text-xs text-red-400">{errors.special_instructions.message}</p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-3 font-semibold text-white transition hover:from-cyan-600 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Saving...' : initialOrder ? 'Update Order' : 'Create Order'}
        </button>
      </div>
    </form>
  );
}
