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
    <div className="bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex min-h-9 items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            <Rocket className="h-4 w-4" />
            Getting Started
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-foreground sm:text-4xl">Welcome to NMD Logistics</h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
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
                      ? 'bg-success text-success-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {completedSteps.includes(step) ? <CheckCircle2 className="h-6 w-6" /> : step}
                </div>
                {i < 3 && (
                  <div
                    className={`h-1 flex-1 transition ${
                      completedSteps.includes(step) ? 'bg-success-foreground' : 'bg-muted'
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
              <div
                key={step.number}
                className={`surface-glass relative rounded-lg border p-5 transition ${
                    isCompleted
                      ? 'border-success/50 bg-success/30'
                      : 'border-border hover:border-ring/50'
                  }`}
              >
                <button
                  type="button"
                  aria-expanded={isCompleted}
                  aria-label={`${step.title}: ${isCompleted ? 'mark incomplete' : 'mark complete'}`}
                  onClick={() => toggleStep(step.number)}
                  className="w-full rounded-md text-left pr-14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition ${
                          isCompleted
                            ? 'bg-success text-success-foreground'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                            Step {step.number}
                          </span>
                          {isCompleted && (
                            <span className="text-xs font-bold text-success-foreground">✓ Completed</span>
                          )}
                        </div>
                        <h3 className="mt-1 text-lg font-semibold text-foreground">{step.title}</h3>
                        <p className="mt-1 text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  {isCompleted && (
                    <div className="mt-4 space-y-2 border-t border-border pt-4">
                      {step.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                          <CheckCircle2 className="h-4 w-4 text-success-foreground" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  )}
                </button>
                <Link
                  href={step.href}
                  aria-label={`${step.action}: ${step.title}`}
                  title={step.action}
                  className="absolute right-5 top-5 inline-flex min-h-11 min-w-11 items-center justify-center rounded-md bg-primary/10 p-2 text-primary transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Quick Tips */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Quick Tips</h2>

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
                className="surface-glass h-full rounded-lg border border-border p-4"
              >
                <h4 className="font-semibold text-foreground">{tip.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="surface-glass rounded-lg border border-primary/30 bg-primary/5 p-6 text-center sm:p-8">
          <h3 className="text-xl font-semibold text-foreground">Ready to get started?</h3>
          <p className="mt-2 text-muted-foreground">Follow the steps above to set up your operations</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/help"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-background px-4 py-2.5 font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              View Documentation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
