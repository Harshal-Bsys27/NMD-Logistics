# Customer Delivery Feedback

The delivery-feedback workflow records recipient acknowledgement, emails a private feedback link after successful delivery, and gives administrators and supervisors an email and rating status page.

## Order creation

1. Enter the customer's email address.
2. Select **Customer agrees to receive a delivery confirmation and feedback request by email** only when the customer has given consent.
3. If consent is not recorded or no email is provided, delivery completion does not send an email.

Email is the initial channel. SMS is not used.

## Delivery handoff

The assigned driver records the recipient name and either:

- captures the recipient's on-screen signature; or
- selects the no-signature exception, provides a reason, and captures a proof photo.

The signature or exception, delivery proof, and assignment completion are stored through one database transaction. Proof images are kept in the private `delivery-proofs` bucket; authorized administrators and supervisors and the assigned driver can view them.

## Automatic email and customer feedback

After completion, the driver app or dashboard calls the server-side notification endpoint. The server verifies the delivery and order consent, creates a one-time feedback token, and sends a confirmation email through Gmail SMTP. The raw token is included only in the email; the database stores its SHA-256 hash. The link expires after 30 days and can be submitted once.

The **Customer feedback** page is available to administrators and supervisors. It shows notification status, email attempts and errors, customer feedback, and ratings. Failed or pending messages can be retried there.

## Server configuration

For an initial low-volume setup without a custom domain, use a separate NMD Gmail account. Gmail may enforce sending limits or block automated traffic; treat this as a trial setup, not a bulk or high-volume mail service.

1. In the NMD Gmail account, turn on **2-Step Verification** under Google Account → Security.
2. After 2-Step Verification is on, open Google Account → Security → **App passwords**. Create an app password named `NMD Logistics`. Google shows it once; copy it to a password manager. If Google does not offer App passwords, check that this is a regular Google account with 2-Step Verification enabled and not an account managed by an organization that disables them.
3. In Vercel project settings, add these environment variables to **Production**:
   - Key `GMAIL_SMTP_USER`; value: the full NMD Gmail address. This is configuration, not a password; it does not need to be marked sensitive.
   - Key `GMAIL_APP_PASSWORD`; value: the Google App Password (spaces may be omitted). Treat this as a secret and mark it sensitive if Vercel offers that option.
   - `NEXT_PUBLIC_APP_URL`: `https://nmd-logistics.vercel.app` (or the chosen public production origin).
4. Keep the App Password secret. Put it only in Vercel's server environment or a local, ignored `.env.local` when testing. Never place it in the Android app, any `NEXT_PUBLIC_` variable, source control, or chat. Do not use the Gmail account's normal password.
5. Confirm the Vercel project is linked to the intended Supabase project. Inspect pending migrations with `npm run db:status`; apply the migration with `npm run db:push` only after verifying the linked project and planned update window.
6. Deploy the dashboard code after the migration is applied. Install the newly built driver APK on all driver devices as part of the rollout. This release requires recipient acknowledgement for delivery completion; older app versions cannot complete a delivery under the new database policy.
7. Test with an email address you control, record explicit consent, and complete a test delivery. Check the email, one-time feedback form, rating/review, and Customer feedback status page. Avoid real-customer tests until the complete path is confirmed.

The driver app also needs `NMD_WEB_APP_URL` set to the deployed dashboard origin so it can call the authenticated notification endpoint. This URL is public configuration, not a secret.

For local development, set `NEXT_PUBLIC_APP_URL=http://localhost:3000` in `.env.local`. Add the Gmail variables locally only if you intend to send a test email to an address you control. Keep credentials out of Preview and local environments by default. Without Gmail variables, delivery still completes and the notification is marked failed for staff retry. Gmail SMTP cannot guarantee exactly-once delivery if the connection times out after Gmail accepted a message; check the NMD mailbox's Sent folder before retrying an ambiguous failure.

Do not treat the drawn acknowledgement as a legal signature without reviewing applicable consent and record-retention requirements.
