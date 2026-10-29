'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMockAssignments, useMockOrders, useMockDrivers } from '@/services/mockData';
import { assignmentService } from '@/services/database';
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
      <div className="bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => router.back()}
            className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>

          <div className="surface-glass rounded-lg border border-danger/30 bg-danger p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-danger-foreground" />
            <h1 className="mt-4 text-2xl font-bold text-danger-foreground">Assignment Not Found</h1>
            <p className="mt-2 text-danger-foreground">The assignment you're looking for doesn't exist.</p>
            <Link
              href="/assignments"
              className="mt-6 inline-flex min-h-11 items-center rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Back to Assignments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusColors: Record<AssignmentStatus, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-warning', text: 'text-warning-foreground', label: 'Pending' },
    accepted: { bg: 'bg-info', text: 'text-info-foreground', label: 'Accepted' },
    rejected: { bg: 'bg-danger', text: 'text-danger-foreground', label: 'Rejected' },
    in_progress: { bg: 'bg-info', text: 'text-info-foreground', label: 'In Progress' },
    completed: { bg: 'bg-success', text: 'text-success-foreground', label: 'Completed' },
    cancelled: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Cancelled' },
  };

  const handleStatusUpdate = async (newStatus: AssignmentStatus) => {
    setActionLoading(true);
    try {
      const { error } = await assignmentService.updateStatus(assignment.id, newStatus);

      if (error) {
        throw new Error(error);
      }

      setActionMessage(`Assignment ${statusColors[newStatus].label}`);
      setTimeout(() => setActionMessage(null), 2500);
    } catch (error) {
      console.error('Failed to update assignment status:', error);
      setActionMessage(null);
    } finally {
      setActionLoading(false);
    }
  };

  const canAccept = assignment.status === 'pending';
  const canReject = assignment.status === 'pending' || assignment.status === 'accepted';
  const canStart = assignment.status === 'accepted';
  const canComplete = assignment.status === 'in_progress';

  const eta = assignment.started_at
    ? new Date(new Date(assignment.started_at).getTime() + (assignment.estimated_duration_minutes || 45) * 60 * 1000)
    : null;

  return (
    <div className="bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <button
            onClick={() => router.back()}
            className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>

          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="text-sm uppercase tracking-widest text-muted-foreground">Assignment ID: {assignment.id.slice(0, 8)}</div>
              <h1 className="mt-2 text-3xl font-semibold text-foreground">
                {order.order_number} → {driver.employee_id}
              </h1>
              <p className="mt-2 text-muted-foreground">Assigned {formatDate(assignment.assigned_at)}</p>
            </div>
            <div className={`inline-flex min-h-10 items-center rounded-full px-4 py-2 text-center font-semibold ${statusColors[assignment.status].bg} ${statusColors[assignment.status].text}`}>
              {statusColors[assignment.status].label}
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="surface-glass rounded-lg p-6">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Assignment Timeline</h2>
          <div className="space-y-4">
            {/* Assigned */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="my-2 h-8 w-0.5 bg-border" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Assignment Created</h4>
                <p className="text-sm text-muted-foreground">{formatDate(assignment.assigned_at)}</p>
              </div>
            </div>

            {/* Accepted */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${assignment.accepted_at ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                {assignment.started_at && <div className="my-2 h-8 w-0.5 bg-border" />}
              </div>
              <div>
                <h4 className={`font-semibold ${assignment.accepted_at ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Driver Accepted
                </h4>
                <p className="text-sm text-muted-foreground">
                  {assignment.accepted_at ? formatDate(assignment.accepted_at) : 'Pending'}
                </p>
              </div>
            </div>

            {/* In Progress */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${assignment.started_at ? 'bg-info text-info-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <Truck className="h-4 w-4" />
                </div>
              </div>
              <div>
                <h4 className={`font-semibold ${assignment.started_at ? 'text-foreground' : 'text-muted-foreground'}`}>
                  In Progress
                </h4>
                <p className="text-sm text-muted-foreground">
                  {assignment.started_at ? formatDate(assignment.started_at) : 'Not started'}
                </p>
                {eta && <p className="mt-1 text-sm text-info-foreground">ETA: {formatDate(eta.toISOString())}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="surface-glass rounded-lg p-6">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Order Details</h2>

          {/* Quick Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="mt-1 font-bold text-foreground">{order.order_number}</p>
            </div>
            <div className="rounded-md bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Package Value</p>
              <p className="mt-1 text-right font-bold tabular-nums text-foreground">₹{(order.package_value || 0).toLocaleString()}</p>
            </div>
            <div className="rounded-md bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Priority</p>
              <p className="mt-1 font-bold uppercase text-foreground">{order.priority}</p>
            </div>
            <div className="rounded-md bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Weight</p>
              <p className="mt-1 font-bold tabular-nums text-foreground">{order.package_weight} kg</p>
            </div>
          </div>

          {/* Locations */}
          <div className="space-y-4">
            <div className="flex gap-4 rounded-md bg-info p-4 text-info-foreground">
              <MapPin className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">Pickup Location</p>
                <p className="mt-1 text-foreground">{order.pickup_location}</p>
              </div>
            </div>
            <div className="flex gap-4 rounded-md bg-success p-4 text-success-foreground">
              <MapPin className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">Delivery Location</p>
                <p className="mt-1 text-foreground">{order.delivery_location}</p>
              </div>
            </div>
          </div>

          {/* Package Description */}
          <div className="mt-4 rounded-md bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Package Description</p>
            <p className="mt-2 text-foreground">{order.package_description}</p>
          </div>

          {/* Customer Info */}
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Customer</p>
              <p className="font-semibold text-foreground">{order.client_name}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Phone</p>
              <a href={`tel:${order.client_phone}`} className="font-semibold text-primary hover:underline">
                {order.client_phone}
              </a>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Email</p>
              <a href={`mailto:${order.client_email}`} className="font-semibold text-primary hover:underline">
                {order.client_email}
              </a>
            </div>
          </div>
        </div>

        {/* Driver Information */}
        <div className="surface-glass rounded-lg p-6">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Driver Information</h2>

          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-info text-3xl text-info-foreground">
              {vehicleEmojis[driver.vehicle_type] || '🚗'}
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Employee ID</p>
                <p className="font-semibold text-foreground">{driver.employee_id}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Vehicle</p>
                <p className="font-semibold text-foreground">{driver.vehicle_type.toUpperCase()}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Rating</p>
                <div className="flex items-center gap-2">
                  <span className="font-semibold tabular-nums text-foreground">{driver.rating}</span>
                  <Star className="h-4 w-4 fill-warning-foreground text-warning-foreground" />
                </div>
              </div>
            </div>
          </div>

          {/* Driver Stats */}
          <div className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
            <div className="rounded-md bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Deliveries Completed</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{driver.total_deliveries_completed}</p>
            </div>
            <div className="rounded-md bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Phone Verified</p>
              <p className="mt-1 text-lg font-bold text-success-foreground">
                {driver.phone_verified ? '✓ Verified' : '✗ Not Verified'}
              </p>
            </div>
          </div>

          {/* Driver Contact */}
          <div className="mt-4">
            <p className="mb-3 text-sm text-muted-foreground">Quick Actions</p>
            <div className="flex gap-3">
              <button className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Phone className="h-4 w-4" />
                Call Driver
              </button>
              <button className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <MapPinIcon className="h-4 w-4" />
                Track Live
              </button>
            </div>
          </div>
        </div>

        {/* Notes */}
        {assignment.notes && (
          <div className="surface-glass rounded-lg border border-warning/30 bg-warning p-6 text-warning-foreground">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Notes</h3>
                <p className="mt-2">{assignment.notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="surface-glass rounded-lg p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Update Status</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            {canAccept && (
              <button
                onClick={() => handleStatusUpdate('accepted')}
                disabled={actionLoading}
                className="min-h-11 flex-1 rounded-md bg-success px-4 py-2.5 font-semibold text-success-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ? 'Accepting...' : '✓ Accept Assignment'}
              </button>
            )}

            {canStart && (
              <button
                onClick={() => handleStatusUpdate('in_progress')}
                disabled={actionLoading}
                className="min-h-11 flex-1 rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ? 'Starting...' : '🚀 Start Delivery'}
              </button>
            )}

            {canComplete && (
              <button
                onClick={() => handleStatusUpdate('completed')}
                disabled={actionLoading}
                className="min-h-11 flex-1 rounded-md bg-success px-4 py-2.5 font-semibold text-success-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ? 'Completing...' : '✅ Mark Completed'}
              </button>
            )}

            {canReject && (
              <button
                onClick={() => handleStatusUpdate('rejected')}
                disabled={actionLoading}
                className="min-h-11 flex-1 rounded-md border border-danger/40 bg-danger px-4 py-2.5 font-semibold text-danger-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : '✕ Reject'}
              </button>
            )}
          </div>

          {actionMessage && (
            <div className="mt-4 flex items-center gap-2 rounded-md border border-success/30 bg-success px-4 py-3 text-success-foreground" role="status">
              <CheckCircle2 className="h-5 w-5" />
              {actionMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
