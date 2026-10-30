'use client';

import { startTransition, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, type SignInInput } from '@/lib/validations/schemas';
import { authService } from '@/services/auth';
import { cn } from '@/utils/helpers';
import { Lock, Mail } from 'lucide-react';
import Logo from '@/components/brand/Logo';

export default function SignInPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('error') === 'google') {
      setFormError('Google sign-in could not be completed. Please try again or use your email and password.');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

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

  const onGoogleSignIn = async () => {
    setGoogleLoading(true);
    setFormError(null);

    const { data, error } = await authService.signInWithGoogle(
      `${window.location.origin}/auth/callback`
    );

    if (error || !data?.url) {
      setFormError(error instanceof Error ? error.message : 'Unable to start Google sign-in.');
      setGoogleLoading(false);
      return;
    }

    window.location.assign(data.url);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container-main flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="surface-glass w-full max-w-2xl rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl sm:p-10">
          <div className="mb-8 flex flex-col gap-4 text-center">
            <Logo size="md" variant="onLight" className="mx-auto" />
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Sign in to NMD Logistics</h1>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Secure access for administrators and logistics supervisors.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onGoogleSignIn}
            disabled={loading || googleLoading}
            className="inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-md border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span aria-hidden="true" className="text-lg font-bold text-blue-400">G</span>
            {googleLoading ? 'Connecting to Google…' : 'Continue with Google'}
          </button>

          <div className="my-6 flex items-center gap-4 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            <span>Or use email</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="group relative block rounded-lg border border-border bg-background p-4 transition hover:border-ring/50">
                <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Email</span>
                <div className="mt-2 flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    {...register('email')}
                    className={cn(
                      'min-h-8 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring',
                      errors.email ? 'text-danger-foreground' : ''
                    )}
                    placeholder="name@example.com"
                  />
                </div>
                {errors.email && <p className="mt-2 text-xs text-danger-foreground">{errors.email.message}</p>}
              </label>
              <label className="group relative block rounded-lg border border-border bg-background p-4 transition hover:border-ring/50">
                <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Password</span>
                <div className="mt-2 flex items-center gap-3">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    {...register('password')}
                    className={cn(
                      'min-h-8 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring',
                      errors.password ? 'text-danger-foreground' : ''
                    )}
                    placeholder="Enter your password"
                  />
                </div>
                {errors.password && <p className="mt-2 text-xs text-danger-foreground">{errors.password.message}</p>}
              </label>
            </div>

            {formError && <p role="alert" className="rounded-md border border-danger/30 bg-danger px-4 py-3 text-sm text-danger-foreground">{formError}</p>}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Continue'}
            </button>
          </form>

          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-sm sm:flex-row">
            <p className="text-muted-foreground">New to NMD Logistics?</p>
            <a href="/auth/signup" className="min-h-11 inline-flex items-center font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Create an account
            </a>
          </div>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <a href="/auth/forgot-password" className="inline-flex min-h-11 items-center text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Forgot password?</a>
          </div>
        </div>
      </div>
    </div>
  );
}
