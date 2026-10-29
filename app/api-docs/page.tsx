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
    <div className="bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="w-full space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-info p-3 text-info-foreground">
            <Code2 className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">API Documentation</h1>
            <p className="mt-1 text-muted-foreground">Developer reference for the NMD Logistics backend</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="surface-glass h-full rounded-lg p-5">
            <ShieldCheck className="h-6 w-6 text-success-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Authentication</p>
            <p className="mt-2 text-xl font-semibold text-foreground">JWT + RBAC</p>
          </div>
          <div className="surface-glass h-full rounded-lg p-5">
            <Zap className="h-6 w-6 text-info-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Latency</p>
            <p className="mt-2 text-xl font-semibold text-foreground">p95 &lt; 300ms</p>
          </div>
          <div className="surface-glass h-full rounded-lg p-5">
            <Layers3 className="h-6 w-6 text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Resources</p>
            <p className="mt-2 text-xl font-semibold text-foreground">Orders, Drivers, Assignments</p>
          </div>
        </div>

        <div className="surface-glass rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground">Endpoints</h2>
          <div className="mt-6 overflow-hidden rounded-md border border-border">
            <table className="min-w-full divide-y divide-border text-left text-sm">
              <thead className="bg-muted text-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">Path</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Auth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card text-card-foreground">
                {endpoints.map((endpoint) => (
                  <tr key={`${endpoint.method}-${endpoint.path}`}>
                    <td className="px-4 py-3">
                      <span className="rounded bg-info px-2 py-1 text-xs font-semibold text-info-foreground">
                        {endpoint.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-primary">{endpoint.path}</td>
                    <td className="px-4 py-3 text-muted-foreground">{endpoint.description}</td>
                    <td className="px-4 py-3 text-muted-foreground">{endpoint.auth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {samples.map((sample) => (
            <div key={sample.title} className="surface-glass rounded-lg p-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">{sample.title}</h3>
                <ArrowRight className="h-5 w-5 text-primary" />
              </div>
              <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 text-sm text-foreground">
                <code>{sample.body}</code>
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
