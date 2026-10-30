'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Loader2, LogIn } from 'lucide-react';
import Logo from '@/components/brand/Logo';
import { authService } from '@/services/auth';

type SignOutState =
  | { status: 'pending' }
  | { status: 'complete' }
  | { status: 'error'; message: string };

export default function SignOutPage() {
  const [state, setState] = useState<SignOutState>({ status: 'pending' });
  const requestStarted = useRef(false);

  const signOut = useCallback(async () => {
    requestStarted.current = true;
    setState({ status: 'pending' });
    const { error } = await authService.signOut();
    setState(
      error
        ? { status: 'error', message: error instanceof Error ? error.message : 'Unable to sign out. Please try again.' }
        : { status: 'complete' }
    );
  }, []);

  useEffect(() => {
    if (!requestStarted.current) void signOut();
  }, [signOut]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12 text-foreground">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-7 text-center shadow-card sm:p-10">
        <Logo href="/" variant="adaptive" size="md" className="mx-auto" />
        <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          {state.status === 'pending' && <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />}
          {state.status === 'complete' && <CheckCircle2 className="h-6 w-6 text-success" aria-hidden="true" />}
          {state.status === 'error' && <AlertCircle className="h-6 w-6 text-danger" aria-hidden="true" />}
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          {state.status === 'pending' && 'Signing you out'}
          {state.status === 'complete' && 'You’re signed out'}
          {state.status === 'error' && 'Sign-out needs attention'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground" aria-live="polite">
          {state.status === 'pending' && 'Please wait while we securely end your session.'}
          {state.status === 'complete' && 'Your NMD Logistics session has ended. You can safely close this page.'}
          {state.status === 'error' && state.message}
        </p>
        {state.status === 'error' ? (
          <button type="button" onClick={() => void signOut()} className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Try again
          </button>
        ) : state.status === 'complete' ? (
          <div className="mt-6 flex flex-col gap-3">
            <Link href="/auth/signin" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <LogIn className="h-4 w-4" /> Sign in again
            </Link>
            <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Return to home
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
