'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, Loader2, PackageCheck, RefreshCw } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface TrackingMilestone {
  key: string;
  label: string;
  occurred_at: string | null;
  complete: boolean;
}

interface TrackingDetails {
  order_number: string;
  status: string;
  current_milestone: string | null;
  expires_at: string;
  milestones: TrackingMilestone[];
}

interface TrackingPageProps {
  params: Promise<{ token: string }>;
}

const statusLabels: Record<string, string> = {
  draft: 'Preparing order',
  pending: 'Preparing order',
  confirmed: 'Order confirmed',
  assigned: 'Driver assigned',
  picked_up: 'Picked up',
  in_transit: 'On the way',
  delivered: 'Delivered',
  failed: 'Delivery issue',
  cancelled: 'Cancelled',
};

export default function CustomerTrackingPage({ params }: TrackingPageProps) {
  const { token } = use(params);
  const [details, setDetails] = useState<TrackingDetails | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const refresh = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/customer-tracking/${encodeURIComponent(token)}`, { cache: 'no-store' });
      const result = await response.json() as TrackingDetails & { error?: string };
      if (!response.ok) throw new Error(result.error || 'This tracking link is unavailable.');
      setDetails(result);
      setLastUpdated(new Date().toISOString());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load tracking details.');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh(true);
    const interval = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const isTerminalIssue = details?.status === 'failed' || details?.status === 'cancelled';

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-xl">
        <header className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <PackageCheck className="h-7 w-7" />
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-primary">NMD Logistics</p>
        </header>

        <section className="surface-glass rounded-2xl border border-border p-6 shadow-xl sm:p-8">
          {loading ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-muted-foreground" role="status">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-sm">Loading delivery progress…</p>
            </div>
          ) : error && !details ? (
            <div className="py-8 text-center">
              <AlertCircle className="mx-auto h-9 w-9 text-danger-foreground" />
              <h1 className="mt-4 text-xl font-bold">Tracking link unavailable</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{error}</p>
              <p className="mt-4 text-sm text-muted-foreground">Contact the delivery team if you need help with your order.</p>
            </div>
          ) : details ? (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-bold">Track your delivery</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Order <span className="font-semibold text-foreground">{details.order_number}</span>
                </p>
                <p className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
                  isTerminalIssue ? 'bg-danger/10 text-danger-foreground' : 'bg-primary/10 text-primary'
                }`}>
                  {details.status === 'delivered'
                    ? <CheckCircle2 className="h-4 w-4" />
                    : <Clock3 className="h-4 w-4" />}
                  {statusLabels[details.status] || 'Delivery update'}
                </p>
                {isTerminalIssue && (
                  <p className="mt-3 text-sm text-muted-foreground">Please contact the delivery team for more information.</p>
                )}
              </div>

              {error && <p role="status" className="mt-5 rounded-lg bg-warning/10 p-3 text-sm text-warning-foreground">{error}</p>}

              <ol className="mt-8 space-y-0">
                {details.milestones.map((milestone, index) => {
                  const isCurrent = details.current_milestone === milestone.key && !milestone.complete;
                  return (
                    <li key={milestone.key} className="relative flex gap-4 pb-7 last:pb-0">
                      {index < details.milestones.length - 1 && (
                        <span className={`absolute left-[13px] top-7 h-[calc(100%-1rem)] w-0.5 ${
                          milestone.complete ? 'bg-success/50' : 'bg-border'
                        }`} aria-hidden="true" />
                      )}
                      <span className={`relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                        milestone.complete
                          ? 'border-success bg-success text-success-foreground'
                          : isCurrent
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background text-muted-foreground'
                      }`}>
                        {milestone.complete
                          ? <CheckCircle2 className="h-4 w-4" />
                          : <span className="h-2 w-2 rounded-full bg-current" />}
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p className={`text-sm font-semibold ${milestone.complete || isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {milestone.label}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {milestone.occurred_at
                            ? new Date(milestone.occurred_at).toLocaleString()
                            : milestone.complete
                              ? 'Complete'
                              : isCurrent
                                ? 'In progress'
                                : 'Upcoming'}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  {lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}` : 'Updates automatically'}
                </p>
                <button
                  type="button"
                  onClick={() => void refresh()}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-muted"
                >
                  <RefreshCw className="h-4 w-4" /> Refresh
                </button>
              </div>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                This private link shows delivery milestones only. It does not show addresses or driver contact details.
              </p>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}
