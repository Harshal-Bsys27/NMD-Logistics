# NMD Logistics Auth Email Delivery

Supabase Auth sends invitation and account emails for this application. The app does not send invitation email directly.

## Required invitation template and redirect

1. In Supabase, open **Authentication → Email Templates → Invite user**.
2. Keep the Supabase confirmation URL placeholder `{{ .ConfirmationURL }}` in the template's invitation link.
3. In **Authentication → URL Configuration**, allow the exact app callback URL:
   - Local development: `http://localhost:3000/auth/callback`
   - Deployment: `https://<your-app-host>/auth/callback`
4. Set `NEXT_PUBLIC_APP_URL` to the app's origin:
   - Local development: `http://localhost:3000`
   - Deployment: `https://<your-app-host>`
5. Restart the app after changing the environment variable. The invitation API uses this origin for its callback; if it is unset, it falls back to the request origin. Never send invitations from localhost to remote invitees.

## Option A: Supabase default sender (testing only)

Supabase's built-in sender is limited and generally delivers only to authorized addresses associated with the Supabase organization. Supabase documents low rate limits and no delivery SLA for this sender. Use it only to test templates and flows with an authorized address; do not rely on it for staff onboarding.

## Option B: Gmail SMTP (possible low-volume workaround)

If your Google account permits App Passwords, it may be possible to use Gmail's SMTP server without owning a domain. Google can restrict this option, and consumer Gmail is not intended as a production transactional email service.

1. Enable 2-Step Verification on the Google account.
2. Create a Google App Password. If the option is unavailable, do not use your regular Google password; select another SMTP provider.
3. In Supabase **Authentication → Email → SMTP Settings**, enable custom SMTP and use:

   | Setting | Value |
   |---|---|
   | Host | `smtp.gmail.com` |
   | Port | `465` |
   | Username | Full Gmail address |
   | Password | Google App Password |
   | Sender email | The same Gmail address |
   | Sender name | `NMD Logistics` |

4. Save the settings and send a test invitation to an address you control. Check Supabase Auth logs and the Google account's security settings if delivery fails.

Do not use the normal Google password, a Resend API key, or credentials committed in the repository. Keep SMTP credentials only in the Supabase dashboard/provider configuration.

## Option C: Transactional email provider

Providers such as Resend can supply SMTP credentials for Supabase. Resend requires a verified sending domain; a Gmail address or a shared free hosting subdomain is not a domain you own and cannot be verified as the sender domain. Other providers may have different verification, sender, and trial rules; check their current documentation before setup.

For a stable production setup, use a domain you control and configure the provider's requested DNS records for SPF, DKIM, and (where offered) DMARC.

## Troubleshooting checklist

- Custom SMTP is enabled and all credentials are correct.
- Sender email is accepted/verified by the selected provider.
- The **Invite user** template contains `{{ .ConfirmationURL }}`.
- Supabase **URL Configuration** permits the exact callback URL and port.
- `NEXT_PUBLIC_APP_URL` is set to the reachable app origin in the deployment environment.
- For remote invitees, the invitation was sent from the deployed app origin, not localhost.
- Check Supabase Auth logs, provider logs, inbox spam/junk, and provider limits.
- Run one test invite at a time; don't repeatedly send while troubleshooting rate limits.

Official references:

- [Supabase: Send emails with custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Resend: Send emails using Supabase with SMTP](https://resend.com/docs/send-with-supabase-smtp)
- [Google: Sign in with App Passwords](https://support.google.com/accounts/answer/185833?hl=en)
