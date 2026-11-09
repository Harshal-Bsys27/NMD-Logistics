# NMD Logistics

NMD Logistics is a role-based logistics operations platform for managing delivery orders from dispatch through customer handoff. The project includes a web dashboard for operations staff, a native Android app for delivery personnel, and a Supabase backend.

## What it does

- Manage customers, orders, delivery personnel, assignments, and operational reports.
- Dispatch orders to available drivers and enforce order and assignment workflows.
- Let drivers accept work, update delivery progress, capture recipient acknowledgement and proof of delivery, and report failed delivery attempts.
- Give administrators and supervisors an operations queue for reviewing delivery issues and returning orders to dispatch.
- Send consent-based delivery emails and private customer tracking or feedback links.
- Keep operational data current with Supabase Realtime and refresh fallbacks.

### Operational workflows

1. Staff create an order and record the customer details and any email consent.
2. Staff release an eligible order to dispatch and assign an available driver.
3. The driver accepts the assignment, starts delivery, and records the outcome.
4. For a successful handoff, the driver records the recipient and delivery proof. For an unsuccessful attempt, the driver records an issue for staff follow-up.
5. Staff review delivery issues in the dashboard and can return a resolved order to the dispatch queue.
6. Customers can follow delivery milestones through a private tracking link. Delivery confirmation, tracking, and feedback email behavior depends on the relevant recorded consent and server configuration.

The database enforces important order and assignment transitions. The dashboard and driver app provide the user interface for those workflows, while Row Level Security and server-side authorization control access to data and privileged operations.

### User roles

| Role | Typical access |
|---|---|
| Administrator | Manage operations and staff access, including staff invitations |
| Supervisor | Manage logistics operations and review delivery issues |
| Delivery personnel | View and update their own assignments, record delivery proof, and report issues |
| Customer | No staff account required to view a delivery; uses a private tracking or feedback link when available |

Exact permissions are enforced in the application and database. See the [architecture guide](./docs/architecture/SYSTEM-OVERVIEW.md) for role boundaries and authentication details.

## Screenshots

Product screenshots are not currently included in this repository. When adding them, place reviewed images in `docs/screenshots/` and link them here. Use demo data only; remove customer or driver personal information, addresses, contact details, private tracking tokens, and other sensitive information before committing screenshots.

Suggested screenshots:

- Operations dashboard
- Dispatch board and assignment workflow
- Delivery issue review queue
- Customer tracking page with a demo order
- Driver app assignment and delivery proof screens

## Applications and technology

| Area | Technology |
|---|---|
| Web dashboard and API | Next.js App Router, React, TypeScript |
| UI | Tailwind CSS, shared React components, Recharts |
| Authentication and data | Supabase Auth, PostgreSQL, Row Level Security, Realtime |
| Driver app | React Native Android app |
| Customer email | Server-side Gmail SMTP integration |

The web app is at the repository root. The Android driver app is a separate React Native project in [`mobile-driver/`](./mobile-driver/).

## Getting started

### Requirements

- Node.js and npm
- Access to a configured Supabase project
- Docker Desktop only if you want to run the local Supabase stack

### Web dashboard

From the repository root, install dependencies and create your local environment file:

```powershell
npm install
Copy-Item .env.example .env.local
```

Set the Supabase URL and public anon/publishable key in `.env.local`. Set `NEXT_PUBLIC_APP_URL` to `http://localhost:3000` for local work. The server-only service role key is required only for server operations that use the Supabase admin client. Gmail settings are needed only to test customer email delivery.

The expected variable names and placeholders are in [`.env.example`](./.env.example). Do not copy real credentials into documentation, commit `.env.local`, or expose a server key to browser code.

Start the dashboard:

```powershell
npm run dev
```

Open the local URL printed by Next.js. The application uses invite-only staff access; see the [admin access guide](./docs/user-guides/ADMIN-ACCESS-AND-INVITATIONS.md) for initial administrator setup and staff invitations.

### Database

Database changes are maintained as ordered migrations in [`supabase/migrations/`](./supabase/migrations/). To inspect migration status for a linked project:

