'use client';

import { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMockDrivers, useMockAssignments } from '@/services/mockData';
import { ArrowLeft, AlertCircle, Award, Briefcase, Phone, Activity } from 'lucide-react';

export default function DriverDetailPage() {
  const router = useRouter();
  const params = useParams();
  const driverId = params.id as string;
  const { drivers } = useMockDrivers();
  const { assignments } = useMockAssignments();

  const driver = useMemo(() => drivers.find((d) => d.id === driverId), [drivers, driverId]);

  const driverAssignments = useMemo(
    () => assignments.filter((a) => a.personnel_id === driverId),
    [assignments, driverId]
  );

  if (!driver) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-cyan-300 transition hover:text-cyan-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="text-sm text-red-300">Driver not found</p>
          </div>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    available: 'bg-emerald-600 text-emerald-100',
    on_delivery: 'bg-cyan-600 text-cyan-100',
    on_break: 'bg-amber-600 text-amber-100',
    off_duty: 'bg-slate-600 text-slate-100',
  };

  const vehicleEmojis: Record<string, string> = {
    bike: '🏍️',
    auto: '🛺',
    car: '🚗',
    van: '🚐',
    truck: '🚛',
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-cyan-300 transition hover:text-cyan-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Driver Header */}
        <div className="surface-glass mb-8 rounded-2xl border border-slate-700/50 p-8">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 text-4xl">{vehicleEmojis[driver.vehicle_type]}</div>
              <div>
                <h1 className="text-3xl font-bold text-white">{driver.employee_id}</h1>
                <p className="mt-1 text-slate-400 capitalize">{driver.vehicle_type} Driver</p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 sm:items-end">
              <span className={`rounded-full px-4 py-2 text-sm font-semibold ${statusColors[driver.current_status]}`}>
                {driver.current_status.replace('_', ' ')}
              </span>
              <div className="flex items-center gap-2 text-lg font-semibold text-yellow-300">
                {driver.rating}⭐
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="surface-glass rounded-2xl border border-slate-700/50 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Completed Deliveries</p>
            <p className="mt-3 text-2xl font-bold text-emerald-300">{driver.total_deliveries_completed}</p>
          </div>

          <div className="surface-glass rounded-2xl border border-slate-700/50 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Customer Rating</p>
            <p className="mt-3 text-2xl font-bold text-yellow-300">{driver.rating}</p>
          </div>

          <div className="surface-glass rounded-2xl border border-slate-700/50 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Active Assignments</p>
            <p className="mt-3 text-2xl font-bold text-cyan-300">{driverAssignments.length}</p>
          </div>

          <div className="surface-glass rounded-2xl border border-slate-700/50 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Verification</p>
            <p className="mt-3 text-sm font-semibold">
              {driver.phone_verified ? (
                <span className="text-emerald-300">✓ Verified</span>
              ) : (
                <span className="text-red-300">⚠ Pending</span>
              )}
            </p>
          </div>
        </div>

        {/* Driver Information */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Contact & License */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/95 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Phone className="h-5 w-5 text-cyan-400" />
              Contact Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Employee ID</p>
                <p className="mt-1 font-mono text-white">{driver.employee_id}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">License Number</p>
                <p className="mt-1 font-mono text-white">{driver.license_number || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/95 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Briefcase className="h-5 w-5 text-violet-400" />
              Vehicle Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Vehicle Type</p>
                <p className="mt-1 capitalize text-white">{driver.vehicle_type}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Vehicle Number</p>
                <p className="mt-1 font-mono text-white">{driver.vehicle_number}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Assignments */}
        {driverAssignments.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-white">
              <Activity className="h-6 w-6" />
              Active Assignments
            </h2>
            <div className="space-y-3">
              {driverAssignments.map((assignment) => (
                <div key={assignment.id} className="rounded-xl border border-slate-800 bg-slate-900/95 p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-semibold text-white">Order #{assignment.order_id.slice(0, 8)}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Status: {assignment.status} • Est. {assignment.estimated_duration_minutes} mins
                      </p>
                      {assignment.notes && (
                        <p className="mt-2 text-sm text-slate-300">{assignment.notes}</p>
                      )}
                    </div>
                    <span className="inline-block rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-300">
                      {assignment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Stats */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/95 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Award className="h-5 w-5 text-amber-400" />
            Performance Metrics
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-3xl font-bold text-emerald-300">{driver.total_deliveries_completed}</p>
              <p className="mt-1 text-sm text-slate-400">Total Deliveries</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-yellow-300">{driver.rating}</p>
              <p className="mt-1 text-sm text-slate-400">Customer Rating</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-300">
                {((driver.total_deliveries_completed / (driver.total_deliveries_completed + 5)) * 100).toFixed(1)}%
              </p>
              <p className="mt-1 text-sm text-slate-400">Success Rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
