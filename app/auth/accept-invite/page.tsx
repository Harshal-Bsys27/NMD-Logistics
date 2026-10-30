'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, KeyRound, Loader2 } from 'lucide-react';
import Logo from '@/components/brand/Logo';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { authService } from '@/services/auth';
import { cn } from '@/utils/helpers';

export default function AcceptInvitePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void authService.getCurrentUser().then(({ user, error }) => {
      if (!active) return;
      if (error || !user || !user.email_confirmed_at || user.app_metadata?.invite_pending !== true) {
        router.replace('/auth/signin?error=invite');
        return;
      }
      setEmail(user.email ?? '');
      setChecking(false);
    });
    return () => {
      active = false;
    };
  }, [router]);

  const acceptInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setErrorMessage('Use at least 8 characters with uppercase, lowercase, and a number.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: passwordError } = await authService.updatePassword(password);
    if (passwordError) {
      setErrorMessage(passwordError instanceof Error ? passwordError.message : 'Unable to set your password.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/accept-invite', { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || 'Unable to finish account setup.');
      const { error: refreshError } = await authService.refreshSession();
      if (refreshError) throw refreshError;
      router.replace('/dashboard');
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to finish account setup.');
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-12 text-foreground">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6"><ThemeToggle appearance="surface" /></div>
      <section className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-card sm:p-9">
        <Logo href="/" variant="adaptive" size="sm" />
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Invitation verified</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Set your password</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Your email address is confirmed. Choose a password to activate your invited workspace account.
        </p>
        {checking ? (
          <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Checking invitation…</div>
        ) : (
          <form onSubmit={acceptInvite} className="mt-7 space-y-4">
            <label className="block">
              <span className="text-sm font-medium">Invited email</span>
              <input value={email} readOnly className="mt-2 min-h-11 w-full rounded-lg border border-input bg-muted px-3 text-sm text-muted-foreground" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Password</span>
              <span className="mt-2 flex min-h-12 items-center gap-3 rounded-lg border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
                <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full bg-transparent text-sm outline-none" />
              </span>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Confirm password</span>
              <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={cn('mt-2 min-h-12 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring', errorMessage && password !== confirmPassword ? 'border-danger' : 'border-input')} />
            </label>
            {errorMessage && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger-foreground">{errorMessage}</p>}
            <button type="submit" disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Activating account…</> : <>Activate account <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
