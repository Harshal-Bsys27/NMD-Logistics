'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Camera, CheckCircle2, Clock3, RefreshCw, RotateCcw } from 'lucide-react';
import { useAuth } from '@/hooks';
import { useOperationsData } from '@/hooks/useOperationsData';
import { deliveryExceptionService, assignmentService } from '@/services/database';
import { formatDate } from '@/utils/helpers';
import { cn } from '@/utils/helpers';

const reasonLabels: Record<string, string> = {
  customer_unavailable: 'Customer unavailable',
  address_issue: 'Address issue',
  customer_refused: 'Customer refused delivery',
  access_blocked: 'Could not access location',
  vehicle_issue: 'Vehicle issue',
  package_issue: 'Package issue',
  other: 'Other',
};

export default function DeliveryExceptionsPage() {
  const { user } = useAuth();
  const { deliveryExceptions, deliveryExceptionsError, isLoading, refresh } = useOperationsData();
  const [showResolved, setShowResolved] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const canManage = user?.role === 'admin' || user?.role === 'supervisor';

  const exceptions = useMemo(
    () => deliveryExceptions.filter((exception) => showResolved || exception.status === 'open'),
    [deliveryExceptions, showResolved],
  );
  const openCount = deliveryExceptions.filter((exception) => exception.status === 'open').length;

  const resolveException = async (exceptionId: string) => {
    setBusyId(exceptionId);
    setActionError('');
    const result = await deliveryExceptionService.resolve(exceptionId, resolutionNotes[exceptionId] ?? '');
    if (result.error) {
      setActionError(result.error);
    } else {
      setResolutionNotes((current) => ({ ...current, [exceptionId]: '' }));
      await refresh(true);
    }
    setBusyId(null);
  };

  const showPhoto = async (exceptionId: string, photoPath: string) => {
    setBusyId(exceptionId);
    setActionError('');
    const result = await assignmentService.getProofPhotoUrl(photoPath);
    if (result.error || !result.data) {
      setActionError(result.error || 'Unable to open the issue photo.');
    } else {
      setPhotoUrls((current) => ({ ...current, [exceptionId]: result.data! }));
    }
    setBusyId(null);
  };

  if (!canManage) {
    return (
      <main className="bg-background px-4 py-8 text-foreground">
        <div className="mx-auto max-w-3xl rounded-xl border border-border p-6">
          <h1 className="text-xl font-semibold">Delivery issues</h1>
          <p className="mt-2 text-sm text-muted-foreground">This queue is available to administrators and supervisors.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full bg-background px-3 py-5 text-foreground sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Operations / Follow-up</p>
            <h1 className="mt-2 text-3xl font-semibold">Delivery issues</h1>
            <p className="mt-2 text-sm text-muted-foreground">Review failed attempts and return orders to dispatch when ready.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-danger/10 px-3 py-1.5 text-sm font-semibold text-danger-foreground">
              {openCount} open
            </span>
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-muted"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </header>

        {(deliveryExceptionsError || actionError) && (
          <div role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger-foreground">
            {deliveryExceptionsError || actionError}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {showResolved ? 'Open and resolved reports' : 'Showing unresolved reports first'}
          </p>
          <button
            type="button"
            aria-pressed={showResolved}
            onClick={() => setShowResolved((current) => !current)}
            className={cn(
              'min-h-11 rounded-lg border px-4 text-sm font-semibold',
              showResolved ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted',
            )}
          >
            {showResolved ? 'Hide resolved' : 'Show resolved'}
          </button>
        </div>

        {isLoading ? (
          <p role="status" className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Loading delivery issue reports…
          </p>
        ) : exceptions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-success-foreground" />
            <h2 className="mt-3 font-semibold">{showResolved ? 'No delivery issues recorded' : 'No open delivery issues'}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Driver reports will appear here as soon as they are submitted.</p>
          </div>
        ) : (
          <section aria-label="Delivery issue reports" className="space-y-3">
            {exceptions.map((exception) => (
              <article key={exception.id} className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/orders/${exception.order_id}`} className="font-semibold text-primary hover:underline">
                        {exception.order_number}
                      </Link>
                      <span className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-semibold',
                        exception.status === 'open'
                          ? 'bg-danger/10 text-danger-foreground'
                          : 'bg-success/10 text-success-foreground',
                      )}>
                        {exception.status === 'open' ? 'Open' : 'Resolved · reopened for dispatch'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{exception.client_name}</p>
                    <h2 className="mt-3 flex items-center gap-2 text-lg font-semibold">
                      <AlertTriangle className="h-5 w-5 text-warning-foreground" />
                      {reasonLabels[exception.reason] ?? exception.reason}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{exception.driver_name} {exception.employee_id ? `(${exception.employee_id})` : ''}</span>
                      <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{formatDate(exception.reported_at, 'short')}</span>
                    </div>
                    {exception.notes && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-sm">{exception.notes}</p>}
                    {exception.resolution_note && (
                      <p className="mt-3 rounded-lg border border-success/20 bg-success/5 p-3 text-sm">
                        <span className="font-semibold">Dispatch note: </span>{exception.resolution_note}
                      </p>
                    )}
                    {exception.photo_path && (
                      <div className="mt-3">
                        {photoUrls[exception.id] ? (
                          <a
                            href={photoUrls[exception.id]}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline"
                          >
                            <Camera className="h-4 w-4" /> Open issue photo
                          </a>
                        ) : (
                          <button
                            type="button"
                            disabled={busyId === exception.id}
                            onClick={() => void showPhoto(exception.id, exception.photo_path!)}
                            className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary underline disabled:opacity-50"
                          >
                            <Camera className="h-4 w-4" /> View issue photo
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {exception.status === 'open' && (
                    <div className="w-full space-y-2 lg:max-w-sm">
                      <label className="block text-xs font-semibold text-muted-foreground">
                        Dispatch resolution note (optional)
                        <textarea
                          maxLength={1000}
                          value={resolutionNotes[exception.id] ?? ''}
                          onChange={(event) => setResolutionNotes((current) => ({
                            ...current,
                            [exception.id]: event.target.value,
                          }))}
                          rows={3}
                          className="mt-1 min-h-20 w-full rounded-lg border border-border bg-background p-3 text-sm font-normal text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={busyId === exception.id}
                        onClick={() => void resolveException(exception.id)}
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {busyId === exception.id ? 'Reopening…' : 'Reopen order for dispatch'}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
