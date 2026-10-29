'use client';

import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-md flex-col items-center justify-center text-center">
        {/* Icon */}
        <div className="mb-6 rounded-lg bg-danger p-6">
          <AlertTriangle className="mx-auto h-16 w-16 text-danger-foreground" />
        </div>

        {/* Heading */}
        <h1 className="text-5xl font-bold text-foreground">500</h1>
        <h2 className="mt-2 text-2xl font-bold text-foreground">Something Went Wrong</h2>

        {/* Description */}
        <p className="mt-4 text-muted-foreground">
          We encountered an unexpected error. Please try again or contact support if the problem persists.
        </p>

        {/* Error Details */}
        {error.message && (
          <div className="mt-6 w-full rounded-md border border-danger/30 bg-danger/20 p-4 text-left">
            <p className="break-words font-mono text-sm text-danger-foreground">{error.message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RefreshCw className="h-5 w-5" />
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Home className="h-5 w-5" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
