# NMD Logistics Project Setup

This guide covers setting up the application locally and connecting it to Supabase.

## Requirements

- Node.js and npm
- A Supabase project
- Docker Desktop only if running the local Supabase stack

## Install and configure

From the repository root:

```powershell
npm install
Copy-Item .env.example .env.local
```

In `.env.local`, configure the Supabase project values listed in the repository's [`.env.example`](../../.env.example):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service role/secret key |
| `NEXT_PUBLIC_APP_URL` | App origin, usually `http://localhost:3000` for development |
| `DATABASE_URL` | Database connection string if needed by your local tooling |

Never commit `.env.local`. Never expose the service-role key with a `NEXT_PUBLIC_` prefix or in browser code.

## Apply database migrations

To apply migrations to the linked hosted project:

```powershell
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npm run db:push
```

Review the linked project before pushing. The CLI may ask for the database password.

For a local Supabase instance, start Docker Desktop and run:

```powershell
npm run db:start
npm run db:lint
```

`npm run db:reset` resets the local database and reapplies migrations; it is destructive to local database data. Do not run it against a hosted project. The tracked migrations in `supabase/migrations/` are the source of truth. Do not separately execute `database/schema.sql` on a database already managed by migrations.

## Start the application

```powershell
npm run dev
```

Use the local URL printed by Next.js. Run one development server per checkout because Next.js servers share the `.next` directory and can cause confusing stale-asset errors.

Useful checks:

```powershell
npm run type-check
npm run lint
npm run build
```

## Configure sign-in

The application supports Supabase Auth. For Google OAuth:

1. Enable Google under Supabase **Authentication → Sign In / Providers**.
2. Create an OAuth client in Google Cloud.
3. Configure the Supabase callback URL shown by the provider configuration as an authorized redirect URI in Google.
4. Add the app callback URL (`<APP_ORIGIN>/auth/callback`) to Supabase **Authentication → URL Configuration → Redirect URLs**.

Only users with an active application profile can access the workspace. Google sign-in is not a self-service account creation path.

## Deployment notes

- Configure the same required environment variables in the hosting provider.
- Use the deployed app origin in `NEXT_PUBLIC_APP_URL`.
- Add the deployed `<APP_ORIGIN>/auth/callback` to Supabase's allowed redirect URLs.
- Keep public signup disabled when operating the app as invite-only.
- Complete the first-admin bootstrap in [Admin access and invitations](../user-guides/ADMIN-ACCESS-AND-INVITATIONS.md).
- Configure Auth email delivery as described in [Email delivery](../user-guides/EMAIL-DELIVERY.md).
