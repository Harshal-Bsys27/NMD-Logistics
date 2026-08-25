'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateOrderInput, createOrderSchema } from '@/lib/validations/schemas';
import { Order } from '@/types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';

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
    <Card className="border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/20">
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

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-200">Client Name</label>
            <Input
              {...register('client_name')}
              aria-invalid={!!errors.client_name}
              type="text"
              placeholder="John Doe"
            />
            {errors.client_name && (
              <p className="mt-1 text-xs text-red-400">{errors.client_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200">Phone</label>
            <Input
              {...register('client_phone')}
              aria-invalid={!!errors.client_phone}
              type="tel"
              placeholder="9876543210"
            />
            {errors.client_phone && (
              <p className="mt-1 text-xs text-red-400">{errors.client_phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200">Email (Optional)</label>
            <Input
              {...register('client_email')}
              aria-invalid={!!errors.client_email}
              type="email"
              placeholder="john@example.com"
            />
            {errors.client_email && (
              <p className="mt-1 text-xs text-red-400">{errors.client_email.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-200">Pickup Location</label>
            <Input
              {...register('pickup_location')}
              aria-invalid={!!errors.pickup_location}
              type="text"
              placeholder="123 Main St, Mumbai"
            />
            {errors.pickup_location && (
              <p className="mt-1 text-xs text-red-400">{errors.pickup_location.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200">Delivery Location</label>
            <Input
              {...register('delivery_location')}
              aria-invalid={!!errors.delivery_location}
              type="text"
              placeholder="456 Oak Ave, Mumbai"
            />
            {errors.delivery_location && (
              <p className="mt-1 text-xs text-red-400">{errors.delivery_location.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-200">Description</label>
            <Input
              {...register('package_description')}
              aria-invalid={!!errors.package_description}
              type="text"
              placeholder="Electronics - Laptop"
            />
            {errors.package_description && (
              <p className="mt-1 text-xs text-red-400">{errors.package_description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200">Package Value (₹)</label>
            <Input
              {...register('package_value', { valueAsNumber: true })}
              aria-invalid={!!errors.package_value}
              type="number"
              placeholder="50000"
            />
            {errors.package_value && (
              <p className="mt-1 text-xs text-red-400">{errors.package_value.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-200">Priority</label>
            <Select {...register('priority')} aria-invalid={!!errors.priority}>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
            {errors.priority && (
              <p className="mt-1 text-xs text-red-400">{errors.priority.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200">Special Instructions</label>
            <Input
              {...register('special_instructions')}
              aria-invalid={!!errors.special_instructions}
              type="text"
              placeholder="Leave at door if not home"
            />
            {errors.special_instructions && (
              <p className="mt-1 text-xs text-red-400">{errors.special_instructions.message}</p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? 'Saving...' : initialOrder ? 'Update Order' : 'Create Order'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
