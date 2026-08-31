'use client';

import { useState } from 'react';
import { CheckCircle2, ArrowRight, Rocket, Users, Package, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const steps = [
  {
    number: 1,
    title: 'Set Up Your Team',
    description: 'Add drivers and manage your logistics team',
    icon: Users,
    action: 'Go to Drivers',
    href: '/drivers',
    features: [
      'Add driver profiles with vehicle information',
      'Track driver ratings and performance',
      'Monitor real-time driver availability',
    ],
  },
  {
    number: 2,
    title: 'Create Your First Order',
    description: 'Start managing deliveries right away',
    icon: Package,
    action: 'Create Order',
    href: '/orders/create',
    features: [
      'Specify pickup and delivery locations',
      'Set package details and priorities',
      'Add special instructions for drivers',
    ],
  },
  {
    number: 3,
    title: 'Assign & Track',
    description: 'Assign orders to drivers and track progress',
    icon: TrendingUp,
    action: 'View Assignments',
    href: '/assignments',
    features: [
      'Auto-assign orders based on location',
      'Track real-time delivery progress',
      'Update customers with ETA',
    ],
  },
  {
    number: 4,
    title: 'Monitor Analytics',
    description: 'Analyze performance and optimize operations',
    icon: TrendingUp,
    action: 'View Analytics',
    href: '/analytics',
    features: [
      'Track order completion rates',
      'Analyze driver performance metrics',
      'Export reports for stakeholders',
    ],
  },
];

export default function GettingStartedPage() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const toggleStep = (step: number) => {
    setCompletedSteps((prev) =>
      prev.includes(step) ? prev.filter((s) => s !== step) : [...prev, step]
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-12">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-300">
            <Rocket className="h-4 w-4" />
            Getting Started
          </div>
          <h1 className="mt-4 text-5xl font-bold text-white">Welcome to NMD Logistics</h1>
          <p className="mt-4 text-xl text-slate-400">
            Follow these steps to set up your logistics operations and start managing deliveries
          </p>
        </div>

        {/* Progress */}
        <div className="mx-auto w-full max-w-2xl">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step, i) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full font-bold text-lg transition ${
                    completedSteps.includes(step)
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {completedSteps.includes(step) ? <CheckCircle2 className="h-6 w-6" /> : step}
                </div>
                {i < 3 && (
                  <div
                    className={`h-1 flex-1 transition ${
                      completedSteps.includes(step) ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step) => {
            const Icon = step.icon;
            const isCompleted = completedSteps.includes(step.number);

            return (
              <button
                key={step.number}
                onClick={() => toggleStep(step.number)}
                className="w-full text-left"
              >
                <div
                  className={`surface-glass rounded-2xl border p-6 transition ${
                    isCompleted
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-slate-700/50 hover:border-slate-600/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition ${
                          isCompleted
                            ? 'bg-emerald-500/20'
                            : 'bg-cyan-500/20'
                        }`}
                      >
                        <Icon className={`h-6 w-6 ${isCompleted ? 'text-emerald-300' : 'text-cyan-300'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                            Step {step.number}
                          </span>
                          {isCompleted && (
                            <span className="text-xs font-bold text-emerald-400">✓ Completed</span>
                          )}
                        </div>
                        <h3 className="mt-1 text-xl font-bold text-white">{step.title}</h3>
                        <p className="mt-1 text-slate-400">{step.description}</p>
                      </div>
                    </div>
                    <Link
                      href={step.href}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-shrink-0 rounded-lg bg-cyan-500/20 p-2 text-cyan-300 transition hover:bg-cyan-500/30"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </div>

                  {/* Features */}
                  {isCompleted && (
                    <div className="mt-4 space-y-2 border-t border-slate-700/50 pt-4">
                      {step.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Tips */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Quick Tips</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: 'Driver Tracking', description: 'Monitor live driver availability, route progress, and delivery updates from the dashboard' },
              { title: 'Real-time Tracking', description: 'Monitor driver location and delivery progress live' },
              { title: 'Automated Assignments', description: 'System intelligently assigns orders based on driver capacity' },
              { title: 'Performance Metrics', description: 'Track KPIs like delivery time, rating, and completion rate' },
              { title: 'Customer Notifications', description: 'Customers get automated updates at each delivery stage' },
              { title: 'Historical Data', description: 'All orders and assignments are logged for audits and reporting' },
            ].map((tip) => (
              <div
                key={tip.title}
                className="surface-glass rounded-xl border border-slate-700/50 p-4"
              >
                <h4 className="font-semibold text-white">{tip.title}</h4>
                <p className="mt-1 text-sm text-slate-400">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="surface-glass rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-8 text-center">
          <h3 className="text-2xl font-bold text-white">Ready to get started?</h3>
          <p className="mt-2 text-slate-400">Follow the steps above to set up your operations</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-600 hover:to-blue-600"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/help"
              className="rounded-xl border border-slate-700/50 bg-slate-800/50 px-6 py-3 font-semibold text-slate-300 transition hover:border-slate-600/50 hover:bg-slate-700/50"
            >
              View Documentation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
