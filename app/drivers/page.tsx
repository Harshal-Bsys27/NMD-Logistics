'use client';

import { driverService } from '@/services/database';
import { useOperationsData } from '@/hooks/useOperationsData';
import { useAuth } from '@/hooks';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn, toTitleCase } from '@/utils/helpers';
import { AlertCircle, Award, Download, MapPin, TrendingUp, Users, Search, UserPlus } from 'lucide-react';
import { useState } from 'react';

const statusColors: Record<string, string> = {
  available: 'bg-success text-success-foreground',
  assigned: 'bg-primary/10 text-primary',
  on_delivery: 'bg-info text-info-foreground',
  on_break: 'bg-warning text-warning-foreground',
  off_duty: 'bg-muted text-muted-foreground',
};

const vehicleEmojis: Record<string, string> = {
  bike: '🏍️',
  auto: '🛺',
  car: '🚗',
  van: '🚐',
  truck: '🚚',
};

export default function DriversPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canManageDrivers = user?.role === 'admin';
  const { drivers, assignments, isLoading, error, refresh } = useOperationsData();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyDriverId, setBusyDriverId] = useState<string | null>(null);

  const filteredDrivers = drivers.filter((driver) =>
    (driver.full_name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDriverAssignments = (driverId: string) => {
    return assignments.filter((a) => a.personnel_id === driverId);
  };

  const avgRating = drivers.length > 0 ? (drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length).toFixed(1) : 0;
  const assignedDriverIds = new Set(
    assignments
      .filter((assignment) => ['pending', 'accepted', 'in_progress'].includes(assignment.status))
      .map((assignment) => assignment.personnel_id)
  );
  const availableCount = drivers.filter((d) => d.current_status === 'available' && !assignedDriverIds.has(d.id)).length;
  const onDeliveryCount = drivers.filter((d) => d.current_status === 'on_delivery').length;

  const exportDrivers = () => {
    const escapeCell = (value: string | number | boolean | undefined) => {
      const text = String(value ?? '');
      const safeText = /^[\t\r ]*[=+\-@]/.test(text) ? `'${text}` : text;
      return `"${safeText.replace(/"/g, '""')}"`;
    };
    const headers = [
      'Driver name',
      'Employee ID',
      'Vehicle type',
      'Vehicle number',
      'License number',
      'Status',
      'Active assignments',
      'Completed deliveries',
      'Rating',
      'Phone verified',
      'Joined at',
    ];
    const rows = filteredDrivers.map((driver) => {
      const driverAssignments = getDriverAssignments(driver.id);
      const hasActiveAssignment = driverAssignments.some((assignment) =>
        ['pending', 'accepted', 'in_progress'].includes(assignment.status)
      );
      const displayedStatus = hasActiveAssignment && driver.current_status === 'available'
        ? 'assigned'
        : driver.current_status;

      return [
        driver.full_name || driver.employee_id,
        driver.employee_id,
        toTitleCase(driver.vehicle_type),
        driver.vehicle_number,
        driver.license_number || '',
        toTitleCase(displayedStatus),
        driverAssignments.filter((assignment) =>
          !['completed', 'cancelled', 'rejected'].includes(assignment.status)
        ).length,
        driver.total_deliveries_completed,
        driver.rating,
        driver.phone_verified ? 'Yes' : 'No',
        driver.created_at ? new Date(driver.created_at).toLocaleDateString() : '',
      ].map(escapeCell);
    });
    const csv = `\uFEFF${[headers.map(escapeCell).join(','), ...rows.map((row) => row.join(','))].join('\r\n')}`;
    const downloadUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `nmd-drivers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  };

  const handleStatusUpdate = async (driverId: string, status: 'available' | 'on_delivery') => {
    setBusyDriverId(driverId);
    setActionError('');
    try {
      const result = await driverService.updateStatus(driverId, status);
      if (result.error) throw new Error(result.error);
      await refresh(true);
    } catch (updateError) {
      setActionError(updateError instanceof Error ? updateError.message : 'Unable to update driver status');
    } finally {
      setBusyDriverId(null);
    }
  };

  return (
    <div className="bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="w-full space-y-6">
        {/* Header */}
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground">Drivers & Assignments</h1>
              <p className="mt-2 text-muted-foreground">Manage your delivery personnel and track active assignments</p>
            </div>
            {canManageDrivers && (
              <Link
                href="/users?role=delivery_personnel"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <UserPlus className="h-4 w-4" />
                Add driver
              </Link>
            )}
          </div>
        </div>

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

        {/* Stats Grid */}
        <div
          role="region"
          aria-label="Driver summary statistics"
          tabIndex={0}
          className="flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible lg:grid-cols-4"
        >
          <div className="surface-glass h-full w-[72vw] max-w-[220px] shrink-0 snap-start rounded-lg p-4 sm:w-auto sm:max-w-none sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Total Drivers</p>
                <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">{drivers.length}</p>
              </div>
              <div className="rounded-md bg-primary/10 p-3 text-primary">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="surface-glass h-full w-[72vw] max-w-[220px] shrink-0 snap-start rounded-lg p-4 sm:w-auto sm:max-w-none sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Available Now</p>
                <p className="mt-3 text-3xl font-bold tabular-nums text-success-foreground">{availableCount}</p>
              </div>
              <div className="rounded-md bg-success p-3 text-success-foreground">
                <MapPin className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="surface-glass h-full w-[72vw] max-w-[220px] shrink-0 snap-start rounded-lg p-4 sm:w-auto sm:max-w-none sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">On Delivery</p>
                <p className="mt-3 text-3xl font-bold tabular-nums text-info-foreground">{onDeliveryCount}</p>
              </div>
              <div className="rounded-md bg-info p-3 text-info-foreground">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="surface-glass h-full w-[72vw] max-w-[220px] shrink-0 snap-start rounded-lg p-4 sm:w-auto sm:max-w-none sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Avg Rating</p>
                <p className="mt-3 text-3xl font-bold tabular-nums text-warning-foreground">{avgRating}⭐</p>
              </div>
              <p className="-mt-4 text-[11px] text-muted-foreground sm:hidden">Swipe sideways to browse driver stats.</p>
              <div className="rounded-md bg-warning p-3 text-warning-foreground">
                <Award className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by driver name, employee ID, or vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search drivers"
              className="min-h-11 w-full rounded-lg border border-input bg-background px-12 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <button
            type="button"
            onClick={exportDrivers}
            disabled={isLoading || filteredDrivers.length === 0}
            aria-label={`Export ${filteredDrivers.length} drivers as CSV`}
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Drivers Grid */}
        <div
          role="region"
          aria-label="Driver cards"
          tabIndex={0}
          className="flex min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:grid lg:grid-cols-2 lg:gap-6 lg:overflow-visible"
        >
          {isLoading ? (
            <div className="surface-glass w-[min(88vw,420px)] shrink-0 snap-start rounded-lg border border-border p-8 text-center text-muted-foreground lg:w-auto" aria-live="polite">
              Loading drivers…
            </div>
          ) : filteredDrivers.map((driver) => {
            const driverAssignments = getDriverAssignments(driver.id);
            const activeAssignment = driverAssignments.find((a) => a.status === 'in_progress');
            const hasActiveAssignment = driverAssignments.some((a) => ['pending', 'accepted', 'in_progress'].includes(a.status));
            const displayedStatus = hasActiveAssignment && driver.current_status === 'available'
              ? 'assigned'
              : driver.current_status;

            return (
              <div
                key={driver.id}
                onClick={() => router.push(`/drivers/${driver.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    router.push(`/drivers/${driver.id}`);
                  }
                }}
                tabIndex={0}
                className="surface-glass w-[min(88vw,420px)] shrink-0 snap-start cursor-pointer rounded-lg border border-border p-4 transition hover:border-ring/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5 lg:w-auto lg:shrink"
              >
                {/* Driver Header */}
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-2xl sm:h-14 sm:w-14">
                      {vehicleEmojis[driver.vehicle_type]}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{driver.full_name || driver.employee_id}</p>
                      <p className="truncate text-xs text-muted-foreground">ID: {driver.employee_id}</p>
                      <p className="text-xs text-muted-foreground">{toTitleCase(driver.vehicle_type)} Driver</p>
                    </div>
                  </div>
                  <span className={cn('inline-flex min-h-6 shrink-0 items-center rounded-full px-2 py-1 text-[11px] font-semibold sm:px-3 sm:text-xs', statusColors[displayedStatus])}>
                    {toTitleCase(displayedStatus)}
                  </span>
                </div>

                {/* Vehicle Info */}
                <div className="mt-4 rounded-md border border-border bg-muted/40 p-3 sm:mt-6 sm:p-4">
                  <div className="grid gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vehicle:</span>
                      <span className="font-semibold text-foreground">{driver.vehicle_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">License:</span>
                      <span className="font-semibold text-foreground">{driver.license_number || 'Pending'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone Verified:</span>
                      <span className="font-semibold text-success-foreground">{driver.phone_verified ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-center sm:mt-6 sm:gap-3">
                  <div className="rounded-md bg-muted/40 p-2 sm:p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Completed</p>
                    <p className="mt-2 font-bold tabular-nums text-foreground">{driver.total_deliveries_completed}</p>
                  </div>
                  <div className="rounded-md bg-muted/40 p-2 sm:p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Rating</p>
                    <p className="mt-2 font-bold tabular-nums text-warning-foreground">{driver.rating}⭐</p>
                  </div>
                  <div className="rounded-md bg-muted/40 p-2 sm:p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Active</p>
                    <p className="mt-2 font-bold tabular-nums text-info-foreground">
                      {driverAssignments.filter((assignment) => !['completed', 'cancelled', 'rejected'].includes(assignment.status)).length}
                    </p>
                  </div>
                </div>

                {/* Current Assignment */}
                {activeAssignment && (
                  <div className="mt-4 rounded-md border-l-4 border-info-foreground bg-info p-3 sm:mt-6 sm:p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-info-foreground">Currently Delivering</p>
                    <p className="mt-2 font-semibold text-foreground">{activeAssignment.notes || 'Order in transit'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Est. {activeAssignment.estimated_duration_minutes} mins</p>
                  </div>
                )}

                <div className="mt-4 flex gap-2 sm:mt-6">
                  {canManageDrivers && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleStatusUpdate(driver.id, 'available');
                        }}
                        disabled={busyDriverId === driver.id || driver.current_status === 'available' || hasActiveAssignment}
                        className="min-h-11 flex-1 rounded-lg border border-border bg-background px-2 py-2 text-xs font-semibold text-foreground transition hover:bg-muted disabled:opacity-50 sm:px-3"
                      >
                        Available
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleStatusUpdate(driver.id, 'on_delivery');
                        }}
                        disabled={busyDriverId === driver.id || !activeAssignment || driver.current_status === 'on_delivery'}
                        className="min-h-11 flex-1 rounded-lg border border-border bg-background px-2 py-2 text-xs font-semibold text-foreground transition hover:bg-muted disabled:opacity-50 sm:px-3"
                      >
                        On delivery
                      </button>
                    </>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/drivers/${driver.id}`);
                    }}
                    className="min-h-11 flex-1 rounded-lg bg-primary px-2 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 sm:px-3"
                  >
                    Details
                  </button>
                </div>
                {!isLoading && filteredDrivers.length > 1 && (
                  <p className="-mt-4 text-[11px] text-muted-foreground lg:hidden">Swipe sideways to browse driver cards.</p>
                )}
              </div>
            );
          })}
        </div>

        {!isLoading && filteredDrivers.length === 0 && (
          <div className="surface-glass rounded-lg border border-border py-12 text-center">
            <p className="text-muted-foreground">No drivers found matching your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
