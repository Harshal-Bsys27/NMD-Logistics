# NMD Logistics System Architecture

This document describes the current implementation rather than an aspirational folder layout. Update it when significant application boundaries or access rules change.

## Application stack

- **Web application:** Next.js App Router, React, TypeScript, Tailwind CSS
- **Authentication and database:** Supabase Auth and PostgreSQL
- **Validation:** Zod schemas in `lib/validations/schemas.ts`
- **UI:** shared components under `components/`, route pages under `app/`
- **Operations data:** Supabase-backed services/hooks with Realtime updates and refresh fallback

## Main directories

| Path | Responsibility |
|---|---|
| `app/` | App Router pages, API route handlers, authentication flows |
| `components/` | Shared layout, navigation, auth, and UI components |
| `hooks/` | Client hooks, including auth/profile and operational data |
| `lib/supabase/` | Browser, server, and service-role Supabase clients |
| `lib/validations/` | Request and form schemas |
| `services/` | Authentication and database operations |
| `types/` | Shared application and database-facing TypeScript types |
| `supabase/migrations/` | Ordered source-of-truth database migrations |
| `database/schema.sql` | Reference schema snapshot; not a replacement for migrations |
| `docs/` | Maintained project documentation |

## Authentication and authorization

The app uses Supabase Auth for identity and `public.users` for the application profile and role. A profile has a role (`admin`, `supervisor`, or `delivery_personnel`) and status (`active`, `inactive`, or `suspended`).

- `middleware.ts` checks the signed-in user and active profile before protected routes.
- `AuthProvider` loads the profile once and shares the resolved profile with navigation and pages; it does not invent a fallback role while loading.
- Server API handlers independently verify the session and query the active user's profile before privileged operations.
- Database Row Level Security (RLS) policies are the final data boundary; UI visibility is not an authorization control.
- Public registration is disabled for the invite-only workflow.
- Initial admin provisioning is a manual, owner-controlled Supabase SQL operation documented in [Admin access and invitations](../user-guides/ADMIN-ACCESS-AND-INVITATIONS.md).

## Invitation flow

1. An active admin submits the **Invites & staff** form.
2. `/api/users` invites a supervisor; `/api/drivers` invites delivery personnel and creates their vehicle/personnel record.
3. The server assigns the role in Auth app metadata and creates an inactive `public.users` profile. The invitee cannot select or escalate their role.
4. Supabase sends the Invite user email to the invitee.
5. The callback validates the invite, and the invitee chooses a password.
6. The app activates the profile and refreshes the session. Middleware then allows access based on active profile and role.

Email delivery and callback URL setup are described in [Email delivery](../user-guides/EMAIL-DELIVERY.md).

## Role boundaries

- **Admin:** all logistics features and staff invitations/access management.
- **Supervisor:** logistics operations; cannot invite users or administer roles.
- **Delivery personnel:** their assignments and assigned work, with restricted progress updates.

API authorization and RLS enforce these boundaries independently of page and navigation visibility.

## Database workflows

Database changes are applied using ordered files in `supabase/migrations/`. The tracked migrations establish the schema, grants, RLS policies, workflow constraints/triggers, and realtime configuration.

The logistics assignment workflow and allowed status transitions are enforced in the database, not just in the UI. Review the current migration definitions before changing assignment or order behavior.

`OperationsDataProvider` keeps orders, personnel, and assignments available across client-side route changes, deduplicates concurrent fetches, and revalidates silently after stale tabs regain focus. Realtime events and a periodic foreground refresh keep the cached data current. Keep a single Next.js development server per checkout because all dev servers share the `.next` cache.

## Security boundaries

- `SUPABASE_SERVICE_ROLE_KEY` is server-only and bypasses RLS; keep its use inside server-side code.
- Client-side role checks are for user experience only. Protect API handlers and data with server checks and RLS.
- Validate API inputs with Zod before database or Auth operations.
- Never place secrets in documentation, source code, browser bundles, or committed environment files.
- Document any intentional changes to account onboarding, role assignment, or RLS in the admin guide and relevant migration.
