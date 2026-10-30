import Link from 'next/link';
import { ArrowRight, MailCheck, ShieldCheck } from 'lucide-react';
import Logo from '@/components/brand/Logo';
import ThemeToggle from '@/components/layout/ThemeToggle';

export default function SignUpPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-12 text-foreground">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle appearance="surface" />
      </div>
      <section className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-card sm:p-9">
        <Logo href="/" variant="adaptive" size="sm" />
        <div className="mt-9 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-primary">NMD Logistics workspace</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Accounts are invite-only</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          An administrator must invite you to the workspace. You’ll receive an email to verify your address and set your password before you can access your assigned role.
        </p>
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
          <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm leading-5 text-muted-foreground">
            Don’t have an invitation? Contact your NMD Logistics administrator. Email verification confirms your address; your invitation determines your access.
          </p>
        </div>
        <Link href="/auth/signin" className="mt-7 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
          Go to sign in <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}
