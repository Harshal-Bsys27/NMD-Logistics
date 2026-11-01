'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Clock3, MessageSquare, RefreshCw, Star } from 'lucide-react';
import { useAuth } from '@/hooks/auth';
import { useOperationsData } from '@/hooks/useOperationsData';
import { supabase } from '@/lib/supabase/client';
import { formatDate } from '@/utils/helpers';

type NotificationStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'skipped';

interface NotificationRow {
  id: string;
  assignment_id: string;
  recipient_email: string | null;
  status: NotificationStatus;
  attempt_count: number;
  last_error: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  order: { order_number: string; client_name: string } | { order_number: string; client_name: string }[] | null;
}

interface FeedbackRow {
  assignment_id: string;
  rating: number;
  review: string | null;
  submitted_at: string;
}

const statusStyles: Record<NotificationStatus, string> = {
  pending: 'border-warning/30 bg-warning/10 text-warning-foreground',
  sending: 'border-info/30 bg-info/10 text-info-foreground',
  sent: 'border-success/30 bg-success/10 text-success-foreground',
  failed: 'border-danger/30 bg-danger/10 text-danger-foreground',
  skipped: 'border-border bg-muted text-muted-foreground',
};

function getOrder(row: NotificationRow) {
  return Array.isArray(row.order) ? row.order[0] : row.order;
}

export default function CustomerFeedbackPage() {
  const { user, loading: authLoading } = useAuth();
  const { assignments, drivers } = useOperationsData();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const isStaff = user?.role === 'admin' || user?.role === 'supervisor';

  const loadData = useCallback(async () => {
    if (!isStaff) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const [notificationResult, feedbackResult] = await Promise.all([
      supabase
        .from('delivery_feedback_notifications')
        .select('id, assignment_id, recipient_email, status, attempt_count, last_error, sent_at, created_at, updated_at, order:orders(order_number, client_name)')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('delivery_feedback')
        .select('assignment_id, rating, review, submitted_at')
        .order('submitted_at', { ascending: false })
        .limit(200),
    ]);

    if (notificationResult.error || feedbackResult.error) {
      setError(notificationResult.error?.message || feedbackResult.error?.message || 'Unable to load customer feedback records.');
      setNotifications([]);
      setFeedback([]);
    } else {
      setNotifications((notificationResult.data ?? []) as NotificationRow[]);
      setFeedback((feedbackResult.data ?? []) as FeedbackRow[]);
    }
    setLoading(false);
  }, [isStaff]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const feedbackByAssignment = useMemo(
    () => new Map(feedback.map((row) => [row.assignment_id, row])),
    [feedback],
  );
  const averageRating = feedback.length
    ? feedback.reduce((total, row) => total + row.rating, 0) / feedback.length
    : 0;
  const failedCount = notifications.filter((row) => row.status === 'failed').length;
  const pendingCount = notifications.filter((row) => row.status === 'pending' || row.status === 'sending').length;

  const retryNotification = async (assignmentId: string, notificationId: string) => {
    setRetryingId(notificationId);
    setNotice('');
    setError('');
    try {
      const response = await fetch('/api/customer-feedback/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment_id: assignmentId, retry: true }),
      });
      const result = await response.json() as { status?: string; error?: string };
      if (!response.ok || result.status !== 'sent') {
        throw new Error(result.error || 'The customer email could not be sent.');
      }
      setNotice('Customer email sent successfully.');
      await loadData();
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : 'The customer email could not be sent.');
    } finally {
      setRetryingId(null);
    }
  };

  if (authLoading || loading) {
    return <main className="mx-auto max-w-7xl space-y-4 px-4 py-8 text-foreground sm:px-6"><div className="h-10 w-64 animate-pulse rounded-lg bg-muted" /><div className="h-36 animate-pulse rounded-xl bg-muted" /></main>;
  }

  if (!isStaff) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 text-foreground sm:px-6">
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-6">
          <h1 className="text-xl font-semibold">Access restricted</h1>
          <p className="mt-2 text-sm text-muted-foreground">Customer feedback operations are available to administrators and supervisors.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Delivery quality</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Customer feedback</h1>
          <p className="mt-2 text-sm text-muted-foreground">Track delivery emails, proof follow-up, and customer ratings.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadData()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </header>

      {error && <div role="alert" className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger-foreground"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
      {notice && <div role="status" className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-4 text-sm text-success-foreground"><CheckCircle2 className="h-4 w-4" />{notice}</div>}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Feedback summary">
        <SummaryCard icon={<MessageSquare className="h-5 w-5" />} label="Completed deliveries" value={notifications.length} />
        <SummaryCard icon={<Clock3 className="h-5 w-5" />} label="Email pending" value={pendingCount} />
        <SummaryCard icon={<AlertCircle className="h-5 w-5" />} label="Email failed" value={failedCount} />
        <SummaryCard icon={<Star className="h-5 w-5" />} label="Average rating" value={feedback.length ? `${averageRating.toFixed(1)} / 5` : 'No ratings'} />
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-4 sm:px-6">
          <h2 className="font-semibold">Delivery email and feedback history</h2>
          <p className="mt-1 text-xs text-muted-foreground">Only orders with recorded customer consent are emailed.</p>
        </div>
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No delivery notification records yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((row) => {
              const order = getOrder(row);
              const rating = feedbackByAssignment.get(row.assignment_id);
              const assignment = assignments.find((item) => item.id === row.assignment_id);
              const driver = drivers.find((item) => item.id === assignment?.personnel_id);
              const staleSending = row.status === 'sending' && Date.now() - new Date(row.updated_at).getTime() > 10 * 60 * 1000;
              return (
                <article key={row.id} className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/assignments/${row.assignment_id}`} className="font-semibold text-primary hover:underline">
                        {order?.order_number || 'Delivery'}
                      </Link>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[row.status]}`}>
                        {row.status}
                      </span>
                      {rating && <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning-foreground"><Star className="h-3.5 w-3.5 fill-current" />{rating.rating}/5</span>}
                    </div>
                    <p className="mt-1 truncate text-sm font-medium">{order?.client_name || 'Customer'}</p>
                    <p className="truncate text-xs text-muted-foreground">{row.recipient_email || 'No email recorded'} · Driver: {driver?.full_name || 'Unknown'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.status === 'sent' && row.sent_at
                        ? `Email sent ${formatDate(row.sent_at)}`
                        : `Created ${formatDate(row.created_at)} · ${row.attempt_count} attempt${row.attempt_count === 1 ? '' : 's'}`}
                    </p>
                    {row.last_error && <p className="mt-2 text-xs text-danger-foreground">{row.last_error}</p>}
                    {rating?.review && <blockquote className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-sm leading-6">“{rating.review}”</blockquote>}
                    {rating && <p className="mt-2 text-xs text-muted-foreground">Feedback submitted {formatDate(rating.submitted_at)}</p>}
                  </div>
                  {(row.status === 'failed' || row.status === 'pending' || staleSending) && (
                    <button
                      type="button"
                      disabled={retryingId === row.id}
                      onClick={() => void retryNotification(row.assignment_id, row.id)}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RefreshCw className={`h-4 w-4 ${retryingId === row.id ? 'animate-spin' : ''}`} />
                      {retryingId === row.id ? 'Sending…' : row.status === 'pending' ? 'Send email' : 'Retry email'}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-sm">{label}</span>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
