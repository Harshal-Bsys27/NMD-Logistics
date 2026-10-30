'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, MailPlus, ShieldCheck, UserPlus } from 'lucide-react';

type InviteRole = 'supervisor' | 'delivery_personnel';

const fieldClassName = 'min-h-11 w-full rounded-lg border border-input bg-background px-3 text-foreground';

export default function UsersPage() {
  const [role, setRole] = useState<InviteRole>('supervisor');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const requestedRole = new URLSearchParams(window.location.search).get('role');
    if (requestedRole === 'delivery_personnel') setRole('delivery_personnel');
  }, []);

  const sendInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const form = event.currentTarget;
      const endpoint = role === 'supervisor' ? '/api/users' : '/api/drivers';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result?.error || 'Unable to send the invitation.');

      form.reset();
      setRole('supervisor');
      setSuccessMessage('Invitation sent. Ask them to check their inbox and spam folder, open the invitation link, verify their email, and set a password before signing in.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to send the invitation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Administrator</p>
        <h1 className="mt-2 text-3xl font-semibold">Invitations & staff access</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Invite a team member by email and choose the role they need. Only an active administrator can send invitations or manage staff access.
        </p>
      </header>

      <section aria-label="How invitations work" className="surface-glass rounded-xl border border-border p-5 sm:p-6">
        <h2 className="text-lg font-semibold">How access works</h2>
        <ol className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          <li className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">1</span>
            <span><strong className="text-foreground">You send an invite.</strong><br /><span className="text-muted-foreground">Enter their name, email, and role below.</span></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">2</span>
            <span><strong className="text-foreground">They open the email.</strong><br /><span className="text-muted-foreground">The invitation link verifies their email address.</span></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">3</span>
            <span><strong className="text-foreground">They set a password.</strong><br /><span className="text-muted-foreground">Then they sign in with the invited email and use their assigned role.</span></span>
          </li>
        </ol>
      </section>

      <form onSubmit={sendInvite} className="surface-glass space-y-6 rounded-xl border border-border p-5 sm:p-7">
        <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="text-sm leading-5 text-muted-foreground">
            <p>The role is assigned by the system and cannot be changed by the invitee.</p>
            <p className="mt-1"><span className="font-semibold text-foreground">Supervisor:</span> manages logistics operations. <span className="font-semibold text-foreground">Delivery personnel:</span> sees assigned work and updates delivery progress.</p>
            <p className="mt-1">Administrator access is not available in this form. A first administrator must be set up separately by the project owner.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium">
            Role
            <select
              value={role}
              onChange={(event) => {
                setRole(event.target.value === 'delivery_personnel' ? 'delivery_personnel' : 'supervisor');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={fieldClassName}
            >
              <option value="supervisor">Supervisor</option>
              <option value="delivery_personnel">Delivery personnel</option>
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Full name
            <input name="full_name" required minLength={2} maxLength={100} autoComplete="name" className={fieldClassName} />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Work email
            <input name="email" type="email" required autoComplete="email" className={fieldClassName} />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Indian phone number {role === 'supervisor' && <span className="font-normal text-muted-foreground">(optional)</span>}
            <input
              name="phone"
              type="tel"
              inputMode="numeric"
              pattern="[6-9][0-9]{9}"
              maxLength={10}
              autoComplete="tel-national"
              required={role === 'delivery_personnel'}
              className={fieldClassName}
            />
          </label>

          {role === 'delivery_personnel' && (
            <>
              <div className="sm:col-span-2">
                <h2 className="flex items-center gap-2 text-sm font-semibold"><UserPlus className="h-4 w-4 text-primary" />Delivery personnel details</h2>
                <p className="mt-1 text-sm text-muted-foreground">These details create their driver record so they can be assigned deliveries.</p>
              </div>
              <label className="space-y-1.5 text-sm font-medium">
                Employee ID
                <input name="employee_id" required minLength={3} maxLength={32} className={fieldClassName} />
              </label>
              <label className="space-y-1.5 text-sm font-medium">
                Vehicle type
                <select name="vehicle_type" required defaultValue="bike" className={fieldClassName}>
                  <option value="bike">Bike</option>
                  <option value="auto">Auto</option>
                  <option value="car">Car</option>
                  <option value="van">Van</option>
                  <option value="truck">Truck</option>
                </select>
              </label>
              <label className="space-y-1.5 text-sm font-medium">
                Vehicle number
                <input name="vehicle_number" required minLength={3} maxLength={20} className={fieldClassName} />
              </label>
              <label className="space-y-1.5 text-sm font-medium">
                License number <span className="font-normal text-muted-foreground">(optional)</span>
                <input name="license_number" maxLength={50} className={fieldClassName} />
              </label>
            </>
          )}
        </div>

        <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm leading-5 text-muted-foreground">
          <p className="font-semibold text-foreground">Email delivery must be configured</p>
          <p className="mt-1">Supabase sends the invitation email. To invite people outside your Supabase organization, configure a custom SMTP provider in the Supabase project under Authentication → Email → SMTP Settings. The Invite user email template must include its confirmation link.</p>
        </div>

        {errorMessage && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{errorMessage}
          </p>
        )}
        {successMessage && (
          <p role="status" className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{successMessage}
          </p>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
            <MailPlus className="h-4 w-4" />{loading ? 'Sending invitation…' : `Send ${role === 'supervisor' ? 'supervisor' : 'delivery personnel'} invite`}
          </button>
        </div>
      </form>
    </div>
  );
}