```powershell
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npm run db:status
```

Review the linked project and planned migrations before applying changes to any hosted database. Push migrations only when you intend to update that project:

```powershell
npm run db:push
```

For local database development, start Docker Desktop first:

```powershell
npm run db:start
npm run db:lint
```

`npm run db:reset` resets the **local** database and reapplies migrations; it deletes local database data. Never use it against a hosted project. Treat the migration files as the source of truth; [`database/schema.sql`](./database/schema.sql) is a reference snapshot, not an alternative migration path.

The first administrator must be provisioned by an authorized project owner; public self-registration is not the staff onboarding flow. Follow the [admin access guide](./docs/user-guides/ADMIN-ACCESS-AND-INVITATIONS.md) after configuring Supabase Auth and applying the required migrations.

### Android driver app

The driver app requires Node.js 22.11 or newer, Android Studio, Android SDK Platform 37, Android Build-Tools 37, and NDK 27.1.12297006. From `mobile-driver/`:

```powershell
Copy-Item .env.example .env
npm install
```

Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `NMD_WEB_APP_URL` in `mobile-driver/.env`. `GOOGLE_WEB_CLIENT_ID` is needed only if native Google sign-in is configured. Connect an Android device or start an emulator, then run:

```powershell
npm run android
```

See the [driver app guide](./mobile-driver/README.md) for Google sign-in configuration, standalone APK builds, and installation. Never put a Supabase service-role key or other server secret in the Android app.

## Customer communication

Customer-facing tracking and feedback use private links; customers do not need an account in the staff application. Email delivery requires the relevant customer consent, an email address, and server-side email configuration. The tracking page is intentionally limited to delivery milestones and does not expose internal delivery issue notes, proof media, driver details, or customer addresses.

See the [tracking and delivery issue guide](./docs/user-guides/CUSTOMER-DELIVERY-TRACKING.md), [feedback guide](./docs/user-guides/CUSTOMER-DELIVERY-FEEDBACK.md), and [email setup guide](./docs/user-guides/EMAIL-DELIVERY.md) for implementation and rollout details.

## Common checks

Run web checks from the repository root:

```powershell
npm run type-check
npm run lint
npm run build
```

Run driver app checks from `mobile-driver/`:

```powershell
npm run type-check
npm run lint
npm test -- --runInBand
```

## Project layout

| Path | Contents |
|---|---|
| `app/` | Web pages, layouts, and API routes |
| `components/` | Shared dashboard and UI components |
| `hooks/` | Authentication and operations data hooks |
| `lib/` | Supabase clients, validation, email, and application helpers |
| `services/` | Database and authentication operations |
| `types/` | Shared TypeScript types |
| `supabase/migrations/` | Ordered database schema and workflow changes |
| `database/` | Reference database schema snapshot |
| `mobile-driver/` | Native React Native driver application |
| `docs/` | Setup, architecture, and workflow guides |

## Security notes

- PostgreSQL Row Level Security and server-side authorization enforce access boundaries; hiding a page or button is not authorization.
- Keep `.env.local` and `mobile-driver/.env` out of source control.
- `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security. Use it only on the server and never expose it with a `NEXT_PUBLIC_` prefix.
- The Android app must use only the Supabase project URL and public anon/publishable key.
- Customer email is sent only where the relevant workflow has recorded consent. Keep private tracking tokens and delivery proof media out of logs and public pages.

## Documentation

- [Documentation index](./docs/README.md)
- [Project setup and deployment](./docs/getting-started/PROJECT-SETUP.md)
- [System architecture and access boundaries](./docs/architecture/SYSTEM-OVERVIEW.md)
- [Admin access and invitations](./docs/user-guides/ADMIN-ACCESS-AND-INVITATIONS.md)
- [Email delivery](./docs/user-guides/EMAIL-DELIVERY.md)
- [Customer delivery feedback](./docs/user-guides/CUSTOMER-DELIVERY-FEEDBACK.md)
- [Customer delivery tracking and delivery issues](./docs/user-guides/CUSTOMER-DELIVERY-TRACKING.md)
- [Android driver app setup](./mobile-driver/README.md)
