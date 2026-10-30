'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Check,
  ClipboardList,
  MapPinned,
  PackageCheck,
  Truck,
} from 'lucide-react';
import Logo from '@/components/brand/Logo';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { useAuth } from '@/hooks';

const workflow = [
  { step: '01', title: 'Create an order', description: 'Capture delivery details and prepare work for dispatch.', icon: ClipboardList, color: 'text-blue-700 dark:text-blue-300', iconBg: 'bg-blue-100 dark:bg-blue-400/15', cardBg: 'from-blue-50/80 dark:from-blue-400/10' },
  { step: '02', title: 'Assign a driver', description: 'Match available drivers to the work that needs to move.', icon: Truck, color: 'text-violet-700 dark:text-violet-300', iconBg: 'bg-violet-100 dark:bg-violet-400/15', cardBg: 'from-violet-50/80 dark:from-violet-400/10' },
  { step: '03', title: 'Track performance', description: 'Follow order progress and review operational trends.', icon: BarChart3, color: 'text-emerald-700 dark:text-emerald-300', iconBg: 'bg-emerald-100 dark:bg-emerald-400/15', cardBg: 'from-emerald-50/80 dark:from-emerald-400/10' },
];

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [loading, router, user]);

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[linear-gradient(110deg,#081638_0%,#102b63_60%,#17458a_100%)] text-on-brand shadow-[0_8px_30px_rgba(7,15,43,0.18)]">
        <nav className="container-main flex min-h-[68px] items-center justify-between gap-3 px-4 sm:min-h-[76px] sm:px-6 lg:px-8" aria-label="Main navigation">
          <Logo href="/" variant="onDark" size="sm" wordmarkClassName="hidden min-[380px]:inline" />
          <div className="flex items-center gap-1 sm:gap-3">
            <ThemeToggle />
            <Link href="/auth/signin" className="inline-flex min-h-10 items-center px-1 text-xs font-semibold text-on-brand/80 transition hover:text-on-brand sm:min-h-11 sm:px-3 sm:text-sm">
              Sign in
            </Link>
            <Link href="/auth/signup" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-bold text-accent-foreground shadow-[0_6px_18px_rgba(251,191,36,0.24)] transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-brand sm:min-h-11 sm:gap-2 sm:px-4 sm:text-sm">
              Get started <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#f6f9ff_0%,#eef4ff_52%,#f8faff_100%)] dark:bg-[linear-gradient(180deg,#0b1735_0%,#0d1d42_56%,#070f2b_100%)]">
          <div aria-hidden="true" className="pointer-events-none absolute -right-36 -top-32 h-[440px] w-[440px] rounded-full bg-primary/15 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 left-[-10rem] h-[420px] w-[420px] rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="container-main relative grid gap-10 px-4 py-12 sm:gap-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:px-8 lg:py-24">
            <div className="max-w-2xl">
              <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary shadow-sm dark:bg-white/5 sm:text-xs sm:tracking-[0.14em]">
                <span className="h-2 w-2 rounded-full bg-success" />
                Logistics operations, connected
              </p>
              <h1 className="mt-6 max-w-[13ch] text-[clamp(2.35rem,6vw,4.5rem)] font-bold leading-[1.04] tracking-[-0.045em] text-foreground sm:mt-7">
                Keep every delivery moving in the <span className="text-primary">right direction.</span>
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-7 text-muted-foreground sm:mt-6 sm:text-lg">
                Bring orders, dispatch, drivers, and performance insights into one clear workspace built for your logistics team.
              </p>
              <div className="mt-7 flex flex-col gap-3 min-[440px]:flex-row sm:mt-8">
                <Link href="/auth/signup" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-[0_10px_24px_rgba(29,78,216,0.22)] transition hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-6">
                  Get started <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/auth/signin" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-white/80 px-5 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/30 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-card sm:px-6">
                  Sign in
                </Link>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-muted-foreground sm:mt-8 sm:gap-x-6 sm:text-sm">
                {['Order visibility', 'Driver coordination', 'Live operational insights'].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" /> {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[560px] min-w-0">
              <div aria-hidden="true" className="absolute -inset-3 rounded-[32px] bg-gradient-to-br from-blue-400/25 via-indigo-300/10 to-amber-300/35 blur-xl sm:-inset-5 sm:blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-3 shadow-[0_24px_70px_rgba(22,45,95,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-card/90 sm:rounded-3xl sm:p-6">
                <div className="flex min-w-0 items-center justify-between gap-2 border-b border-border pb-3 sm:pb-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-primary sm:text-xs">Operations overview</p>
                    <h2 className="mt-1 text-sm font-bold sm:text-lg">One connected workflow</h2>
                  </div>
                  <span className="shrink-0 rounded-full border border-success/20 bg-success/10 px-2 py-1 text-[9px] font-semibold text-success sm:px-2.5 sm:text-xs">Platform preview</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-5 sm:gap-3">
                  {[
                    { label: 'Orders', icon: ClipboardList, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Drivers', icon: Truck, color: 'text-violet', bg: 'bg-violet/10' },
                    { label: 'Dispatch', icon: MapPinned, color: 'text-success', bg: 'bg-success/10' },
                  ].map(({ label, icon: Icon, color, bg }) => (
                    <div key={label} className="min-w-0 rounded-xl border border-border bg-background p-2.5 sm:p-4">
                      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${bg} ${color}`}>
                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                      <p className="mt-2 truncate text-xs font-bold sm:mt-3 sm:text-sm">{label}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">Connected</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-xl border border-border bg-background p-3 sm:mt-4 sm:p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold sm:text-sm">Order lifecycle</p>
                      <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">A clear path from creation to delivery</p>
                    </div>
                    <PackageCheck className="h-5 w-5 shrink-0 text-primary" />
                  </div>
                  <div className="mt-4 flex items-center sm:mt-5">
                    {['Created', 'Assigned', 'In transit', 'Delivered'].map((stage, index) => (
                      <div key={stage} className="flex min-w-0 flex-1 items-center last:flex-none">
                        <div className="flex min-w-0 flex-col items-center text-center">
                          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold sm:h-7 sm:w-7 sm:text-xs ${index === 0 ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground'}`}>
                            {index + 1}
                          </span>
                          <span className="mt-2 whitespace-nowrap text-[9px] font-medium text-muted-foreground sm:text-xs">{stage}</span>
                        </div>
                        {index < 3 && <span className="mx-1 mb-5 h-px flex-1 bg-border sm:mx-2" />}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-brand-950 to-brand-800 px-3 py-2.5 text-on-brand sm:mt-4 sm:gap-3 sm:px-4 sm:py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-on-brand/10 text-accent sm:h-9 sm:w-9">
                    <ArrowDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold sm:text-sm">From order to delivery</p>
                    <p className="text-[10px] text-on-brand/70 sm:text-xs">A workflow your whole team can follow</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative isolate overflow-hidden border-y border-border bg-white/70 dark:bg-card/60">
          <div aria-hidden="true" className="pointer-events-none absolute -right-36 top-12 h-72 w-72 rounded-full bg-violet-300/15 blur-3xl" />
          <div className="container-main px-5 py-16 sm:px-8 sm:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">A simpler operating rhythm</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">From order intake to delivery insight</h2>
              <p className="mt-4 leading-7 text-muted-foreground">Give every step a home, make handoffs visible, and help your team act on the same operational picture.</p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {workflow.map(({ step, title, description, icon: Icon, color, iconBg, cardBg }) => (
                <article key={step} className={`relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${cardBg} via-background to-background p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-card sm:p-6`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold tracking-[0.14em] ${color}`}>{step} <span className="sr-only">step</span></span>
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold tracking-tight">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="container-main px-5 py-14 sm:px-8 sm:py-16">
          <div className="relative isolate flex flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-950 via-brand-900 to-blue-900 px-6 py-8 text-on-brand shadow-[0_20px_50px_rgba(7,15,43,0.2)] sm:rounded-3xl sm:px-10 sm:py-10 md:flex-row md:items-center">
            <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 z-0 h-full w-full bg-[radial-gradient(circle_at_85%_15%,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_40%_110%,rgba(167,139,250,0.16),transparent_40%)]" />
            <div className="relative z-10">
              <h2 className="max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">Ready to bring your operations together?</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-on-brand/70">Sign in to your workspace or create an account to get started.</p>
            </div>
            <Link href="/auth/signup" className="relative z-10 inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-brand focus-visible:ring-offset-2 focus-visible:ring-offset-brand-950">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="container-main flex flex-col gap-4 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Logo href="/" variant="adaptive" size="sm" compact />
          <p>© {new Date().getFullYear()} NMD Logistics. Operations, made clearer.</p>
          <Link href="/auth/signin" className="font-medium transition hover:text-foreground">Sign in</Link>
        </div>
      </footer>
    </div>
  );
}
