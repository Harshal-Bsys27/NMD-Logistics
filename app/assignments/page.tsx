'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { assignmentService } from '@/services/database';
import { useOperationsData } from '@/hooks/useOperationsData';
import { useAuth } from '@/hooks';
import { formatDate } from '@/utils/helpers';
import { Clock, AlertCircle, CheckCircle2, MapPin, Phone, Truck, UserRound } from 'lucide-react';

import type { AssignmentStatus } from '@/types';

export default function AssignmentsPage() {
  const { user } = useAuth();
  const { assignments, orders, drivers, isLoading, error, refresh } = useOperationsData();
  const [selectedStatus, setSelectedStatus] = useState<AssignmentStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyAssignmentId, setBusyAssignmentId] = useState<string | null>(null);
  const isDriver = user?.role === 'delivery_personnel';
  const driverProfile = isDriver ? drivers.find((driver) => driver.user_id === user.id) : undefined;
  const visibleAssignments = useMemo(
    () => isDriver
      ? assignments.filter((assignment) => assignment.personnel_id === driverProfile?.id)
      : assignments,
    [assignments, driverProfile?.id, isDriver]
  );

  const filteredAssignments = useMemo(() => {
    return visibleAssignments.filter((assignment) => {
      const matchesStatus = selectedStatus === 'all' || assignment.status === selectedStatus;
      const order = orders.find((item) => item.id === assignment.order_id);
      const driver = drivers.find((item) => item.id === assignment.personnel_id);
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        !search ||
        assignment.id.toLowerCase().includes(search) ||
        order?.order_number.toLowerCase().includes(search) ||
        order?.client_name.toLowerCase().includes(search) ||
        driver?.full_name?.toLowerCase().includes(search) ||
        driver?.employee_id.toLowerCase().includes(search);
      return matchesStatus && matchesSearch;
    });
  }, [visibleAssignments, orders, drivers, selectedStatus, searchTerm]);

  const getOrderInfo = (orderId: string) => orders.find((o) => o.id === orderId);
  const getDriverInfo = (driverId: string) => drivers.find((d) => d.id === driverId);

  const statusBadgeColors: Record<AssignmentStatus, string> = {
    pending: 'bg-warning text-warning-foreground',
    accepted: 'bg-info text-info-foreground',
    rejected: 'bg-danger text-danger-foreground',
    in_progress: 'bg-info text-info-foreground',
    completed: 'bg-success text-success-foreground',
    cancelled: 'bg-muted text-muted-foreground',
  };

  const statusCounts = {
    all: visibleAssignments.length,
    pending: visibleAssignments.filter((a) => a.status === 'pending').length,
    accepted: visibleAssignments.filter((a) => a.status === 'accepted').length,
    in_progress: visibleAssignments.filter((a) => a.status === 'in_progress').length,
    completed: visibleAssignments.filter((a) => a.status === 'completed').length,
  };

  const handleStatusUpdate = async (assignmentId: string, status: AssignmentStatus) => {
    setBusyAssignmentId(assignmentId);
    setActionError('');
    try {
      const result = await assignmentService.updateStatus(assignmentId, status);
      if (result.error) throw new Error(result.error);
      await refresh(true);
    } catch (updateError) {
      setActionError(updateError instanceof Error ? updateError.message : 'Unable to update assignment');
    } finally {
      setBusyAssignmentId(null);
    }
  };

  return (
    <div className="min-w-0 bg-background text-foreground">
      <div className="w-full min-w-0 space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{isDriver ? 'Driver workspace' : 'Operations'}</p>
            <h1 className="mt-1 break-words text-2xl font-semibold text-foreground sm:text-3xl">{isDriver ? `Welcome, ${user?.full_name?.trim().split(/\s+/)[0] || 'Driver'}` : 'Driver Assignments'}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{isDriver ? 'Your deliveries, vehicle details, and progress in one place.' : 'Track and manage delivery assignments.'}</p>
          </div>
          {isDriver && (
            <Link href="/settings" className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto">
              <UserRound className="h-4 w-4" />
              My profile
            </Link>
          )}
        </div>

        {isDriver && !isLoading && !driverProfile && (
          <div role="alert" className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning-foreground">
            Your driver profile is not available yet. Contact your administrator so they can finish setting up your driver record.
          </div>
        )}

        {isDriver && driverProfile && (
          <>
            <section aria-label="Driver profile summary" className="grid gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
              <div className="flex min-w-0 items-center gap-3 sm:col-span-2 lg:col-span-1">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{user?.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">Employee ID: {driverProfile.employee_id}</p>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-3 rounded-lg bg-background/70 p-3">
                <Truck className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Vehicle</p>
                  <p className="truncate text-sm font-semibold capitalize text-foreground">{driverProfile.vehicle_type} · {driverProfile.vehicle_number}</p>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-3 rounded-lg bg-background/70 p-3">
                <Phone className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Contact number</p>
                  <p className="truncate text-sm font-semibold text-foreground">{user?.phone || 'Add your phone number in your account details'}</p>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-3 rounded-lg bg-background/70 p-3">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${driverProfile.current_status === 'available' ? 'bg-success' : driverProfile.current_status === 'on_delivery' ? 'bg-info' : 'bg-muted-foreground'}`} />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Current status</p>
                  <p className="truncate text-sm font-semibold capitalize text-foreground">{driverProfile.current_status.replace(/_/g, ' ')}</p>
                </div>
              </div>
            </section>

            <section aria-label="Driver activity" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="surface-glass min-w-0 rounded-xl border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active deliveries</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-info-foreground">{statusCounts.pending + statusCounts.accepted + statusCounts.in_progress}</p>
              </div>
              <div className="surface-glass min-w-0 rounded-xl border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Completed</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-success-foreground">{driverProfile.total_deliveries_completed}</p>
              </div>
              <div className="surface-glass col-span-2 min-w-0 rounded-xl border border-border p-4 sm:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your rating</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-warning-foreground">{driverProfile.rating > 0 ? `${driverProfile.rating.toFixed(1)} / 5` : 'New driver'}</p>
              </div>
            </section>
          </>
        )}

        {/* Status Filter Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:gap-3" aria-label="Filter assignments by status">
          {(['all', 'pending', 'accepted', 'in_progress', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`min-h-11 shrink-0 rounded-lg px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4 ${
                selectedStatus === status
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-background text-foreground hover:bg-muted'
              }`}
            >
              {isDriver && status === 'all' ? 'All deliveries' : isDriver && status === 'pending' ? 'New' : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')} ({statusCounts[status]})
            </button>
          ))}
        </div>

        {/* Search Bar */}
        {!isDriver && (
          <div className="flex gap-3">
            <div className="surface-glass min-h-11 flex-1 rounded-lg border border-border px-4 py-2.5">
              <input
                type="text"
                placeholder="Search by order, driver, or assignment ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        )}

        {(error || actionError) && (
          <div role="alert" className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/10 p-4 text-danger-foreground">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
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

        {/* Assignments List */}
        <div className="min-w-0 space-y-4">
          {isLoading ? (
            <div className="surface-glass rounded-lg border border-border p-8 text-center text-muted-foreground" aria-live="polite">
              Loading assignments…
            </div>
          ) : filteredAssignments.length > 0 ? (
            filteredAssignments.map((assignment) => {
              const order = getOrderInfo(assignment.order_id);
              const driver = getDriverInfo(assignment.personnel_id);

              return (
                <div key={assignment.id} className="surface-glass min-w-0 rounded-lg border border-border p-4 transition hover:border-ring/50 sm:p-5">
                    <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    {/* Main Info */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                        <Link href={`/assignments/${assignment.id}`} className="break-words text-base font-semibold text-foreground hover:text-primary sm:text-lg">
                          {isDriver
                            ? `${order?.order_number || 'Delivery'}${order?.client_name ? ` · ${order.client_name}` : ''}`
                            : `${order?.order_number || 'Order'} → ${driver?.full_name || driver?.employee_id || 'Driver'}`}
                        </Link>
                        <span className={`inline-flex min-h-6 items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeColors[assignment.status]}`}>
                          {assignment.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Order & Driver Details */}
                      <div className="mb-3 grid min-w-0 gap-3 sm:grid-cols-2">
                        <div className="min-w-0 rounded-md bg-muted/50 p-3">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">{isDriver ? 'Delivery details' : 'Order details'}</p>
                          <p className="mt-1 break-words text-sm text-foreground">{order?.package_description || 'Package details unavailable'}</p>
                          {isDriver ? (
                            <div className="mt-3 grid gap-2">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Pickup</p>
                                <p className="mt-1 flex items-start gap-1 break-words text-xs text-foreground">
                                  <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                                  {order?.pickup_location || 'Pickup location unavailable'}
                                </p>
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Delivery</p>
                                <p className="mt-1 flex items-start gap-1 break-words text-xs text-foreground">
                                  <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                                  {order?.delivery_location || 'Delivery location unavailable'}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-1 flex items-start gap-1 break-words text-xs text-muted-foreground">
                              <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                              {order?.delivery_location}
                            </p>
                          )}
                        </div>

                        <div className="min-w-0 rounded-md bg-muted/50 p-3">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">{isDriver ? 'Customer' : 'Driver'}</p>
                          <p className="mt-1 break-words text-sm text-foreground">
                            {isDriver ? order?.client_name || 'Customer details unavailable' : driver?.full_name || driver?.employee_id}
                          </p>
                          {isDriver && order?.client_phone ? (
                            <a className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline" href={`tel:${order.client_phone}`}>
                              <Phone className="h-4 w-4 shrink-0" />
                              {order.client_phone}
                            </a>
                          ) : !isDriver && driver?.full_name ? (
                            <p className="mt-1 text-xs text-muted-foreground">ID: {driver.employee_id}</p>
                          ) : null}
                          {!isDriver && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {driver && (driver.vehicle_type.charAt(0).toUpperCase() + driver.vehicle_type.slice(1))} •{' '}
                              {driver?.vehicle_number}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Assignment Notes */}
                      {assignment.notes && (
                        <div className="mb-3 rounded-md border border-border bg-muted/50 p-3">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">Notes</p>
                          <p className="mt-1 text-sm text-foreground">{assignment.notes}</p>
                        </div>
                      )}

                      {/* Timeline */}
                      <div className="flex flex-wrap gap-3 text-xs">
                        {assignment.assigned_at && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Assigned: {formatDate(assignment.assigned_at, 'short')}
                          </div>
                        )}
                        {assignment.accepted_at && (
                          <div className="flex items-center gap-1 text-success-foreground">
                            <CheckCircle2 className="h-3 w-3" />
                            Accepted: {formatDate(assignment.accepted_at, 'short')}
                          </div>
                        )}
                        {assignment.started_at && (
                          <div className="flex items-center gap-1 text-info-foreground">
                            <AlertCircle className="h-3 w-3" />
                            Started: {formatDate(assignment.started_at, 'short')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center lg:flex-col lg:items-end">
                      <div className="flex min-h-16 flex-1 items-center justify-between gap-4 rounded-md border border-border bg-muted/40 px-4 py-2 text-left sm:flex-col sm:justify-center sm:gap-0 sm:text-center lg:min-w-[150px]">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Est. Duration</p>
                        <p className="text-2xl font-bold tabular-nums text-info-foreground">
                          {assignment.estimated_duration_minutes}
                          <span className="ml-1 text-xs font-normal text-muted-foreground">min</span>
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {assignment.status === 'pending' && (
                          <button
                            onClick={(event) => {
                              event.preventDefault();
                              void handleStatusUpdate(assignment.id, 'accepted');
                            }}
                            disabled={busyAssignmentId === assignment.id}
                            className="min-h-11 rounded-md bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground disabled:opacity-50"
                          >
                            Accept
                          </button>
                        )}
                        {assignment.status === 'accepted' && (
                          <button
                            onClick={(event) => {
                              event.preventDefault();
                              void handleStatusUpdate(assignment.id, 'in_progress');
                            }}
                            disabled={busyAssignmentId === assignment.id}
                            className="min-h-11 rounded-md bg-info px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-info-foreground disabled:opacity-50"
                          >
                            Start
                          </button>
                        )}
                        {assignment.status === 'in_progress' && (
                          <button
                            onClick={(event) => {
                              event.preventDefault();
                              void handleStatusUpdate(assignment.id, 'completed');
                            }}
                            disabled={busyAssignmentId === assignment.id}
                            className="min-h-11 rounded-md bg-success px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-success-foreground disabled:opacity-50"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : isDriver && visibleAssignments.length === 0 && driverProfile ? (
            <div className="surface-glass rounded-xl border border-dashed border-border p-6 text-center sm:p-10">
              <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Truck className="h-7 w-7" /></span>
              <h2 className="mt-4 text-lg font-semibold text-foreground">You’re ready for your first delivery</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">No deliveries have been assigned to you yet. Your dispatcher will add a delivery here when it’s ready. Once assigned, review the route, accept the job, and update its progress from this page.</p>
              <div className="mx-auto mt-5 grid max-w-xl gap-2 text-left sm:grid-cols-3">
                {[
                  ['1', 'Review', 'Check pickup and delivery details'],
                  ['2', 'Accept', 'Confirm you can take the delivery'],
                  ['3', 'Update', 'Start the route and mark it complete'],
                ].map(([step, title, description]) => (
                  <div key={step} className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs font-bold text-primary">STEP {step}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => void refresh(true)} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Refresh deliveries
              </button>
            </div>
          ) : (
            <div className="surface-glass rounded-lg border border-border p-8 text-center">
              <p className="text-muted-foreground">{isDriver ? `No ${selectedStatus === 'all' ? '' : `${selectedStatus.replace('_', ' ')} `}deliveries match this filter.` : 'No assignments found.'}</p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {!isDriver && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="surface-glass h-full rounded-lg border border-border p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Assignments</p>
              <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">{assignments.length}</p>
            </div>
            <div className="surface-glass h-full rounded-lg border border-border p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">In Progress</p>
              <p className="mt-3 text-3xl font-bold tabular-nums text-info-foreground">
                {assignments.filter((a) => a.status === 'in_progress').length}
              </p>
            </div>
            <div className="surface-glass h-full rounded-lg border border-border p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Completed</p>
              <p className="mt-3 text-3xl font-bold tabular-nums text-success-foreground">
                {assignments.filter((a) => a.status === 'completed').length}
              </p>
            </div>
            <div className="surface-glass h-full rounded-lg border border-border p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Pending</p>
              <p className="mt-3 text-3xl font-bold tabular-nums text-warning-foreground">
                {assignments.filter((a) => a.status === 'pending').length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
