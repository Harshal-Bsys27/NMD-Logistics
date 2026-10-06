'use client';

import { Code2, ArrowRight, ShieldCheck, Zap, Layers3 } from 'lucide-react';

const endpoints = [
  {
    method: 'GET',
    path: '/api/orders',
    description: 'Returns all active orders in the current workspace.',
    auth: 'Required',
  },
  {
    method: 'POST',
    path: '/api/orders',
    description: 'Creates a new order and stores the delivery payload.',
    auth: 'Required',
  },
  {
    method: 'PATCH',
    path: '/api/orders/:id',
    description: 'Updates the status and metadata for a specific order.',
    auth: 'Required',
  },
  {
    method: 'GET',
    path: '/api/assignments',
    description: 'Retrieves assignment data for driver dispatch activity.',
    auth: 'Required',
  },
  {
    method: 'POST',
    path: '/api/assignments',
    description: 'Creates or reassigns a driver to an order.',
    auth: 'Required',
  },
];

const samples = [
  {
    title: 'Authentication',
    body: `curl -X GET https://api.nmdlogistics.com/api/orders \\
  -H "Authorization: Bearer <token>"`,
  },
  {
    title: 'Create Order',
    body: `fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer <token>' },
  body: JSON.stringify({ client_name: 'Rajesh Kumar', pickup_location: 'Andheri', delivery_location: 'Powai' })
})`,
  },
];

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet-500/15 p-3">
            <Code2 className="h-7 w-7 text-violet-300" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">API Documentation</h1>
            <p className="mt-1 text-slate-400">Developer reference for the NMD Logistics backend</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="surface-glass rounded-2xl border border-slate-700/50 p-5">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <p className="mt-4 text-sm text-slate-400">Authentication</p>
            <p className="mt-2 text-xl font-bold text-white">JWT + RBAC</p>
          </div>
          <div className="surface-glass rounded-2xl border border-slate-700/50 p-5">
            <Zap className="h-6 w-6 text-cyan-400" />
            <p className="mt-4 text-sm text-slate-400">Latency</p>
            <p className="mt-2 text-xl font-bold text-white">p95 &lt; 300ms</p>
          </div>
          <div className="surface-glass rounded-2xl border border-slate-700/50 p-5">
            <Layers3 className="h-6 w-6 text-violet-400" />
            <p className="mt-4 text-sm text-slate-400">Resources</p>
            <p className="mt-2 text-xl font-bold text-white">Orders, Drivers, Assignments</p>
          </div>
        </div>

        <div className="surface-glass rounded-2xl border border-slate-700/50 p-6">
          <h2 className="text-xl font-bold text-white">Endpoints</h2>
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-700/50">
            <table className="min-w-full divide-y divide-slate-700/60 text-left text-sm">
              <thead className="bg-slate-900/80 text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">Path</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Auth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 bg-slate-950/40 text-slate-200">
                {endpoints.map((endpoint) => (
                  <tr key={`${endpoint.method}-${endpoint.path}`}>
                    <td className="px-4 py-3">
                      <span className="rounded bg-cyan-500/15 px-2 py-1 text-xs font-semibold text-cyan-300">
                        {endpoint.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-cyan-300">{endpoint.path}</td>
                    <td className="px-4 py-3 text-slate-300">{endpoint.description}</td>
                    <td className="px-4 py-3 text-slate-300">{endpoint.auth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {samples.map((sample) => (
            <div key={sample.title} className="surface-glass rounded-2xl border border-slate-700/50 p-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{sample.title}</h3>
                <ArrowRight className="h-5 w-5 text-cyan-300" />
              </div>
              <pre className="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-950/80 p-4 text-sm text-slate-300">
                <code>{sample.body}</code>
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
