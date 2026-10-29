'use client';

import { useMockDrivers, useMockAssignments } from '@/services/mockData';
import { useRouter } from 'next/navigation';
import { cn, toTitleCase } from '@/utils/helpers';
import { Award, MapPin, TrendingUp, Users, Search } from 'lucide-react';
import { useState } from 'react';

const statusColors: Record<string, { bg: string; text: string; badge: string }> = {
  available: { bg: 'bg-success', text: 'text-success-foreground', badge: 'bg-success text-success-foreground' },
  on_delivery: { bg: 'bg-info', text: 'text-info-foreground', badge: 'bg-info text-info-foreground' },
  on_break: { bg: 'bg-warning', text: 'text-warning-foreground', badge: 'bg-warning text-warning-foreground' },
  off_duty: { bg: 'bg-muted', text: 'text-muted-foreground', badge: 'bg-muted text-muted-foreground' },
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
    <div className="bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="w-full space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Drivers & Assignments</h1>
          <p className="mt-2 text-muted-foreground">Manage your delivery personnel and track active assignments</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="surface-glass h-full rounded-lg p-5">
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

          <div className="surface-glass h-full rounded-lg p-5">
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

          <div className="surface-glass h-full rounded-lg p-5">
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

          <div className="surface-glass h-full rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Avg Rating</p>
                <p className="mt-3 text-3xl font-bold tabular-nums text-warning-foreground">{avgRating}⭐</p>
              </div>
              <div className="rounded-md bg-warning p-3 text-warning-foreground">
                <Award className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by employee ID or vehicle number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-input bg-background px-12 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                className="surface-glass cursor-pointer rounded-lg border border-border p-5 transition hover:border-ring/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {/* Driver Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-2xl">
                      {vehicleEmojis[driver.vehicle_type]}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{driver.employee_id}</p>
                      <p className="text-xs text-muted-foreground">{toTitleCase(driver.vehicle_type)} Driver</p>
                    </div>
                  </div>
                  <span className={cn('inline-flex min-h-6 items-center rounded-full px-3 py-1 text-xs font-semibold', colors.badge)}>
                    {toTitleCase(driver.current_status)}
                  </span>
                </div>

                {/* Vehicle Info */}
                <div className="mt-6 rounded-md border border-border bg-muted/40 p-4">
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
                <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-md bg-muted/40 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Completed</p>
                    <p className="mt-2 font-bold tabular-nums text-foreground">{driver.total_deliveries_completed}</p>
                  </div>
                  <div className="rounded-md bg-muted/40 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Rating</p>
                    <p className="mt-2 font-bold tabular-nums text-warning-foreground">{driver.rating}⭐</p>
                  </div>
                  <div className="rounded-md bg-muted/40 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Active</p>
                    <p className="mt-2 font-bold tabular-nums text-info-foreground">{driverAssignments.length}</p>
                  </div>
                </div>

                {/* Current Assignment */}
                {activeAssignment && (
                  <div className="mt-6 rounded-md border-l-4 border-info-foreground bg-info p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-info-foreground">Currently Delivering</p>
                    <p className="mt-2 font-semibold text-foreground">{activeAssignment.notes || 'Order in transit'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Est. {activeAssignment.estimated_duration_minutes} mins</p>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/drivers/${driver.id}`);
                  }}
                  className="mt-6 min-h-11 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  View Details
                </button>
              </div>
            );
          })}
        </div>

        {filteredDrivers.length === 0 && (
          <div className="surface-glass rounded-lg border border-border py-12 text-center">
            <p className="text-muted-foreground">No drivers found matching your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
