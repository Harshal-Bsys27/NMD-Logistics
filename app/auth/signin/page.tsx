'use client';

import { startTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, type SignInInput } from '@/lib/validations/schemas';
import { authService } from '@/services/auth';
import { cn } from '@/utils/helpers';
import { ArrowRight, Lock, Mail } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (values: SignInInput) => {
    setLoading(true);
    setFormError(null);

    const { data, error } = await authService.signIn(values.email, values.password);

    setLoading(false);

    if (error) {
      setFormError((error as any)?.message || 'Unable to sign in. Please check your credentials.');
      return;
    }

    if (data?.session) {
      startTransition(() => {
        router.push('/dashboard');
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container-main flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl rounded-[2rem] border border-slate-800 bg-slate-900/95 p-10 shadow-[0_35px_120px_-40px_rgba(15,23,42,0.75)] backdrop-blur-xl sm:p-12">
          <div className="mb-8 flex flex-col gap-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20">
              <ArrowRight className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Sign in to NMD Logistics</h1>
              <p className="mt-2 text-sm text-slate-400 sm:text-base">
                Secure access for administrators and logistics supervisors.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="group relative block rounded-3xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-slate-700">
                <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Email</span>
                <div className="mt-2 flex items-center gap-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    {...register('email')}
                    className={cn(
                      'w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500',
                      errors.email ? 'border-red-500' : ''
                    )}
                    placeholder="name@example.com"
                  />
                </div>
                {errors.email && <p className="mt-2 text-xs text-rose-400">{errors.email.message}</p>}
              </label>
              <label className="group relative block rounded-3xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-slate-700">
                <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Password</span>
                <div className="mt-2 flex items-center gap-3">
                  <Lock className="h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    {...register('password')}
                    className={cn(
                      'w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500',
                      errors.password ? 'border-red-500' : ''
                    )}
                    placeholder="Enter your password"
                  />
                </div>
                {errors.password && <p className="mt-2 text-xs text-rose-400">{errors.password.message}</p>}
              </label>
            </div>

            {formError && <p className="rounded-3xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{formError}</p>}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-3xl bg-gradient-to-r from-blue-500 to-cyan-400 px-5 py-4 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Continue'}
            </button>
          </form>

          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-6 text-sm sm:flex-row">
            <p className="text-slate-500">New to NMD Logistics?</p>
            <a href="/auth/signup" className="font-semibold text-white hover:text-cyan-300">
              Create an account
            </a>
          </div>
          <div className="mt-4 text-center text-sm text-slate-500">
            <a href="/auth/forgot-password" className="hover:text-cyan-300">Forgot password?</a>
          </div>
        </div>
      </div>
    </div>
  );
}
