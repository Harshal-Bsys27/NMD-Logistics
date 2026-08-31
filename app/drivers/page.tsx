'use client';

import { useMockDrivers, useMockAssignments } from '@/services/mockData';
import { useRouter } from 'next/navigation';
import { cn, toTitleCase } from '@/utils/helpers';
import { Award, MapPin, TrendingUp, Users, Search } from 'lucide-react';
import { useState } from 'react';

const statusColors: Record<string, { bg: string; text: string; badge: string }> = {
  available: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', badge: 'bg-emerald-700' },
  on_delivery: { bg: 'bg-violet-500/10', text: 'text-violet-300', badge: 'bg-violet-700' },
  on_break: { bg: 'bg-amber-500/10', text: 'text-amber-300', badge: 'bg-amber-700' },
  off_duty: { bg: 'bg-slate-500/10', text: 'text-slate-400', badge: 'bg-slate-700' },
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
  const { drivers } = useMockDrivers();
  const { assignments } = useMockAssignments();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDrivers = drivers.filter((driver) =>
    driver.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDriverAssignments = (driverId: string) => {
    return assignments.filter((a) => a.personnel_id === driverId);
  };

  const avgRating = drivers.length > 0 ? (drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length).toFixed(1) : 0;
  const availableCount = drivers.filter((d) => d.current_status === 'available').length;
  const onDeliveryCount = drivers.filter((d) => d.current_status === 'on_delivery').length;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white">Drivers & Assignments</h1>
          <p className="mt-2 text-slate-400">Manage your delivery personnel and track active assignments</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="surface-glass rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Total Drivers</p>
                <p className="mt-3 text-3xl font-bold text-white">{drivers.length}</p>
              </div>
              <div className="rounded-xl bg-cyan-500/20 p-3">
                <Users className="h-6 w-6 text-cyan-300" />
              </div>
            </div>
          </div>

          <div className="surface-glass rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Available Now</p>
                <p className="mt-3 text-3xl font-bold text-emerald-300">{availableCount}</p>
              </div>
              <div className="rounded-xl bg-emerald-500/20 p-3">
                <MapPin className="h-6 w-6 text-emerald-300" />
              </div>
            </div>
          </div>

          <div className="surface-glass rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">On Delivery</p>
                <p className="mt-3 text-3xl font-bold text-violet-300">{onDeliveryCount}</p>
              </div>
              <div className="rounded-xl bg-violet-500/20 p-3">
                <TrendingUp className="h-6 w-6 text-violet-300" />
              </div>
            </div>
          </div>

          <div className="surface-glass rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Avg Rating</p>
                <p className="mt-3 text-3xl font-bold text-yellow-300">{avgRating}⭐</p>
              </div>
              <div className="rounded-xl bg-yellow-500/20 p-3">
                <Award className="h-6 w-6 text-yellow-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by employee ID or vehicle number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-12 py-3 text-sm text-white placeholder-slate-500 transition focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>

        {/* Drivers Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {filteredDrivers.map((driver) => {
            const colors = statusColors[driver.current_status];
            const driverAssignments = getDriverAssignments(driver.id);
            const activeAssignment = driverAssignments.find((a) => a.status === 'in_progress');

            return (
              <div
                key={driver.id}
                onClick={() => router.push(`/drivers/${driver.id}`)}
                className="surface-glass rounded-2xl border border-slate-700/50 p-6 transition cursor-pointer hover:border-slate-600/50"
              >
                {/* Driver Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 text-2xl">
                      {vehicleEmojis[driver.vehicle_type]}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{driver.employee_id}</p>
                      <p className="text-xs text-slate-400">{toTitleCase(driver.vehicle_type)} Driver</p>
                    </div>
                  </div>
                  <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', colors.badge)}>
                    {toTitleCase(driver.current_status)}
                  </span>
                </div>

                {/* Vehicle Info */}
                <div className="mt-6 rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
                  <div className="grid gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vehicle:</span>
                      <span className="font-semibold text-white">{driver.vehicle_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">License:</span>
                      <span className="font-semibold text-white">{driver.license_number || 'Pending'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Phone Verified:</span>
                      <span className="font-semibold text-emerald-300">{driver.phone_verified ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-slate-800/30 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Completed</p>
                    <p className="mt-2 font-bold text-white">{driver.total_deliveries_completed}</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/30 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Rating</p>
                    <p className="mt-2 font-bold text-yellow-300">{driver.rating}⭐</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/30 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Active</p>
                    <p className="mt-2 font-bold text-cyan-300">{driverAssignments.length}</p>
                  </div>
                </div>

                {/* Current Assignment */}
                {activeAssignment && (
                  <div className="mt-6 rounded-xl border-l-4 border-violet-500 bg-violet-500/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Currently Delivering</p>
                    <p className="mt-2 font-semibold text-white">{activeAssignment.notes || 'Order in transit'}</p>
                    <p className="mt-1 text-xs text-slate-400">Est. {activeAssignment.estimated_duration_minutes} mins</p>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/drivers/${driver.id}`);
                  }}
                  className="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90"
                >
                  View Details
                </button>
              </div>
            );
          })}
        </div>

        {filteredDrivers.length === 0 && (
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/50 py-12 text-center">
            <p className="text-slate-400">No drivers found matching your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
