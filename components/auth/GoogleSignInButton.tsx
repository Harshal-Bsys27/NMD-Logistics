'use client';

import { useEffect, useState } from 'react';
import { authService } from '@/services/auth';

type ProviderState = 'checking' | 'enabled' | 'disabled';

export default function GoogleSignInButton({ label = 'Continue with Google' }: { label?: string }) {
  const [providerState, setProviderState] = useState<ProviderState>('checking');
  const [providerMessage, setProviderMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void authService.getGoogleProviderStatus().then((status) => {
      if (!active) return;
      setProviderState(status.enabled ? 'enabled' : 'disabled');
      setProviderMessage(status.message);
    });
    return () => {
      active = false;
    };
  }, []);

  const startGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    const { data, error } = await authService.signInWithGoogle(
      `${window.location.origin}/auth/callback`
    );

    if (error || !data?.url) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to start Google sign-in. Please try again.'
      );
      setLoading(false);
      return;
    }

    window.location.assign(data.url);
  };

  const disabled = providerState !== 'enabled' || loading;

  return (
    <div>
      <button
        type="button"
        onClick={startGoogleSignIn}
        disabled={disabled}
        aria-busy={loading || providerState === 'checking'}
        className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-border bg-background px-5 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(0 4)" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.73 7.18l7.63 5.92c4.45-4.11 7.14-10.16 7.14-17.57Z" />
          <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z" transform="translate(0 4)" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.63-5.92c-2.12 1.42-4.83 2.27-8.27 2.27-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" transform="translate(0 -4)" />
        </svg>
        {providerState === 'checking' ? 'Checking Google sign-in…' : loading ? 'Connecting to Google…' : label}
      </button>
      {providerMessage && (
        <p role="status" className="mt-2 text-xs leading-5 text-muted-foreground">
          {providerMessage}
        </p>
      )}
      {errorMessage && (
        <p role="alert" className="mt-2 text-sm text-danger-foreground">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
