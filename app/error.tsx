'use client';

import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-md flex-col items-center justify-center text-center">
        {/* Icon */}
        <div className="mb-6 rounded-2xl bg-rose-500/20 p-6">
          <AlertTriangle className="mx-auto h-16 w-16 text-rose-400" />
        </div>

        {/* Heading */}
        <h1 className="text-5xl font-bold text-white">500</h1>
        <h2 className="mt-2 text-2xl font-bold text-white">Something Went Wrong</h2>

        {/* Description */}
        <p className="mt-4 text-slate-400">
          We encountered an unexpected error. Please try again or contact support if the problem persists.
        </p>

        {/* Error Details */}
        {error.message && (
          <div className="mt-6 w-full rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-left">
            <p className="text-sm font-mono text-rose-300">{error.message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/50 px-6 py-3 font-semibold text-slate-300 transition hover:border-slate-600/50 hover:bg-slate-700/50"
          >
            <RefreshCw className="h-5 w-5" />
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-600 hover:to-blue-600"
          >
            <Home className="h-5 w-5" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
