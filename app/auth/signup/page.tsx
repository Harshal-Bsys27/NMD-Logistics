'use client';

import { startTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, type SignUpInput } from '@/lib/validations/schemas';
import { authService } from '@/services/auth';
import { cn } from '@/utils/helpers';
import { ArrowRight, Lock, Mail, Smartphone, User } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (values: SignUpInput) => {
    setLoading(true);
    setFormError(null);

    const { user, error } = await authService.signUp(values.email, values.password, {
      full_name: values.full_name,
      phone: values.phone,
      role: 'supervisor',
    });

    setLoading(false);

    if (error) {
      setFormError((error as any)?.message || 'Unable to create account.');
      return;
    }

    if (user) {
      startTransition(() => {
        router.push('/dashboard');
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container-main flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="surface-glass w-full max-w-3xl rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl sm:p-10">
          <div className="mb-8 grid gap-6 sm:grid-cols-[1fr_280px] sm:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.16em] text-primary">Create your account</p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Start managing logistics with NMD</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                Create an account and access the operations dashboard for orders, assignments, and driver performance.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/50 p-5 text-sm text-muted-foreground">
              <div className="flex items-center gap-3 text-primary">
                <ArrowRight className="h-5 w-5" />
                <span>Fast setup with role-based access</span>
              </div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                After signup, you can create driver records and assign delivery tasks from the dashboard.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="group block rounded-lg border border-border bg-background p-4 transition hover:border-ring/50">
                <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Full name</span>
                <div className="mt-2 flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    {...register('full_name')}
                    className={cn('min-h-8 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring')}
                    placeholder="John Doe"
                  />
                </div>
                {errors.full_name && <p className="mt-2 text-xs text-danger-foreground">{errors.full_name.message}</p>}
              </label>
              <label className="group block rounded-lg border border-border bg-background p-4 transition hover:border-ring/50">
                <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Phone number</span>
                <div className="mt-2 flex items-center gap-3">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    {...register('phone')}
                    className={cn('min-h-8 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring')}
                    placeholder="9876543210"
                  />
                </div>
                {errors.phone && <p className="mt-2 text-xs text-danger-foreground">{errors.phone.message}</p>}
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="group block rounded-lg border border-border bg-background p-4 transition hover:border-ring/50">
                <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Email</span>
                <div className="mt-2 flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    {...register('email')}
                    className={cn('min-h-8 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring')}
                    placeholder="name@example.com"
                  />
                </div>
                {errors.email && <p className="mt-2 text-xs text-danger-foreground">{errors.email.message}</p>}
              </label>
              <label className="group block rounded-lg border border-border bg-background p-4 transition hover:border-ring/50">
                <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Password</span>
                <div className="mt-2 flex items-center gap-3">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    {...register('password')}
                    className={cn('min-h-8 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring')}
                    placeholder="Choose a secure password"
                  />
                </div>
                {errors.password && <p className="mt-2 text-xs text-danger-foreground">{errors.password.message}</p>}
              </label>
            </div>

            {formError && <p role="alert" className="rounded-md border border-danger/30 bg-danger px-4 py-3 text-sm text-danger-foreground">{formError}</p>}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <a href="/auth/signin" className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
