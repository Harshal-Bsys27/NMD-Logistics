'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/schemas';
import { authService } from '@/services/auth';
import { cn } from '@/utils/helpers';
import { Mail, ShieldCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (values: ResetPasswordInput) => {
    setLoading(true);
    setFormError(null);
    setSuccessMessage(null);

    const { error } = await authService.resetPassword(values.email);

    setLoading(false);

    if (error) {
      setFormError((error as any)?.message || 'Unable to send reset instructions.');
      return;
    }

    setSuccessMessage('Check your inbox for password reset instructions.');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container-main flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="surface-glass w-full max-w-xl rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Reset your password</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Enter your email and we’ll send a secure reset link so you can get back into your account.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
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

            {formError && <p role="alert" className="rounded-md border border-danger/30 bg-danger px-4 py-3 text-sm text-danger-foreground">{formError}</p>}
            {successMessage && <p role="status" className="rounded-md border border-success/30 bg-success px-4 py-3 text-sm text-success-foreground">{successMessage}</p>}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Sending reset link…' : 'Send reset link'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remembered your password?{' '}
            <a href="/auth/signin" className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
