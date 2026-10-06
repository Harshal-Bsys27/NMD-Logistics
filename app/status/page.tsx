'use client';

import { Activity, CheckCircle2, AlertTriangle, ShieldCheck, Server, Clock3 } from 'lucide-react';

const serviceHealth = [
  { name: 'Order Engine', status: 'Operational', tone: 'emerald', uptime: '99.98%', response: '182ms' },
  { name: 'Driver Routing', status: 'Stable', tone: 'cyan', uptime: '99.93%', response: '241ms' },
  { name: 'Assignment Sync', status: 'Operational', tone: 'emerald', uptime: '99.97%', response: '210ms' },
  { name: 'Notifications', status: 'Warning', tone: 'amber', uptime: '98.9%', response: '430ms' },
];

const incidents = [
  { time: 'Today • 09:30 IST', title: 'No active incidents', detail: 'All core services are stable and serving live logistics operations.' },
  { time: 'Yesterday • 18:40 IST', title: 'Routing latency spike', detail: 'Temporary increase resolved automatically by redundancy failover.' },
];

const phases = [
  { label: 'Planning', value: 100, color: 'bg-cyan-500' },
  { label: 'Execution', value: 92, color: 'bg-emerald-500' },
  { label: 'Monitoring', value: 88, color: 'bg-violet-500' },
];

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/15 p-3">
            <Activity className="h-7 w-7 text-cyan-300" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">System Status</h1>
            <p className="mt-1 text-slate-400">Live platform health overview for NMD Logistics</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="surface-glass rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-emerald-300">Platform</p>
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="mt-3 text-3xl font-bold text-white">Operational</p>
          </div>

          <div className="surface-glass rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-cyan-300">Avg. Response</p>
              <Clock3 className="h-5 w-5 text-cyan-400" />
            </div>
            <p className="mt-3 text-3xl font-bold text-white">248ms</p>
          </div>

          <div className="surface-glass rounded-2xl border border-violet-500/30 bg-violet-500/10 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-violet-300">Uptime</p>
              <Server className="h-5 w-5 text-violet-400" />
            </div>
            <p className="mt-3 text-3xl font-bold text-white">99.95%</p>
          </div>

          <div className="surface-glass rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-amber-300">Security</p>
              <ShieldCheck className="h-5 w-5 text-amber-400" />
            </div>
            <p className="mt-3 text-3xl font-bold text-white">Protected</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="surface-glass rounded-2xl border border-slate-700/50 p-6">
            <h2 className="text-xl font-bold text-white">Service Health</h2>
            <div className="mt-6 space-y-4">
              {serviceHealth.map((service) => (
                <div key={service.name} className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-white">{service.name}</p>
                      <p className="text-sm text-slate-400">Response: {service.response}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        service.tone === 'emerald' ? 'bg-emerald-500/15 text-emerald-300' :
                        service.tone === 'cyan' ? 'bg-cyan-500/15 text-cyan-300' :
                        'bg-amber-500/15 text-amber-300'
                      }`}>
                        {service.status}
                      </span>
                      <span className="text-sm text-slate-300">{service.uptime}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-glass rounded-2xl border border-slate-700/50 p-6">
            <h2 className="text-xl font-bold text-white">Incident Summary</h2>
            <div className="mt-6 space-y-4">
              {incidents.map((incident) => (
                <div key={incident.title} className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{incident.time}</p>
                  <h3 className="mt-2 font-semibold text-white">{incident.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{incident.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="surface-glass rounded-2xl border border-slate-700/50 p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Operations Pulse</h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {phases.map((phase) => (
              <div key={phase.label} className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-white">{phase.label}</p>
                  <span className="text-sm text-slate-400">{phase.value}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-800">
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
