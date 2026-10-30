'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import Logo from '@/components/brand/Logo';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { signInSchema, type SignInInput } from '@/lib/validations/schemas';
import { authService } from '@/services/auth';
import { cn } from '@/utils/helpers';

export default function SignInPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const error = searchParams.get('error');
    if (error === 'google') {
      setFormError('Google sign-in could not be completed. Please try again or use your email and password.');
    } else if (error === 'invite') {
      setFormError('This account has not been invited to NMD Logistics. Contact an administrator for access.');
    } else if (error === 'access') {
      setFormError('Your account does not have an active NMD Logistics role. Contact an administrator.');
    }
    if (error) {
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

    if (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to sign in. Please check your credentials.');
      setLoading(false);
      return;
    }

    if (!data?.session) {
      setFormError('Sign-in did not create a session. Please try again.');
      setLoading(false);
      return;
    }

    router.replace('/dashboard');
  };

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#eef3fb] px-4 py-16 text-foreground transition-colors sm:px-8 sm:py-16 dark:bg-[#070f2b]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-[-7rem] h-80 w-80 rounded-full bg-amber-300/40 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-20 h-[30rem] w-[30rem] rounded-full bg-blue-400/25 blur-3xl" />
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle appearance="surface" />
      </div>
      <div className="relative w-full max-w-[1180px]">
        <div aria-hidden="true" className="absolute -inset-x-3 -inset-y-3 rotate-[-1.2deg] rounded-[2rem] bg-gradient-to-br from-blue-400 via-indigo-300 to-cyan-300 shadow-2xl shadow-blue-900/15 dark:from-blue-700 dark:via-indigo-700 dark:to-cyan-700 sm:-inset-x-5 sm:-inset-y-5 sm:rounded-[2.5rem]" />
        <div className="relative grid overflow-hidden rounded-[1.65rem] border border-white/60 bg-white shadow-2xl shadow-slate-900/15 dark:border-white/10 dark:bg-[#0e1a3a] sm:rounded-[2rem] lg:min-h-[690px] lg:grid-cols-[0.94fr_1.06fr]">
          <aside className="relative hidden overflow-hidden bg-brand-950 px-10 py-10 text-on-brand lg:flex lg:flex-col lg:justify-between xl:px-14 xl:py-12">
            <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-blue-500/25 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 -left-28 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
            <Logo href="/" variant="onDark" size="md" className="relative z-10" />
            <div className="relative z-10 max-w-lg py-12">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">NMD Logistics · Operations</p>
              <h1 className="mt-6 text-[2.65rem] font-semibold leading-[1.12] tracking-[-0.035em] xl:text-5xl">
                Every delivery starts with a clear view.
              </h1>
              <p className="mt-5 max-w-md text-[15px] leading-7 text-blue-100/75">
                Your orders, dispatch, and driver team—together in one workspace built to keep work moving.
              </p>
              <div className="mt-9 space-y-4">
                {[
                  'See every order from creation to delivery',
                  'Coordinate assignments and driver availability',
                  'Keep the whole team on the same page',
                ].map((item) => (
                  <p key={item} className="flex items-center gap-3 text-sm font-medium text-blue-50/90">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />
                    </span>
                    {item}
                  </p>
                ))}
              </div>
            </div>
            <p className="relative z-10 text-xs font-medium tracking-wide text-blue-100/50">A clearer way to move things forward.</p>
          </aside>

          <section className="relative flex items-center justify-center bg-white px-5 py-8 dark:bg-[#0e1a3a] sm:px-10 sm:py-10 lg:px-10 xl:px-14">
            <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-bl-full bg-sky-50 dark:bg-blue-400/5" />
            <div className="relative w-full max-w-[430px]">
              <div className="mb-8 flex items-center justify-between gap-4 lg:hidden">
                <Logo href="/" variant="adaptive" size="sm" />
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-blue-800 dark:bg-blue-400/10 dark:text-blue-200">SECURE SIGN IN</span>
              </div>

              <div className="relative rounded-2xl border border-sky-100 bg-[#f7faff] p-5 shadow-[0_16px_45px_-30px_rgba(29,78,216,0.55)] dark:border-blue-300/15 dark:bg-[#111f43] sm:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-2 h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-200 to-orange-300 opacity-80 dark:from-amber-400/70 dark:to-orange-500/60" />
                <div className="relative">
                  <div className="mb-7">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">Welcome back</p>
                    <h2 className="mt-2.5 text-[1.8rem] font-bold leading-tight tracking-[-0.035em] text-slate-950 dark:text-slate-50 sm:text-[2rem]">Sign in to NMD</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Pick up where your team left off.</p>
                  </div>

                  <GoogleSignInButton />

                  <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-400">
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                    <span>Or use email</span>
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <label className="block">
                <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Work email</span>
                <span className={cn(
                  'mt-1.5 flex min-h-12 items-center gap-3 rounded-xl border bg-white px-3.5 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 dark:bg-[#0b1735]',
                  errors.email ? 'border-danger' : 'border-slate-200 dark:border-slate-700'
                )}>
                  <Mail className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                  <input
                    type="email"
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    {...register('email')}
                    className="h-11 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                    placeholder="you@company.com"
                  />
                </span>
                {errors.email && <span className="mt-1.5 block text-xs text-danger-foreground">{errors.email.message}</span>}
              </label>

              <label className="block">
                <span className="flex items-center justify-between gap-3 text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                  Password
                  <Link href="/auth/forgot-password" className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-300 dark:hover:text-blue-200">
                    Forgot password?
                  </Link>
                </span>
                <span className={cn(
                  'mt-1.5 flex min-h-12 items-center gap-3 rounded-xl border bg-white px-3.5 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 dark:bg-[#0b1735]',
                  errors.password ? 'border-danger' : 'border-slate-200 dark:border-slate-700'
                )}>
                  <LockKeyhole className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={Boolean(errors.password)}
                    {...register('password')}
                    className="h-11 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                    placeholder="Enter your password"
                  />
                </span>
                {errors.password && <span className="mt-1.5 block text-xs text-danger-foreground">{errors.password.message}</span>}
              </label>

              {formError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-200">{formError}</p>}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:from-blue-800 hover:to-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Signing in…' : 'Continue to workspace'} {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

                  <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    Need access?{' '}
                    <Link href="/auth/signup" className="font-bold text-blue-700 hover:text-blue-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-300 dark:hover:text-blue-200">
                      Learn about invitations
                    </Link>
                  </p>
                </div>
              </div>
              <p className="mt-5 text-center text-[11px] font-medium tracking-wide text-slate-500 dark:text-slate-400">Protected access for your logistics team</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
