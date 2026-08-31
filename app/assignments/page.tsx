'use client';

import { useState, useMemo } from 'react';
import { useMockAssignments, useMockOrders, useMockDrivers } from '@/services/mockData';
import { formatDate } from '@/utils/helpers';
import { Clock, AlertCircle, CheckCircle2, MapPin } from 'lucide-react';

type AssignmentStatus = 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';

export default function AssignmentsPage() {
  const { assignments } = useMockAssignments();
  const { orders } = useMockOrders();
  const { drivers } = useMockDrivers();
  const [selectedStatus, setSelectedStatus] = useState<AssignmentStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const matchesStatus = selectedStatus === 'all' || assignment.status === selectedStatus;
      const matchesSearch =
        assignment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.personnel_id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [assignments, selectedStatus, searchTerm]);

  const getOrderInfo = (orderId: string) => orders.find((o) => o.id === orderId);
  const getDriverInfo = (driverId: string) => drivers.find((d) => d.id === driverId);

  const statusBadgeColors: Record<AssignmentStatus, string> = {
    pending: 'bg-amber-600 text-amber-100',
    accepted: 'bg-blue-600 text-blue-100',
    rejected: 'bg-red-600 text-red-100',
    in_progress: 'bg-cyan-600 text-cyan-100',
    completed: 'bg-emerald-600 text-emerald-100',
    cancelled: 'bg-slate-700 text-slate-300',
  };

  const statusCounts = {
    all: assignments.length,
    pending: assignments.filter((a) => a.status === 'pending').length,
    accepted: assignments.filter((a) => a.status === 'accepted').length,
    in_progress: assignments.filter((a) => a.status === 'in_progress').length,
    completed: assignments.filter((a) => a.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white">Driver Assignments</h1>
          <p className="mt-2 text-slate-400">Track and manage delivery assignments</p>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap gap-3">
          {(['all', 'pending', 'accepted', 'in_progress', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                selectedStatus === status
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20'
                  : 'border border-slate-700/50 bg-slate-800/50 text-slate-300 hover:border-slate-600/50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')} ({statusCounts[status]})
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="flex gap-3">
          <div className="flex-1 surface-glass rounded-xl border border-slate-700/50 px-4 py-3">
            <input
              type="text"
              placeholder="Search by order, driver, or assignment ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-white placeholder-slate-500 outline-none"
            />
          </div>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {filteredAssignments.length > 0 ? (
            filteredAssignments.map((assignment) => {
              const order = getOrderInfo(assignment.order_id);
              const driver = getDriverInfo(assignment.personnel_id);

              return (
                <div
                  key={assignment.id}
                  className="surface-glass rounded-2xl border border-slate-700/50 p-6 transition hover:border-slate-600/50"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    {/* Main Info */}
                    <div className="flex-1">
                      <div className="mb-3 flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">
                          {order?.order_number || 'Order'} → {driver?.employee_id || 'Driver'}
                        </h3>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeColors[assignment.status]}`}>
                          {assignment.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Order & Driver Details */}
                      <div className="mb-3 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg bg-slate-950/50 p-3">
                          <p className="text-xs uppercase tracking-wider text-slate-500">Order Details</p>
                          <p className="mt-1 text-sm text-slate-300">{order?.package_description}</p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                            <MapPin className="h-3 w-3" />
                            {order?.delivery_location}
                          </p>
                        </div>

                        <div className="rounded-lg bg-slate-950/50 p-3">
                          <p className="text-xs uppercase tracking-wider text-slate-500">Driver</p>
                          <p className="mt-1 text-sm text-slate-300">{driver?.employee_id}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {driver && (driver.vehicle_type.charAt(0).toUpperCase() + driver.vehicle_type.slice(1))} •{' '}
                            {driver?.vehicle_number}
                          </p>
                        </div>
                      </div>

                      {/* Assignment Notes */}
                      {assignment.notes && (
                        <div className="mb-3 rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                          <p className="text-xs uppercase tracking-wider text-slate-500">Notes</p>
                          <p className="mt-1 text-sm text-slate-300">{assignment.notes}</p>
                        </div>
                      )}

                      {/* Timeline */}
                      <div className="flex flex-wrap gap-3 text-xs">
                        {assignment.assigned_at && (
                          <div className="flex items-center gap-1 text-slate-400">
                            <Clock className="h-3 w-3" />
                            Assigned: {formatDate(assignment.assigned_at, 'short')}
                          </div>
                        )}
                        {assignment.accepted_at && (
                          <div className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Accepted: {formatDate(assignment.accepted_at, 'short')}
                          </div>
                        )}
                        {assignment.started_at && (
                          <div className="flex items-center gap-1 text-cyan-400">
                            <AlertCircle className="h-3 w-3" />
                            Started: {formatDate(assignment.started_at, 'short')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Duration Estimate */}
                    <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-4 text-center lg:min-w-[150px]">
                      <p className="text-xs uppercase tracking-wider text-slate-500">Est. Duration</p>
                      <p className="mt-2 text-2xl font-bold text-cyan-300">
                        {assignment.estimated_duration_minutes}
                      </p>
                      <p className="text-xs text-slate-400">minutes</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-8 text-center">
              <p className="text-slate-400">No assignments found</p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Total Assignments</p>
            <p className="mt-3 text-3xl font-bold text-white">{assignments.length}</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">In Progress</p>
            <p className="mt-3 text-3xl font-bold text-cyan-300">
              {assignments.filter((a) => a.status === 'in_progress').length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Completed</p>
            <p className="mt-3 text-3xl font-bold text-emerald-300">
              {assignments.filter((a) => a.status === 'completed').length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Pending</p>
            <p className="mt-3 text-3xl font-bold text-amber-300">
              {assignments.filter((a) => a.status === 'pending').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
