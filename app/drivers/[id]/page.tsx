'use client';

import { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useOperationsData } from '@/hooks/useOperationsData';
import { ArrowLeft, AlertCircle, Award, Briefcase, Phone, Activity } from 'lucide-react';

export default function DriverDetailPage() {
  const router = useRouter();
  const params = useParams();
  const driverId = params.id as string;
  const { drivers, assignments, orders, isLoading, error } = useOperationsData();

  const driver = useMemo(() => drivers.find((d) => d.id === driverId), [drivers, driverId]);

  const driverAssignments = useMemo(
    () => assignments.filter((a) => a.personnel_id === driverId),
    [assignments, driverId]
  );

  if (isLoading) {
    return (
      <div className="bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl animate-pulse space-y-4">
          <div className="h-10 w-32 rounded-md bg-muted" />
          <div className="h-40 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (!driver || error) {
    return (
      <div className="bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => router.back()}
            className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-3 rounded-lg border border-danger/30 bg-danger p-4 text-danger-foreground">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error || 'Driver not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    available: 'bg-success text-success-foreground',
    on_delivery: 'bg-info text-info-foreground',
    on_break: 'bg-warning text-warning-foreground',
    off_duty: 'bg-muted text-muted-foreground',
  };

  const vehicleEmojis: Record<string, string> = {
    bike: '🏍️',
    auto: '🛺',
    car: '🚗',
    van: '🚐',
    truck: '🚛',
  };

  return (
    <div className="bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Driver Header */}
        <div className="surface-glass mb-8 rounded-lg p-6 sm:p-8">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-primary/10 text-4xl">{vehicleEmojis[driver.vehicle_type]}</div>
              <div>
                <h1 className="text-3xl font-semibold text-foreground">{driver.full_name || driver.employee_id}</h1>
                <p className="mt-1 text-muted-foreground capitalize">{driver.vehicle_type} Driver</p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 sm:items-end">
              <span className={`inline-flex min-h-8 items-center rounded-full px-4 py-2 text-sm font-semibold ${statusColors[driver.current_status] ?? 'bg-muted text-muted-foreground'}`}>
                {driver.current_status.replace('_', ' ')}
              </span>
              <div className="flex items-center gap-2 text-lg font-semibold text-warning-foreground">
                {driver.rating}⭐
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="surface-glass h-full rounded-lg p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Completed Deliveries</p>
            <p className="mt-3 text-2xl font-bold tabular-nums text-success-foreground">{driver.total_deliveries_completed}</p>
          </div>

          <div className="surface-glass h-full rounded-lg p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Customer Rating</p>
            <p className="mt-3 text-2xl font-bold tabular-nums text-warning-foreground">{driver.rating}</p>
          </div>

          <div className="surface-glass h-full rounded-lg p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Active Assignments</p>
            <p className="mt-3 text-2xl font-bold tabular-nums text-info-foreground">
              {driverAssignments.filter((assignment) => !['completed', 'cancelled', 'rejected'].includes(assignment.status)).length}
            </p>
          </div>

          <div className="surface-glass h-full rounded-lg p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Verification</p>
            <p className="mt-3 text-sm font-semibold">
              {driver.phone_verified ? (
                <span className="text-success-foreground">✓ Verified</span>
              ) : (
                <span className="text-danger-foreground">⚠ Pending</span>
              )}
            </p>
          </div>
        </div>

        {/* Driver Information */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Contact & License */}
          <div className="surface-glass rounded-lg p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Phone className="h-5 w-5 text-primary" />
              Contact Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Employee ID</p>
                <p className="mt-1 font-mono text-foreground">{driver.employee_id}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">License Number</p>
                <p className="mt-1 font-mono text-foreground">{driver.license_number || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="surface-glass rounded-lg p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Briefcase className="h-5 w-5 text-info-foreground" />
              Vehicle Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Vehicle Type</p>
                <p className="mt-1 capitalize text-foreground">{driver.vehicle_type}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Vehicle Number</p>
                <p className="mt-1 font-mono text-foreground">{driver.vehicle_number}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Assignments */}
        {driverAssignments.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
              <Activity className="h-6 w-6" />
              Active Assignments
            </h2>
            <div className="space-y-3">
              {driverAssignments.map((assignment) => (
                <div key={assignment.id} className="surface-glass rounded-lg border border-border p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-semibold text-foreground">
                        {orders.find((order) => order.id === assignment.order_id)?.order_number ?? `Order #${assignment.order_id.slice(0, 8)}`}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Status: {assignment.status} • Est. {assignment.estimated_duration_minutes} mins
                      </p>
                      {assignment.notes && (
                        <p className="mt-2 text-sm text-foreground">{assignment.notes}</p>
                      )}
                    </div>
                    <span className="inline-flex min-h-6 items-center rounded-full bg-info px-3 py-1 text-xs font-semibold text-info-foreground">
                      {assignment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Stats */}
        <div className="surface-glass rounded-lg p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Award className="h-5 w-5 text-warning-foreground" />
            Performance Metrics
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-3xl font-bold tabular-nums text-success-foreground">{driver.total_deliveries_completed}</p>
              <p className="mt-1 text-sm text-muted-foreground">Total Deliveries</p>
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums text-warning-foreground">{driver.rating}</p>
              <p className="mt-1 text-sm text-muted-foreground">Customer Rating</p>
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums text-info-foreground">
                {((driver.total_deliveries_completed / (driver.total_deliveries_completed + 5)) * 100).toFixed(1)}%
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Success Rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
