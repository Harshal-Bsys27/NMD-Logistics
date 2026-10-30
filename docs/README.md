# NMD Logistics Documentation

Welcome to the project documentation. Start with the guide that matches what you need to do.

## Guides

| Document | What it covers |
|---|---|
| [Project setup](./getting-started/PROJECT-SETUP.md) | Local development, environment variables, Supabase setup, migrations, and deployment |
| [Admin access and invitations](./user-guides/ADMIN-ACCESS-AND-INVITATIONS.md) | First administrator bootstrap, role permissions, inviting supervisors and delivery personnel, and troubleshooting access |
| [Email delivery](./user-guides/EMAIL-DELIVERY.md) | Supabase Auth email templates, SMTP providers, no-domain testing options, and invite links |
| [System architecture](./architecture/SYSTEM-OVERVIEW.md) | Current application structure, authentication flow, role boundaries, and database workflow |

## Source-of-truth files

- Database changes are tracked in [`supabase/migrations/`](../supabase/migrations/).
- Environment variable names are listed in [`.env.example`](../.env.example). Keep real values in `.env.local`.
- The TypeScript application types are in [`types/index.ts`](../types/index.ts).
- Validation schemas are in [`lib/validations/schemas.ts`](../lib/validations/schemas.ts).
- [`database/schema.sql`](../database/schema.sql) is a reference snapshot; use the tracked migrations as the source of truth for applying changes.

If these guides disagree with current application behavior, verify the code and migrations and update the documentation in the same change.
