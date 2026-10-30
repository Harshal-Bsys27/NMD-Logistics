'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, BellRing, CheckCircle2, Clock3, MapPin, Route, Truck } from 'lucide-react';
import { assignmentService } from '@/services/database';
import { useOperationsData } from '@/hooks/useOperationsData';
import { cn } from '@/utils/helpers';

type DispatchFilter = 'all' | 'queued' | 'on_route' | 'delayed';

export default function DispatchPage() {
  const { assignments, orders, drivers, isLoading, error, refresh } = useOperationsData();
  const [filter, setFilter] = useState<DispatchFilter>('all');
  const [actionError, setActionError] = useState('');
  const [busyAssignmentId, setBusyAssignmentId] = useState<string | null>(null);

  const dispatcherData = useMemo(() => {
    return assignments
      .filter((assignment) => assignment.status !== 'cancelled' && assignment.status !== 'rejected')
      .map((assignment) => {
        const order = orders.find((item) => item.id === assignment.order_id);
        const driver = drivers.find((person) => person.id === assignment.personnel_id);

        const status =
          assignment.status === 'completed'
            ? 'completed'
            : assignment.status === 'in_progress'
              ? 'on_route'
              : 'queued';

        const estimatedArrival = assignment.started_at && assignment.estimated_duration_minutes
          ? new Date(new Date(assignment.started_at).getTime() + assignment.estimated_duration_minutes * 60_000)
          : null;
        const delay = assignment.status === 'in_progress' && estimatedArrival
          ? Math.max(0, Math.ceil((Date.now() - estimatedArrival.getTime()) / 60_000))
          : 0;
        const eta = assignment.status === 'completed'
          ? 'Delivered'
          : estimatedArrival
            ? delay > 0
              ? `${delay} min overdue`
              : `${Math.ceil((estimatedArrival.getTime() - Date.now()) / 60_000)} min remaining`
            : assignment.status === 'pending'
              ? 'Awaiting driver'
              : 'Awaiting start';

        return {
          ...assignment,
          assignmentStatus: assignment.status,
          orderNumber: order?.order_number ?? assignment.order_id.slice(0, 6).toUpperCase(),
          customer: order?.client_name ?? 'Customer',
          route: order?.pickup_location ?? 'Metro route',
          driverName: driver ? `${driver.full_name || driver.employee_id} (${driver.employee_id})` : 'Unassigned',
          eta,
          delay,
          status,
        };
      })
      .sort((a, b) => Number(a.delay > b.delay) - Number(a.delay < b.delay));
  }, [assignments, drivers, orders]);

  const visibleAssignments = useMemo(() => {
    if (filter === 'all') return dispatcherData;
    return dispatcherData.filter((item) => item.status === filter || (filter === 'delayed' && item.delay > 0));
  }, [dispatcherData, filter]);

  const summary = useMemo(() => {
    const activeRoutes = dispatcherData.filter((item) => item.status === 'on_route').length;
    const queued = dispatcherData.filter((item) => item.status === 'queued').length;
    const delayed = dispatcherData.filter((item) => item.delay > 0).length;
    const complete = dispatcherData.filter((item) => item.status === 'completed').length;

    return {
      activeRoutes,
      queued,
      delayed,
      complete,
    };
  }, [dispatcherData]);

  const alerts = useMemo(() => {
    const dueSoon = dispatcherData.filter((item) => item.status === 'queued').length;
    const activeDrivers = drivers.filter((driver) => driver.current_status === 'on_delivery').length;

    return [
      { title: 'Assignments awaiting dispatch', count: dueSoon, level: 'High', accent: 'border-danger bg-danger/5', badge: 'bg-danger/10 text-danger-foreground' },
      { title: 'Routes under watch', count: delayedCount(dispatcherData), level: 'Medium', accent: 'border-warning bg-warning/5', badge: 'bg-warning/10 text-warning-foreground' },
      { title: 'Drivers on active delivery', count: activeDrivers, level: 'Low', accent: 'border-success bg-success/5', badge: 'bg-success/10 text-success-foreground' },
    ];
  }, [dispatcherData, drivers]);

  const handleStatusUpdate = async (assignmentId: string, status: 'accepted' | 'in_progress' | 'completed') => {
    setBusyAssignmentId(assignmentId);
    setActionError('');
    try {
      const result = await assignmentService.updateStatus(assignmentId, status);
      if (result.error) throw new Error(result.error);
      await refresh(true);
    } catch (updateError) {
      setActionError(updateError instanceof Error ? updateError.message : 'Unable to update dispatch status');
    } finally {
      setBusyAssignmentId(null);
    }
  };

  return (
    <div className="bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="space-y-6">
        <header className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Operations / Dispatch</p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">Dispatch board</h1>
            <p className="mt-2 text-sm text-muted-foreground">Manage active routes, exceptions, and handoff timing in one place.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <BellRing className="h-3.5 w-3.5 text-primary" />
            {summary.delayed} route alerts
          </div>
        </header>

        {(error || actionError) && (
          <div role="alert" className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/10 p-4 text-danger-foreground">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1 text-sm">
              <p>{error || actionError}</p>
              {error && (
                <button type="button" onClick={() => void refresh()} className="mt-2 font-semibold underline">
                  Try again
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Active routes', value: summary.activeRoutes, icon: Route, tone: 'bg-primary/10 text-primary' },
            { label: 'Queued work', value: summary.queued, icon: Clock3, tone: 'bg-warning/10 text-warning-foreground' },
            { label: 'Delayed', value: summary.delayed, icon: AlertTriangle, tone: 'bg-danger/10 text-danger-foreground' },
            { label: 'Completed', value: summary.complete, icon: CheckCircle2, tone: 'bg-success/10 text-success-foreground' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="surface-glass rounded-xl border border-border p-4">
                <div className={cn('mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg', stat.tone)}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{stat.label}</p>
                <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
          <section className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Live route queue</h2>
                <p className="mt-1 text-sm text-muted-foreground">Current dispatch operations and exceptions.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['all', 'queued', 'on_route', 'delayed'] as DispatchFilter[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFilter(option)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] transition',
                      filter === option
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {option === 'all' ? 'All' : option === 'on_route' ? 'On route' : option === 'queued' ? 'Queued' : 'Delayed'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="surface-glass rounded-xl border border-border p-8 text-center text-muted-foreground" aria-live="polite">
                  Loading dispatch data…
                </div>
              ) : visibleAssignments.length === 0 ? (
                <div className="surface-glass rounded-xl border border-border p-8 text-center text-muted-foreground">
                  No assignments match this view.
                </div>
              ) : visibleAssignments.map((assignment) => (
                <div key={assignment.id} className="surface-glass rounded-xl border border-border p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-foreground">{assignment.orderNumber}</p>
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]', assignment.delay > 0 ? 'bg-danger/10 text-danger-foreground' : 'bg-muted text-muted-foreground')}>
                          {assignment.delay > 0
                            ? 'Delayed'
                            : assignment.status === 'on_route'
                              ? 'On route'
                              : assignment.status === 'queued'
                                ? assignment.assignmentStatus === 'accepted' ? 'Accepted' : 'Queued'
                                : 'Completed'}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {assignment.route}</span>
                        <span className="inline-flex items-center gap-2"><Truck className="h-4 w-4" /> {assignment.driverName}</span>
                        <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" /> ETA {assignment.eta}</span>
                      </div>

                      <p className="mt-3 text-sm text-muted-foreground">Customer: {assignment.customer}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {assignment.status !== 'completed' && (
                        <>
                          {assignment.assignmentStatus === 'pending' && (
                            <button
                              type="button"
                              onClick={() => void handleStatusUpdate(assignment.id, 'accepted')}
                              disabled={busyAssignmentId === assignment.id}
                              className="rounded-md bg-primary px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground"
                            >
                              Accept
                            </button>
                          )}
                          {assignment.assignmentStatus === 'accepted' && (
                            <button
                              type="button"
                              onClick={() => void handleStatusUpdate(assignment.id, 'in_progress')}
                              disabled={busyAssignmentId === assignment.id}
                              className="rounded-lg bg-info px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-950 transition-colors hover:bg-info/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              Start
                            </button>
                          )}
                          {assignment.assignmentStatus === 'in_progress' && (
                            <button
                              type="button"
                              onClick={() => void handleStatusUpdate(assignment.id, 'completed')}
                              disabled={busyAssignmentId === assignment.id}
                              className="rounded-lg bg-success px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-950 transition-colors hover:bg-success/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              Complete
                            </button>
                          )}
                        </>
                      )}

                      <Link href={`/assignments/${assignment.id}`} className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-foreground transition hover:bg-muted">
                        Details <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-5">
            <div className="surface-glass rounded-xl border border-border p-4">
              <h3 className="text-lg font-semibold text-foreground">Priority alerts</h3>
              <div className="mt-4 space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.title} className={cn('rounded-md border border-l-4 bg-muted/30 p-3', alert.accent)}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{alert.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{alert.count} {alert.count === 1 ? 'item' : 'items'} in queue</p>
                      </div>
                      <span className={cn('inline-flex min-h-6 items-center rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]', alert.badge)}>
                        {alert.level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-glass rounded-xl border border-border p-4">
              <h3 className="text-lg font-semibold text-foreground">Dispatch notes</h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-primary" /> Prioritize high-value and time-sensitive orders first.</li>
                <li className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-warning" /> Re-balance drivers from queued items to delayed routes.</li>
                <li className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-success" /> Complete deliveries to free capacity before the next dispatch wave.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function delayedCount(items: { delay: number }[]) {
  return items.filter((item) => item.delay > 0).length;
}
