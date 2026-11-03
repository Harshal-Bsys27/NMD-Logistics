# Customer Delivery Tracking

Administrators and supervisors can email a customer a private link to follow order milestones on a mobile-friendly website. Customers do not need an account or app.

## Send a tracking link

1. Open an order and confirm it has been released from draft and has the correct customer email address.
2. Select **Email tracking link** in the **Customer tracking** section.
3. The link opens `/track/<private-token>` on the configured `NEXT_PUBLIC_APP_URL`.
4. The tracking page refreshes automatically every 30 seconds; customers can also refresh manually.

The tracking link expires after 30 days. It shows the order number, current status, and timestamps for order receipt, driver assignment, transit, and delivery. It does not expose customer addresses, phone numbers, package information, driver identity, or proof-of-delivery media. Tracking pages are excluded from search indexing.

## Security and email behavior

Each link uses a cryptographically random token. Only its SHA-256 hash is stored in `customer_tracking_links`; raw tokens are sent only to the customer. The table is inaccessible to browser roles and is read only by server routes using the service role. The send endpoint is restricted to active administrators and supervisors.

Gmail SMTP acceptance does not guarantee inbox delivery. If a tracking email fails or goes to spam, verify the destination address and provider settings before sending another link. Each email contains a separate valid link.

## Setup and rollout

The dashboard needs the existing server-side `GMAIL_SMTP_USER`, `GMAIL_APP_PASSWORD`, and `NEXT_PUBLIC_APP_URL` configuration. For local testing, `NEXT_PUBLIC_APP_URL` must be a URL the customer test device can reach; do not email `localhost` links to another device.

Apply the `20261103220000_customer_delivery_tracking.sql` migration to the intended Supabase project, then deploy the dashboard code. Test with an address you control: send a tracking link, open it in a private browser, check each status transition, and verify that no addresses or driver details appear.
