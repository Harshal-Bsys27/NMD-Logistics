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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container-main flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl rounded-[2rem] border border-slate-800 bg-slate-900/95 p-10 shadow-[0_35px_120px_-40px_rgba(15,23,42,0.75)] backdrop-blur-xl sm:p-12">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Reset your password</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base">
              Enter your email and we’ll send a secure reset link so you can get back into your account.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <label className="group block rounded-3xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-slate-700">
              <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Email</span>
              <div className="mt-2 flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  {...register('email')}
                  className={cn('w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500')}
                  placeholder="name@example.com"
                />
              </div>
              {errors.email && <p className="mt-2 text-xs text-rose-400">{errors.email.message}</p>}
            </label>

            {formError && <p className="rounded-3xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{formError}</p>}
            {successMessage && <p className="rounded-3xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{successMessage}</p>}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-4 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Sending reset link…' : 'Send reset link'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Remembered your password?{' '}
            <a href="/auth/signin" className="font-semibold text-white hover:text-cyan-300">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
