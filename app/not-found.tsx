'use client';

import Link from 'next/link';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-md flex-col items-center justify-center text-center">
        {/* Icon */}
        <div className="mb-6 rounded-lg bg-danger p-6">
          <AlertTriangle className="mx-auto h-16 w-16 text-danger-foreground" />
        </div>

        {/* Heading */}
        <h1 className="text-5xl font-bold text-foreground">404</h1>
        <h2 className="mt-2 text-2xl font-bold text-foreground">Page Not Found</h2>

        {/* Description */}
        <p className="mt-4 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved. Don't worry, you can still navigate to the dashboard.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => window.history.back()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </button>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Home className="h-5 w-5" />
            Back to Dashboard
          </Link>
        </div>

        {/* Decorative */}
        <div className="mt-12 space-y-2 text-left">
          <div className="h-1 w-32 rounded-full bg-primary/40" />
          <div className="h-1 w-24 rounded-full bg-info-foreground/40" />
        </div>
      </div>
    </div>
  );
}
