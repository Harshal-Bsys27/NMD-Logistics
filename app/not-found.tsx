'use client';

import Link from 'next/link';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-md flex-col items-center justify-center text-center">
        {/* Icon */}
        <div className="mb-6 rounded-2xl bg-rose-500/20 p-6">
          <AlertTriangle className="mx-auto h-16 w-16 text-rose-400" />
        </div>

        {/* Heading */}
        <h1 className="text-5xl font-bold text-white">404</h1>
        <h2 className="mt-2 text-2xl font-bold text-white">Page Not Found</h2>

        {/* Description */}
        <p className="mt-4 text-slate-400">
          The page you're looking for doesn't exist or has been moved. Don't worry, you can still navigate to the dashboard.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/50 px-6 py-3 font-semibold text-slate-300 transition hover:border-slate-600/50 hover:bg-slate-700/50"
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </button>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-600 hover:to-blue-600"
          >
            <Home className="h-5 w-5" />
            Back to Dashboard
          </Link>
        </div>

        {/* Decorative */}
        <div className="mt-12 space-y-2 text-left">
          <div className="h-1 w-32 rounded-full bg-gradient-to-r from-cyan-500/0 via-cyan-500 to-cyan-500/0" />
          <div className="h-1 w-24 rounded-full bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0" />
        </div>
      </div>
    </div>
  );
}
