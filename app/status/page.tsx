'use client';

import { Activity, CheckCircle2, AlertTriangle, ShieldCheck, Server, Clock3 } from 'lucide-react';

const serviceHealth = [
  { name: 'Order Engine', status: 'Operational', tone: 'success', uptime: '99.98%', response: '182ms' },
  { name: 'Driver Routing', status: 'Stable', tone: 'info', uptime: '99.93%', response: '241ms' },
  { name: 'Assignment Sync', status: 'Operational', tone: 'success', uptime: '99.97%', response: '210ms' },
  { name: 'Notifications', status: 'Warning', tone: 'warning', uptime: '98.9%', response: '430ms' },
];

const incidents = [
  { time: 'Today • 09:30 IST', title: 'No active incidents', detail: 'All core services are stable and serving live logistics operations.' },
  { time: 'Yesterday • 18:40 IST', title: 'Routing latency spike', detail: 'Temporary increase resolved automatically by redundancy failover.' },
];

const phases = [
  { label: 'Planning', value: 100, color: 'bg-info-foreground' },
  { label: 'Execution', value: 92, color: 'bg-success-foreground' },
  { label: 'Monitoring', value: 88, color: 'bg-primary' },
];

export default function StatusPage() {
  return (
    <div className="bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="w-full space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-primary/10 p-3 text-primary">
            <Activity className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">System Status</h1>
            <p className="mt-1 text-muted-foreground">Live platform health overview for NMD Logistics</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="surface-glass h-full rounded-lg border border-success/30 bg-success p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-success-foreground">Platform</p>
              <CheckCircle2 className="h-5 w-5 text-success-foreground" />
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">Operational</p>
          </div>

          <div className="surface-glass h-full rounded-lg border border-info/30 bg-info p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-info-foreground">Avg. Response</p>
              <Clock3 className="h-5 w-5 text-info-foreground" />
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">248ms</p>
          </div>

          <div className="surface-glass h-full rounded-lg border border-primary/30 bg-primary/5 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Uptime</p>
              <Server className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">99.95%</p>
          </div>

          <div className="surface-glass h-full rounded-lg border border-warning/30 bg-warning p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-warning-foreground">Security</p>
              <ShieldCheck className="h-5 w-5 text-warning-foreground" />
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">Protected</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="surface-glass rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground">Service Health</h2>
            <div className="mt-6 space-y-4">
              {serviceHealth.map((service) => (
                <div key={service.name} className="rounded-md border border-border bg-muted/40 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{service.name}</p>
                      <p className="text-sm text-muted-foreground">Response: {service.response}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        service.tone === 'success' ? 'bg-success text-success-foreground' :
                        service.tone === 'info' ? 'bg-info text-info-foreground' :
                        'bg-warning text-warning-foreground'
                      }`}>
                        {service.status}
                      </span>
                      <span className="text-sm tabular-nums text-foreground">{service.uptime}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-glass rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground">Incident Summary</h2>
            <div className="mt-6 space-y-4">
              {incidents.map((incident) => (
                <div key={incident.title} className="rounded-md border border-border bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{incident.time}</p>
                  <h3 className="mt-2 font-semibold text-foreground">{incident.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{incident.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="surface-glass rounded-lg p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Operations Pulse</h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {phases.map((phase) => (
              <div key={phase.label} className="rounded-md border border-border bg-muted/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-foreground">{phase.label}</p>
                  <span className="text-sm tabular-nums text-muted-foreground">{phase.value}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted">
                  <div className={`h-2.5 rounded-full ${phase.color}`} style={{ width: `${phase.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
