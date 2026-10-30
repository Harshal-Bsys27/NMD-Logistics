'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { assignmentService } from '@/services/database';
import { useOperationsData } from '@/hooks/useOperationsData';
import { formatDate } from '@/utils/helpers';
import { Clock, AlertCircle, CheckCircle2, MapPin } from 'lucide-react';

import type { AssignmentStatus } from '@/types';

export default function AssignmentsPage() {
  const { assignments, orders, drivers, isLoading, error, refresh } = useOperationsData();
  const [selectedStatus, setSelectedStatus] = useState<AssignmentStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyAssignmentId, setBusyAssignmentId] = useState<string | null>(null);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
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
  }, [assignments, orders, drivers, selectedStatus, searchTerm]);

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
    all: assignments.length,
    pending: assignments.filter((a) => a.status === 'pending').length,
    accepted: assignments.filter((a) => a.status === 'accepted').length,
    in_progress: assignments.filter((a) => a.status === 'in_progress').length,
    completed: assignments.filter((a) => a.status === 'completed').length,
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
    <div className="bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="w-full space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Driver Assignments</h1>
          <p className="mt-2 text-muted-foreground">Track and manage delivery assignments</p>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap gap-3">
          {(['all', 'pending', 'accepted', 'in_progress', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`min-h-11 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                selectedStatus === status
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-background text-foreground hover:bg-muted'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')} ({statusCounts[status]})
            </button>
          ))}
        </div>

        {/* Search Bar */}
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
        <div className="space-y-4">
          {isLoading ? (
            <div className="surface-glass rounded-lg border border-border p-8 text-center text-muted-foreground" aria-live="polite">
              Loading assignments…
            </div>
          ) : filteredAssignments.length > 0 ? (
            filteredAssignments.map((assignment) => {
              const order = getOrderInfo(assignment.order_id);
              const driver = getDriverInfo(assignment.personnel_id);

              return (
                <div key={assignment.id} className="surface-glass rounded-lg border border-border p-5 transition hover:border-ring/50">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    {/* Main Info */}
                    <div className="flex-1">
                      <div className="mb-3 flex items-center gap-3">
                        <Link href={`/assignments/${assignment.id}`} className="text-lg font-semibold text-foreground hover:text-primary">
                          {order?.order_number || 'Order'} → {driver?.full_name || driver?.employee_id || 'Driver'}
                        </Link>
                        <span className={`inline-flex min-h-6 items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeColors[assignment.status]}`}>
                          {assignment.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Order & Driver Details */}
                      <div className="mb-3 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-md bg-muted/50 p-3">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">Order Details</p>
                          <p className="mt-1 text-sm text-foreground">{order?.package_description}</p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {order?.delivery_location}
                          </p>
                        </div>

                        <div className="rounded-md bg-muted/50 p-3">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">Driver</p>
                          <p className="mt-1 text-sm text-foreground">{driver?.full_name || driver?.employee_id}</p>
                          {driver?.full_name && <p className="mt-1 text-xs text-muted-foreground">ID: {driver.employee_id}</p>}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {driver && (driver.vehicle_type.charAt(0).toUpperCase() + driver.vehicle_type.slice(1))} •{' '}
                            {driver?.vehicle_number}
                          </p>
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

                    <div className="flex flex-col gap-2 lg:items-end">
                      <div className="rounded-md border border-border bg-muted/40 p-4 text-center lg:min-w-[150px]">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Est. Duration</p>
                        <p className="mt-2 text-2xl font-bold tabular-nums text-info-foreground">
                          {assignment.estimated_duration_minutes}
                        </p>
                        <p className="text-xs text-muted-foreground">minutes</p>
                      </div>
                      <div className="flex gap-2">
                        {assignment.status === 'pending' && (
                          <button
                            onClick={(event) => {
                              event.preventDefault();
                              void handleStatusUpdate(assignment.id, 'accepted');
                            }}
                            disabled={busyAssignmentId === assignment.id}
                            className="rounded-md bg-primary px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-foreground disabled:opacity-50"
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
                            className="rounded-md bg-info px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-info-foreground disabled:opacity-50"
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
                            className="rounded-md bg-success px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-success-foreground disabled:opacity-50"
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
          ) : (
            <div className="surface-glass rounded-lg border border-border p-8 text-center">
              <p className="text-muted-foreground">No assignments found</p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
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
      </div>
    </div>
  );
}
