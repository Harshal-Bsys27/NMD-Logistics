# Customer Delivery Tracking

Administrators and supervisors can email a customer a private link to follow order milestones on a mobile-friendly website. Customers do not need an account or app. Automatic update emails are sent only when the order records customer email consent.

## Send a tracking link

1. Open an order and confirm it has been released from draft, has the correct customer email address, and records the customer's consent to email.
2. Select **Email tracking link** in the **Customer tracking** section.
3. On assignment and when the driver starts the delivery, the customer automatically receives a concise status email with a private tracking link.
4. On delivery completion, the existing delivery confirmation/feedback email serves as the delivered update. No separate duplicate delivery email is sent.
5. Each email link opens `/track/<private-token>` on the configured `NEXT_PUBLIC_APP_URL`.
6. The tracking page refreshes automatically every 30 seconds; customers can also refresh manually.

Each tracking link expires after 30 days. Links from status emails are separate, so new emails do not invalidate earlier links. The page shows the order number, current status, and timestamps for order receipt, driver assignment, transit, and delivery. It does not expose customer addresses, phone numbers, package information, driver identity, or proof-of-delivery media. Tracking pages are excluded from search indexing.

## Security and email behavior

Each link uses a cryptographically random token. Only its SHA-256 hash is stored in `customer_tracking_links`; raw tokens are sent only to the customer. `customer_tracking_notifications` deduplicates automatic assignment and in-transit messages per assignment and event. Both tables are inaccessible to browser roles and are read only by server routes using the service role. The send endpoint is restricted to active administrators and supervisors, except that the assigned driver may send the in-transit update for their own active assignment.

Gmail SMTP acceptance does not guarantee inbox delivery. If a tracking email fails or goes to spam, verify the destination address and provider settings before sending another link. Each email contains a separate valid link.

## Setup and rollout

The dashboard needs the existing server-side `GMAIL_SMTP_USER`, `GMAIL_APP_PASSWORD`, and `NEXT_PUBLIC_APP_URL` configuration. For local testing, `NEXT_PUBLIC_APP_URL` must be a URL the customer test device can reach; do not email `localhost` links to another device.

Apply the `20261103220000_customer_delivery_tracking.sql` and `20261104010000_customer_tracking_status_notifications.sql` migrations to the intended Supabase project, then deploy the dashboard code and install the updated driver app. Test with an address you control: assign an order, start delivery, and complete it; verify the emails and tracking page, and confirm no addresses or driver details appear.
