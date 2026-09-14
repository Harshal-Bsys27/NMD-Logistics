'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMockAssignments, useMockOrders, useMockDrivers } from '@/services/mockData';
import { formatDate } from '@/utils/helpers';
import {
  ArrowLeft,
  MapPin,
  Truck,
  Clock,
  AlertCircle,
  CheckCircle2,
  Phone,
  Star,
  AlertTriangle,
  MapPinIcon,
  Package,
} from 'lucide-react';

type AssignmentStatus = 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';

const vehicleEmojis: Record<string, string> = {
  bike: '🏍️',
  auto: '🛵',
  car: '🚗',
  van: '🚐',
  truck: '🚚',
};

export default function AssignmentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { assignments } = useMockAssignments();
  const { orders } = useMockOrders();
  const { drivers } = useMockDrivers();
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const assignment = assignments.find((a) => a.id === params.id);
  const order = assignment ? orders.find((o) => o.id === assignment.order_id) : null;
  const driver = assignment ? drivers.find((d) => d.id === assignment.personnel_id) : null;

  if (!assignment || !order || !driver) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>

          <div className="surface-glass rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-rose-400" />
            <h1 className="mt-4 text-2xl font-bold text-white">Assignment Not Found</h1>
            <p className="mt-2 text-slate-300">The assignment you're looking for doesn't exist.</p>
            <Link
              href="/assignments"
              className="mt-6 inline-block rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-semibold text-white transition hover:from-cyan-600 hover:to-blue-600"
            >
              Back to Assignments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusColors: Record<AssignmentStatus, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-amber-600', text: 'text-amber-100', label: 'Pending' },
    accepted: { bg: 'bg-blue-600', text: 'text-blue-100', label: 'Accepted' },
    rejected: { bg: 'bg-red-600', text: 'text-red-100', label: 'Rejected' },
    in_progress: { bg: 'bg-cyan-600', text: 'text-cyan-100', label: 'In Progress' },
    completed: { bg: 'bg-emerald-600', text: 'text-emerald-100', label: 'Completed' },
    cancelled: { bg: 'bg-slate-700', text: 'text-slate-300', label: 'Cancelled' },
  };

  const handleStatusUpdate = async (newStatus: AssignmentStatus) => {
    setActionLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setActionMessage(`Assignment ${statusColors[newStatus].label}`);
    setActionLoading(false);
    setTimeout(() => setActionMessage(null), 2500);
  };

  const canAccept = assignment.status === 'pending';
  const canReject = assignment.status === 'pending' || assignment.status === 'accepted';
  const canStart = assignment.status === 'accepted';
  const canComplete = assignment.status === 'in_progress';

  const eta = assignment.started_at
    ? new Date(new Date(assignment.started_at).getTime() + assignment.estimated_duration_minutes * 60 * 1000)
    : null;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>

          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="text-sm uppercase tracking-widest text-slate-400">Assignment ID: {assignment.id.slice(0, 8)}</div>
              <h1 className="mt-2 text-4xl font-bold text-white">
                {order.order_number} → {driver.employee_id}
              </h1>
              <p className="mt-2 text-slate-400">Assigned {formatDate(assignment.assigned_at)}</p>
            </div>
            <div className={`rounded-lg px-4 py-2 text-center font-semibold ${statusColors[assignment.status].bg} ${statusColors[assignment.status].text}`}>
              {statusColors[assignment.status].label}
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="surface-glass rounded-2xl border border-slate-700/50 p-6">
          <h2 className="mb-6 text-lg font-bold text-white">Assignment Timeline</h2>
          <div className="space-y-4">
            {/* Assigned */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-white">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="my-2 h-8 w-0.5 bg-slate-700" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Assignment Created</h4>
                <p className="text-sm text-slate-400">{formatDate(assignment.assigned_at)}</p>
              </div>
            </div>

            {/* Accepted */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${assignment.accepted_at ? 'bg-emerald-500' : 'bg-slate-700'} text-white`}>
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                {assignment.started_at && <div className="my-2 h-8 w-0.5 bg-slate-700" />}
              </div>
              <div>
                <h4 className={`font-semibold ${assignment.accepted_at ? 'text-white' : 'text-slate-500'}`}>
                  Driver Accepted
                </h4>
                <p className="text-sm text-slate-400">
                  {assignment.accepted_at ? formatDate(assignment.accepted_at) : 'Pending'}
                </p>
              </div>
            </div>

            {/* In Progress */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${assignment.started_at ? 'bg-cyan-500' : 'bg-slate-700'} text-white`}>
                  <Truck className="h-4 w-4" />
                </div>
              </div>
              <div>
                <h4 className={`font-semibold ${assignment.started_at ? 'text-white' : 'text-slate-500'}`}>
                  In Progress
                </h4>
                <p className="text-sm text-slate-400">
                  {assignment.started_at ? formatDate(assignment.started_at) : 'Not started'}
                </p>
                {eta && <p className="mt-1 text-sm text-cyan-300">ETA: {formatDate(eta.toISOString())}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="surface-glass rounded-2xl border border-slate-700/50 p-6">
          <h2 className="mb-6 text-lg font-bold text-white">Order Details</h2>

          {/* Quick Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-800/50 p-4">
              <p className="text-sm text-slate-400">Order Number</p>
              <p className="mt-1 font-bold text-white">{order.order_number}</p>
            </div>
            <div className="rounded-xl bg-slate-800/50 p-4">
              <p className="text-sm text-slate-400">Package Value</p>
              <p className="mt-1 font-bold text-white">₹{order.package_value.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-slate-800/50 p-4">
              <p className="text-sm text-slate-400">Priority</p>
              <p className="mt-1 font-bold uppercase text-white">{order.priority}</p>
            </div>
            <div className="rounded-xl bg-slate-800/50 p-4">
              <p className="text-sm text-slate-400">Weight</p>
              <p className="mt-1 font-bold text-white">{order.package_weight} kg</p>
            </div>
          </div>

          {/* Locations */}
          <div className="space-y-4">
            <div className="flex gap-4 rounded-xl bg-cyan-500/10 p-4">
              <MapPin className="h-5 w-5 flex-shrink-0 text-cyan-300" />
              <div>
                <p className="text-sm font-semibold text-cyan-300">Pickup Location</p>
                <p className="mt-1 text-white">{order.pickup_location}</p>
              </div>
            </div>
            <div className="flex gap-4 rounded-xl bg-emerald-500/10 p-4">
              <MapPin className="h-5 w-5 flex-shrink-0 text-emerald-300" />
              <div>
                <p className="text-sm font-semibold text-emerald-300">Delivery Location</p>
                <p className="mt-1 text-white">{order.delivery_location}</p>
              </div>
            </div>
          </div>

          {/* Package Description */}
          <div className="mt-4 rounded-xl bg-slate-800/50 p-4">
            <p className="text-sm text-slate-400">Package Description</p>
            <p className="mt-2 text-white">{order.package_description}</p>
          </div>

          {/* Customer Info */}
          <div className="mt-4 space-y-3 border-t border-slate-700/50 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-slate-400">Customer</p>
              <p className="font-semibold text-white">{order.client_name}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-slate-400">Phone</p>
              <a href={`tel:${order.client_phone}`} className="font-semibold text-cyan-400 hover:text-cyan-300">
                {order.client_phone}
              </a>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-slate-400">Email</p>
              <a href={`mailto:${order.client_email}`} className="font-semibold text-cyan-400 hover:text-cyan-300">
                {order.client_email}
              </a>
            </div>
          </div>
        </div>

        {/* Driver Information */}
        <div className="surface-glass rounded-2xl border border-slate-700/50 p-6">
          <h2 className="mb-6 text-lg font-bold text-white">Driver Information</h2>

          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-3xl">
              {vehicleEmojis[driver.vehicle_type] || '🚗'}
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-slate-400">Employee ID</p>
                <p className="font-semibold text-white">{driver.employee_id}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-slate-400">Vehicle</p>
                <p className="font-semibold text-white">{driver.vehicle_type.toUpperCase()}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-slate-400">Rating</p>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{driver.rating}</span>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Driver Stats */}
          <div className="mt-6 grid gap-4 border-t border-slate-700/50 pt-6 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-800/50 p-4">
              <p className="text-sm text-slate-400">Deliveries Completed</p>
              <p className="mt-1 text-2xl font-bold text-white">{driver.total_deliveries_completed}</p>
            </div>
            <div className="rounded-xl bg-slate-800/50 p-4">
              <p className="text-sm text-slate-400">Phone Verified</p>
              <p className="mt-1 text-lg font-bold text-emerald-400">
                {driver.phone_verified ? '✓ Verified' : '✗ Not Verified'}
              </p>
            </div>
          </div>

          {/* Driver Contact */}
          <div className="mt-4">
            <p className="mb-3 text-sm text-slate-400">Quick Actions</p>
            <div className="flex gap-3">
              <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/50 px-4 py-2 font-semibold text-slate-300 transition hover:bg-slate-700/50">
                <Phone className="h-4 w-4" />
                Call Driver
              </button>
              <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/50 px-4 py-2 font-semibold text-slate-300 transition hover:bg-slate-700/50">
                <MapPinIcon className="h-4 w-4" />
                Track Live
              </button>
            </div>
          </div>
        </div>

        {/* Notes */}
        {assignment.notes && (
          <div className="surface-glass rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-400" />
              <div>
                <h3 className="font-semibold text-amber-300">Notes</h3>
                <p className="mt-2 text-amber-100">{assignment.notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="surface-glass rounded-2xl border border-slate-700/50 p-6">
          <h2 className="mb-4 text-lg font-bold text-white">Update Status</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            {canAccept && (
              <button
                onClick={() => handleStatusUpdate('accepted')}
                disabled={actionLoading}
                className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 px-4 py-3 font-semibold text-white transition disabled:opacity-50 hover:from-emerald-600 hover:to-green-600"
              >
                {actionLoading ? 'Accepting...' : '✓ Accept Assignment'}
              </button>
            )}

            {canStart && (
              <button
                onClick={() => handleStatusUpdate('in_progress')}
                disabled={actionLoading}
                className="flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-3 font-semibold text-white shadow-lg shadow-cyan-500/20 transition disabled:opacity-50 hover:from-cyan-600 hover:to-blue-600"
              >
                {actionLoading ? 'Starting...' : '🚀 Start Delivery'}
              </button>
            )}

            {canComplete && (
              <button
                onClick={() => handleStatusUpdate('completed')}
                disabled={actionLoading}
                className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 px-4 py-3 font-semibold text-white transition disabled:opacity-50 hover:from-emerald-600 hover:to-green-600"
              >
                {actionLoading ? 'Completing...' : '✅ Mark Completed'}
              </button>
            )}

            {canReject && (
              <button
                onClick={() => handleStatusUpdate('rejected')}
                disabled={actionLoading}
                className="flex-1 rounded-lg border border-rose-500 bg-rose-500/10 px-4 py-3 font-semibold text-rose-300 transition disabled:opacity-50 hover:bg-rose-500/20"
              >
                {actionLoading ? 'Rejecting...' : '✕ Reject'}
              </button>
            )}
          </div>

          {actionMessage && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-3 text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
              {actionMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
