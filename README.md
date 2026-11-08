# NMD Logistics Management System

NMD Logistics is a role-based operations platform for managing delivery orders, assignments, delivery personnel, and logistics reporting. It is built with Next.js, TypeScript, and Supabase.

## Documentation

Project documentation is organized under [`docs/`](./docs/).

- [Documentation index](./docs/README.md)
- [Getting started and project setup](./docs/getting-started/PROJECT-SETUP.md)
- [Admin access and staff invitations](./docs/user-guides/ADMIN-ACCESS-AND-INVITATIONS.md)
- [Email delivery and SMTP](./docs/user-guides/EMAIL-DELIVERY.md)
- [System architecture](./docs/architecture/SYSTEM-OVERVIEW.md)

## Quick start

Requirements: Node.js, npm, and a Supabase project.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Configure `.env.local` with the Supabase project values listed in [`.env.example`](./.env.example). Apply database migrations and complete the initial administrator setup by following the [project setup guide](./docs/getting-started/PROJECT-SETUP.md) and [admin invitations guide](./docs/user-guides/ADMIN-ACCESS-AND-INVITATIONS.md).

## Technology

- Next.js App Router, React, and TypeScript
- Supabase Auth and PostgreSQL with Row Level Security
- Tailwind CSS and Recharts

## Common checks

```powershell
npm run type-check
npm run lint
npm run build
```

Database changes are tracked under [`supabase/migrations/`](./supabase/migrations/). See [the docs index](./docs/README.md) for additional project guides.
