'use client';

import { useState } from 'react';
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
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container-main flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-3xl rounded-[2rem] border border-slate-800 bg-slate-900/95 p-10 shadow-[0_35px_120px_-40px_rgba(15,23,42,0.75)] backdrop-blur-xl sm:p-12">
          <div className="mb-8 grid gap-6 sm:grid-cols-[1fr_280px] sm:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-300/80">Create your account</p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Start managing logistics with NMD</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                Create an account and access the operations dashboard for orders, assignments, and driver performance.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-950/80 p-5 text-sm text-slate-400 shadow-inner shadow-slate-950/40">
              <div className="flex items-center gap-3 text-cyan-300">
                <ArrowRight className="h-5 w-5" />
                <span>Fast setup with role-based access</span>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                After signup, you can create driver records and assign delivery tasks from the dashboard.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="group block rounded-3xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-slate-700">
                <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Full name</span>
                <div className="mt-2 flex items-center gap-3">
                  <User className="h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    {...register('full_name')}
                    className={cn('w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500')}
                    placeholder="John Doe"
                  />
                </div>
                {errors.full_name && <p className="mt-2 text-xs text-rose-400">{errors.full_name.message}</p>}
              </label>
              <label className="group block rounded-3xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-slate-700">
                <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Phone number</span>
                <div className="mt-2 flex items-center gap-3">
                  <Smartphone className="h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    {...register('phone')}
                    className={cn('w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500')}
                    placeholder="9876543210"
                  />
                </div>
                {errors.phone && <p className="mt-2 text-xs text-rose-400">{errors.phone.message}</p>}
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
              <label className="group block rounded-3xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-slate-700">
                <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Password</span>
                <div className="mt-2 flex items-center gap-3">
                  <Lock className="h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    {...register('password')}
                    className={cn('w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500')}
                    placeholder="Choose a secure password"
                  />
                </div>
                {errors.password && <p className="mt-2 text-xs text-rose-400">{errors.password.message}</p>}
              </label>
            </div>

            {formError && <p className="rounded-3xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{formError}</p>}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-4 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <a href="/auth/signin" className="font-semibold text-white hover:text-cyan-300">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
