'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { assignmentService, driverService } from '@/services/database';
import { useOperationsData } from '@/hooks/useOperationsData';
import { useAuth } from '@/hooks';
import { formatDate } from '@/utils/helpers';
import { Activity, Clock, AlertCircle, CheckCircle2, Download, MapPin, PackageCheck, Phone, RefreshCw, Truck, UserRound, X } from 'lucide-react';

import type { AssignmentStatus, PersonnelStatus } from '@/types';

export default function AssignmentsPage() {
  const { user } = useAuth();
  const { assignments, orders, drivers, isLoading, error, realtimeStatus, refresh } = useOperationsData();
  const [selectedStatus, setSelectedStatus] = useState<AssignmentStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionError, setActionError] = useState('');
  const [availabilityHistory, setAvailabilityHistory] = useState<Array<{
    id: string;
    previous_status: PersonnelStatus;
    new_status: PersonnelStatus;
    changed_at: string;
  }>>([]);
  const [availabilityHistoryError, setAvailabilityHistoryError] = useState('');
  const [busyAssignmentId, setBusyAssignmentId] = useState<string | null>(null);
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const isDriver = user?.role === 'delivery_personnel';
  const driverProfile = isDriver ? drivers.find((driver) => driver.user_id === user.id) : undefined;
  const driverProfileId = driverProfile?.id;
  const driverProfileStatus = driverProfile?.current_status;

  useEffect(() => {
    if (isDriver) void refresh(true);
  }, [isDriver, refresh]);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [user?.avatar_url]);

  useEffect(() => {
    if (!isDriver || !driverProfileId) {
      setAvailabilityHistory([]);
      setAvailabilityHistoryError('');
      return;
    }

    let active = true;
    void driverService.getAvailabilityHistory(driverProfileId).then((result) => {
      if (!active) return;
      setAvailabilityHistory(result.data);
      setAvailabilityHistoryError(result.error ?? '');
    });

    return () => {
      active = false;
    };
  }, [driverProfileId, driverProfileStatus, isDriver]);

  const visibleAssignments = useMemo(
    () => isDriver
      ? assignments.filter((assignment) => assignment.personnel_id === driverProfile?.id)
      : assignments,
    [assignments, driverProfile?.id, isDriver]
  );
  const activeDriverAssignment = visibleAssignments.find((assignment) => assignment.status === 'in_progress')
    ?? visibleAssignments.find((assignment) => ['pending', 'accepted'].includes(assignment.status));
  const hasActiveDriverAssignment = Boolean(activeDriverAssignment);
  const displayedDriverStatus = activeDriverAssignment
    ? activeDriverAssignment.status === 'in_progress' ? 'on_delivery' : 'assigned'
    : driverProfile?.current_status;
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredAssignments = useMemo(() => {
    return visibleAssignments.filter((assignment) => {
      const matchesStatus = selectedStatus === 'all' || assignment.status === selectedStatus;
      const order = orders.find((item) => item.id === assignment.order_id);
      const driver = drivers.find((item) => item.id === assignment.personnel_id);
      const matchesSearch =
        !normalizedSearchTerm ||
        assignment.id.toLowerCase().includes(normalizedSearchTerm) ||
        order?.order_number.toLowerCase().includes(normalizedSearchTerm) ||
        order?.client_name.toLowerCase().includes(normalizedSearchTerm) ||
        driver?.full_name?.toLowerCase().includes(normalizedSearchTerm) ||
        driver?.employee_id.toLowerCase().includes(normalizedSearchTerm);
      return matchesStatus && matchesSearch;
    });
  }, [visibleAssignments, orders, drivers, selectedStatus, normalizedSearchTerm]);

  const getOrderInfo = (orderId: string) => orders.find((o) => o.id === orderId);
  const getDriverInfo = (driverId: string) => drivers.find((d) => d.id === driverId);

  const statusBadgeColors: Record<AssignmentStatus, string> = {
    pending: 'border border-warning/25 bg-warning/15 text-warning-foreground dark:border-warning/30 dark:bg-warning/15',
    accepted: 'border border-info/25 bg-info/15 text-info-foreground dark:border-info/30 dark:bg-info/15',
    rejected: 'border border-danger/25 bg-danger/15 text-danger-foreground dark:border-danger/30 dark:bg-danger/15',
    in_progress: 'border border-info/25 bg-info/15 text-info-foreground dark:border-info/30 dark:bg-info/15',
    completed: 'border border-success/25 bg-success/15 text-success-foreground dark:border-success/30 dark:bg-success/15',
    cancelled: 'border border-border bg-muted text-muted-foreground dark:bg-muted/80',
  };
  const statusAccentColors: Record<AssignmentStatus, string> = {
    pending: 'border-l-warning',
    accepted: 'border-l-info',
    rejected: 'border-l-danger',
    in_progress: 'border-l-info',
    completed: 'border-l-success',
    cancelled: 'border-l-muted-foreground',
  };

  const statusCounts = {
    all: visibleAssignments.length,
    pending: visibleAssignments.filter((a) => a.status === 'pending').length,
    accepted: visibleAssignments.filter((a) => a.status === 'accepted').length,
    in_progress: visibleAssignments.filter((a) => a.status === 'in_progress').length,
    completed: visibleAssignments.filter((a) => a.status === 'completed').length,
  };
  const completedDeliveryCount = driverProfile
    ? Math.max(driverProfile.total_deliveries_completed, statusCounts.completed)
    : 0;

  const exportAssignments = () => {
    const escapeCell = (value: string | number | undefined) => {
      const text = String(value ?? '');
      const safeText = /^[\t\r ]*[=+\-@]/.test(text) ? `'${text}` : text;
      return `"${safeText.replace(/"/g, '""')}"`;
    };
    const headers = [
      'Order number',
      'Customer',
      'Customer phone',
      'Driver',
      'Employee ID',
      'Status',
      'Assigned at',
      'Accepted at',
      'Started at',
      'Completed at',
      'Estimated duration (minutes)',
      'Actual duration (minutes)',
      'Notes',
    ];
    const rows = filteredAssignments.map((assignment) => {
      const order = getOrderInfo(assignment.order_id);
      const driver = getDriverInfo(assignment.personnel_id);
      return [
        order?.order_number || assignment.order_id,
        order?.client_name,
        order?.client_phone,
        driver?.full_name || driver?.employee_id,
        driver?.employee_id,
        assignment.status.replace(/_/g, ' '),
        assignment.assigned_at ? formatDate(assignment.assigned_at, 'short') : '',
        assignment.accepted_at ? formatDate(assignment.accepted_at, 'short') : '',
        assignment.started_at ? formatDate(assignment.started_at, 'short') : '',
        assignment.completed_at ? formatDate(assignment.completed_at, 'short') : '',
        assignment.estimated_duration_minutes,
        assignment.actual_duration_minutes,
        assignment.notes,
      ].map((value) => escapeCell(value));
    });
    const csv = `\uFEFF${[headers.map(escapeCell).join(','), ...rows.map((row) => row.join(','))].join('\r\n')}`;
    const downloadUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `nmd-assignments-${selectedStatus}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh(true);
    } finally {
      setIsRefreshing(false);
    }
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

  const handleAvailabilityChange = async (value: string) => {
    if (!driverProfile || (value !== 'available' && value !== 'on_break' && value !== 'off_duty')) return;
    setIsUpdatingAvailability(true);
    setActionError('');
    try {
      const result = await driverService.setMyAvailability(value as Exclude<PersonnelStatus, 'on_delivery'>);
      if (result.error) throw new Error(result.error);
      await refresh(true);
    } catch (updateError) {
      setActionError(updateError instanceof Error ? updateError.message : 'Unable to update your availability');
    } finally {
      setIsUpdatingAvailability(false);
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
            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:items-end">
              <div className="flex w-full gap-2 sm:w-auto">
                <button
                  type="button"
                  onClick={() => void handleRefresh()}
                  disabled={isRefreshing}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60 sm:flex-none"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <Link href="/settings" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none">
                  <UserRound className="h-4 w-4" />
                  My profile
                </Link>
              </div>
              <p className="text-xs text-muted-foreground" aria-live="polite">
                {realtimeStatus === 'live' ? 'Live updates enabled' : 'Updates sync when you refresh or return to this page'}
              </p>
            </div>
          )}
        </div>

        {isDriver && !isLoading && !driverProfile && (
          <div role="alert" className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning-foreground">
            Your driver profile is not available yet. Contact your administrator so they can finish setting up your driver record.
          </div>
        )}

        {isDriver && driverProfile && (
          <>
            <section aria-label="Driver profile summary" className="grid min-w-0 grid-cols-1 gap-3 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] via-background to-primary/[0.03] p-3 shadow-sm sm:grid-cols-2 sm:p-4 xl:grid-cols-12 xl:gap-4">
              <div className="flex min-h-[112px] min-w-0 items-center gap-4 rounded-xl border border-primary/10 bg-background/80 p-4 sm:col-span-2 sm:p-5 xl:col-span-4">
                <span className="inline-flex h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full border-[3px] border-background bg-primary/10 text-primary shadow-md ring-2 ring-primary/15">
                  {user?.avatar_url && !avatarLoadFailed ? (
                    <Image
                      src={user.avatar_url}
                      alt={`${user.full_name || 'Driver'} profile photo`}
                      width={72}
                      height={72}
                      unoptimized
                      onError={() => setAvatarLoadFailed(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <UserRound className="h-8 w-8" />
                    </span>
                  )}
                </span>
                <div className="min-w-0">
                  <p className="break-words text-lg font-bold leading-tight text-foreground sm:text-xl">{user?.full_name || driverProfile.full_name || 'Driver'}</p>
                  <p className="mt-1 break-all text-sm font-medium text-muted-foreground">Employee ID: {driverProfile.employee_id}</p>
                  <p className="mt-2 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">Delivery personnel</p>
                </div>
              </div>
              <div className="flex min-h-[96px] min-w-0 items-center gap-3 rounded-xl border border-border/60 bg-background/75 p-4 sm:p-5 xl:col-span-2">
                <Truck className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Vehicle</p>
                  <p className="mt-1 truncate text-sm font-semibold capitalize text-foreground">{driverProfile.vehicle_type} · {driverProfile.vehicle_number}</p>
                </div>
              </div>
              <div className="flex min-h-[96px] min-w-0 items-center gap-3 rounded-xl border border-border/60 bg-background/75 p-4 sm:p-5 xl:col-span-2">
                <Phone className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Contact number</p>
                  <p className="mt-1 truncate text-sm font-semibold text-foreground">{user?.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="min-w-0 rounded-xl border border-primary/20 bg-background/85 p-4 shadow-sm sm:col-span-2 sm:p-5 xl:col-span-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${displayedDriverStatus === 'available' ? 'bg-success' : displayedDriverStatus === 'on_delivery' ? 'bg-info' : displayedDriverStatus === 'assigned' ? 'bg-primary' : 'bg-warning'}`} />
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Current availability</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold capitalize text-primary">
                    {displayedDriverStatus?.replace(/_/g, ' ') ?? 'Unknown'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Choose whether dispatch can assign you new deliveries.</p>
                <label htmlFor="driver-availability" className="sr-only">Set your availability</label>
                <select
                  id="driver-availability"
                  value={driverProfile.current_status}
                  onChange={(event) => void handleAvailabilityChange(event.currentTarget.value)}
                  disabled={isLoading || isUpdatingAvailability || hasActiveDriverAssignment}
                  className="mt-3 min-h-12 w-full rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 [color-scheme:light] dark:[color-scheme:dark]"
                >
                  <option value="available">Available for assignments</option>
                  <option value="on_break">On break</option>
                  <option value="off_duty">Off duty</option>
                  {driverProfile.current_status === 'on_delivery' && (
                    <option value="on_delivery" disabled>On delivery · assignment managed</option>
                  )}
                </select>
                <p className="mt-2 text-xs leading-4 text-muted-foreground" aria-live="polite">
                  {isUpdatingAvailability
                    ? 'Updating availability…'
                    : hasActiveDriverAssignment
                      ? 'Finish or decline your active assignment before changing availability.'
                      : 'Dispatchers see your availability immediately.'}
                </p>
              </div>
            </section>

            <section aria-label="Recent availability changes" className="surface-glass rounded-xl border border-border p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Activity className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Availability history</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">Recent changes to your driver status</p>
                </div>
              </div>
              {availabilityHistoryError ? (
                <p role="status" className="mt-3 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                  Availability history will appear after the history migration is applied.
                </p>
              ) : availabilityHistory.length ? (
                <ol className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {availabilityHistory.map((entry) => (
                    <li key={entry.id} className="flex min-w-0 items-center gap-3 rounded-lg border border-border/70 bg-background/60 p-3">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${entry.new_status === 'available' ? 'bg-success' : entry.new_status === 'on_delivery' ? 'bg-info' : 'bg-warning'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold capitalize text-foreground">
                          {entry.previous_status.replace(/_/g, ' ')} <span className="text-muted-foreground">to</span> {entry.new_status.replace(/_/g, ' ')}
                        </p>
                        <time dateTime={entry.changed_at} className="mt-1 block text-[10px] text-muted-foreground">
                          {formatDate(entry.changed_at, 'short')}
                        </time>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">No availability changes recorded yet.</p>
              )}
            </section>

            <section aria-label="Driver activity" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="surface-glass min-w-0 rounded-xl border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active deliveries</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-info-foreground">{statusCounts.pending + statusCounts.accepted + statusCounts.in_progress}</p>
              </div>
              <div className="surface-glass min-w-0 rounded-xl border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Completed</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-success-foreground">{completedDeliveryCount}</p>
              </div>
              <div className="surface-glass col-span-2 min-w-0 rounded-xl border border-border p-4 sm:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer rating</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-warning-foreground">{driverProfile.rating > 0 ? `${driverProfile.rating.toFixed(1)} / 5` : 'Not rated yet'}</p>
              </div>
            </section>
          </>
        )}

        {/* Status Filter Buttons */}
        <section aria-label="Assignment status filters" className="surface-glass min-w-0 overflow-hidden rounded-xl border border-border p-3 sm:p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 sm:mb-3">
            <h2 className="text-sm font-semibold text-foreground">Filter assignments</h2>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs text-muted-foreground">{filteredAssignments.length} shown</span>
              <button
                type="button"
                onClick={exportAssignments}
                disabled={isLoading || filteredAssignments.length === 0}
                aria-label={`Export ${filteredAssignments.length} filtered assignments as CSV`}
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:px-3"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
          <div
            role="group"
            aria-label="Filter assignments by status"
            tabIndex={0}
            className="flex min-w-0 snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-wrap sm:overflow-visible"
          >
            {(['all', 'pending', 'accepted', 'in_progress', 'completed'] as const).map((status) => {
              const label = isDriver && status === 'all'
                ? 'All deliveries'
                : isDriver && status === 'pending'
                  ? 'New'
                  : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
              const isSelected = selectedStatus === status;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setSelectedStatus(status)}
                  aria-pressed={isSelected}
                  className={`inline-flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4 ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span>{label}</span>
                  <span className={`inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-xs tabular-nums ${
                    isSelected ? 'bg-primary-foreground/15 text-primary-foreground' : 'bg-muted text-foreground'
                  }`}>
                    {statusCounts[status]}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground sm:hidden">Swipe sideways to see every status.</p>
        </section>

        {/* Search Bar */}
        {!isDriver && (
          <div className="flex min-w-0 gap-3">
            <div className="surface-glass flex min-h-11 min-w-0 flex-1 items-center rounded-lg border border-border px-4">
              <input
                type="text"
                placeholder="Search by order, driver, or assignment ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search assignments"
                className="min-w-0 flex-1 bg-transparent py-2.5 text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear assignment search"
                  className="ml-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
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
              const statusLabel = assignment.status.replace(/_/g, ' ');

              return (
                <div key={assignment.id} className={`surface-glass min-w-0 overflow-hidden rounded-xl border border-border border-l-4 ${statusAccentColors[assignment.status]} p-2.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-ring/50 hover:shadow-lg dark:bg-card/95 dark:shadow-black/20 dark:hover:shadow-black/35 sm:p-4`}>
                    <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    {/* Main Info */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-gradient-to-r from-muted/90 via-muted/60 to-card px-3 py-2.5 dark:from-muted dark:via-muted/80 dark:to-card">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-background text-primary shadow-sm dark:border-primary/30 dark:bg-primary/15">
                            <PackageCheck className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <Link href={`/assignments/${assignment.id}`} className="block truncate text-sm font-bold text-foreground transition hover:text-primary sm:text-base">
                              {isDriver
                                ? `${order?.order_number || 'Delivery'}${order?.client_name ? ` · ${order.client_name}` : ''}`
                                : `${order?.order_number || 'Order'} → ${driver?.full_name || driver?.employee_id || 'Driver'}`}
                            </Link>
                            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                              {isDriver ? 'Your delivery' : `Assignment · ${assignment.id.slice(0, 8)}`}
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${statusBadgeColors[assignment.status]}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {statusLabel}
                        </span>
                      </div>

                      {/* Order & Driver Details */}
                      <div className="mb-3 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                        <div className="min-w-0 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-3 shadow-sm dark:border-primary/30 dark:from-primary/20 dark:via-card dark:to-card sm:p-4">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary dark:bg-primary/20">
                              <PackageCheck className="h-3.5 w-3.5" />
                            </span>
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary">{isDriver ? 'Delivery & route' : 'Order route'}</p>
                          </div>
                          <p className="mt-2 break-words text-sm font-semibold text-foreground">{order?.package_description || 'Package details unavailable'}</p>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <div className="min-w-0 rounded-lg border border-primary/20 bg-background/90 p-2.5 dark:border-primary/25 dark:bg-primary/[0.12]">
                              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-primary">Pickup</p>
                              <p className="mt-1.5 flex items-start gap-1.5 break-words text-xs font-medium leading-5 text-foreground">
                                <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                                {order?.pickup_location || 'Pickup location unavailable'}
                              </p>
                            </div>
                            <div className="min-w-0 rounded-lg border border-success/25 bg-success/[0.08] p-2.5 dark:border-success/30 dark:bg-success/[0.15]">
                              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-success-foreground">Deliver to</p>
                              <p className="mt-1.5 flex items-start gap-1.5 break-words text-xs font-medium leading-5 text-foreground">
                                <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-success-foreground" />
                                {order?.delivery_location || 'Delivery location unavailable'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="min-w-0 rounded-xl border border-info/20 bg-gradient-to-br from-info/10 via-card to-card p-3 shadow-sm dark:border-info/30 dark:from-info/20 dark:via-card dark:to-card sm:p-4">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-info/10 text-info-foreground dark:bg-info/20">
                              {isDriver ? <UserRound className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
                            </span>
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-info-foreground">{isDriver ? 'Customer contact' : 'Assigned driver'}</p>
                          </div>
                          <p className="mt-2 break-words text-sm font-semibold text-foreground">
                            {isDriver ? order?.client_name || 'Customer details unavailable' : driver?.full_name || driver?.employee_id}
                          </p>
                          {isDriver && order?.client_phone ? (
                            <a className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-info/15 bg-background/85 px-3 text-sm font-semibold text-primary transition hover:bg-info/10" href={`tel:${order.client_phone}`}>
                              <Phone className="h-4 w-4 shrink-0" />
                              {order.client_phone}
                            </a>
                          ) : !isDriver && driver?.full_name ? (
                            <p className="mt-1 text-xs text-muted-foreground">Employee ID: {driver.employee_id}</p>
                          ) : null}
                          {!isDriver && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {driver && (driver.vehicle_type.charAt(0).toUpperCase() + driver.vehicle_type.slice(1))} · {driver?.vehicle_number}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Assignment Notes */}
                      {assignment.notes && (
                        <div className="mb-3 min-w-0 rounded-lg border border-warning/25 bg-warning/[0.08] p-3 dark:border-warning/30 dark:bg-warning/[0.14]">
                          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-warning-foreground">Assignment notes</p>
                          <p className="mt-1 break-words text-xs leading-5 text-foreground">{assignment.notes}</p>
                        </div>
                      )}

                      {/* Timeline */}
                      <div className="flex flex-wrap gap-2">
                        {assignment.assigned_at && (
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground dark:bg-muted">
                            <Clock className="h-3 w-3 shrink-0" />
                            Assigned: {formatDate(assignment.assigned_at, 'short')}
                          </div>
                        )}
                        {assignment.accepted_at && (
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/[0.08] px-2.5 py-1.5 text-[10px] font-medium text-success-foreground dark:border-success/30 dark:bg-success/[0.14]">
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                            Accepted: {formatDate(assignment.accepted_at, 'short')}
                          </div>
                        )}
                        {assignment.started_at && (
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-info/25 bg-info/[0.08] px-2.5 py-1.5 text-[10px] font-medium text-info-foreground dark:border-info/30 dark:bg-info/[0.14]">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            Started: {formatDate(assignment.started_at, 'short')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center lg:flex-col lg:items-end">
                      <div className="flex min-h-16 flex-1 items-center justify-between gap-4 rounded-xl border border-info/25 bg-gradient-to-br from-info/10 via-card to-card px-4 py-3 text-left shadow-sm dark:border-info/30 dark:from-info/20 dark:via-card dark:to-card sm:flex-col sm:justify-center sm:gap-0 sm:text-center lg:min-w-[150px]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-info-foreground">Est. duration</p>
                        <p className="text-2xl font-extrabold tabular-nums text-foreground">
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
              <button type="button" onClick={() => void handleRefresh()} disabled={isRefreshing} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60">
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
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
          <div
            role="region"
            aria-label="Assignment summary statistics"
            tabIndex={0}
            className="mt-8 flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible lg:grid-cols-4"
          >
            <div className="surface-glass h-full w-[72vw] max-w-[220px] shrink-0 snap-start rounded-lg border border-border p-3 sm:w-auto sm:max-w-none sm:p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Assignments</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-foreground sm:mt-3 sm:text-3xl">{assignments.length}</p>
            </div>
            <div className="surface-glass h-full w-[72vw] max-w-[220px] shrink-0 snap-start rounded-lg border border-border p-3 sm:w-auto sm:max-w-none sm:p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">In Progress</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-info-foreground sm:mt-3 sm:text-3xl">
                {assignments.filter((a) => a.status === 'in_progress').length}
              </p>
            </div>
            <div className="surface-glass h-full w-[72vw] max-w-[220px] shrink-0 snap-start rounded-lg border border-border p-3 sm:w-auto sm:max-w-none sm:p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Completed</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-success-foreground sm:mt-3 sm:text-3xl">
                {assignments.filter((a) => a.status === 'completed').length}
              </p>
            </div>
            <div className="surface-glass h-full w-[72vw] max-w-[220px] shrink-0 snap-start rounded-lg border border-border p-3 sm:w-auto sm:max-w-none sm:p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Pending</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-warning-foreground sm:mt-3 sm:text-3xl">
                {assignments.filter((a) => a.status === 'pending').length}
              </p>
            </div>
          </div>
        )}
        {!isDriver && <p className="-mt-4 text-[11px] text-muted-foreground sm:hidden">Swipe sideways to browse assignment totals.</p>}
      </div>
    </div>
  );
}
