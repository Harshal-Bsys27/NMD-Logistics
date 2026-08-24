# NMD Logistics - Architecture & Development Guide

## Project Foundation Summary

This document serves as a reference for the architectural decisions and patterns established during project initialization.

## Core Principles

### 1. **Production-First Mindset**
- Every file follows production standards
- No placeholder or temporary code
- Proper error handling and validation
- Security considered at each step

### 2. **Type Safety**
- TypeScript strict mode enabled
- All types defined in `types/index.ts`
- Zod for runtime validation
- No `any` types unless absolutely necessary

### 3. **Feature-Based Organization**
```
Each feature (orders, personnel, assignments) has:
- `/app/[feature]` - Pages and routes
- `/features/[feature]` - Business logic
- `/components/[feature]` - Feature-specific components
- Type definitions in `/types`
- Validation in `/lib/validations`
- Services in `/services`
```

### 4. **Scalable Database**
- Normalized schema with proper relationships
- Enums for status fields
- Audit trails for compliance
- Views for complex queries
- Indexes optimized for common operations
- RLS policies ready for implementation

## Directory Structure Reference

```
nmd-logistics/
├── app/                    # Next.js App Router
│   ├── api/               # API routes & server actions
│   ├── auth/              # Auth pages (signin, signup, etc.)
│   ├── dashboard/         # Dashboard pages
│   ├── orders/            # Orders module
│   ├── personnel/         # Personnel management
│   ├── assignments/       # Assignment management
│   ├── reports/           # Reports pages
│   ├── analytics/         # Analytics pages
│   ├── settings/          # Settings pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
│
├── components/            # Reusable components
│   ├── ui/               # Base UI (buttons, inputs, cards, dialogs, etc.)
│   ├── layout/           # Layout components (navbar, sidebar, footer)
│   ├── common/           # Common components (loaders, skeletons, empty states)
│   └── forms/            # Form components (with validation)
│
├── features/             # Feature modules (business logic)
│   ├── auth/             # Authentication logic
│   ├── orders/           # Orders business logic
│   ├── personnel/        # Personnel business logic
│   ├── assignments/      # Assignment business logic
│   ├── analytics/        # Analytics calculations
│   └── reports/          # Report generation
│
├── hooks/               # Custom React hooks
│   └── index.ts         # All custom hooks
│
├── lib/                 # Core utilities
│   ├── supabase/        # Supabase configuration
│   ├── errors.ts        # Error handling
│   └── validations/     # Zod schemas
│
├── services/            # Service layer
│   ├── auth.ts          # Auth operations
│   ├── orders.ts        # Orders operations
│   └── api.ts           # Generic API service
│
├── types/               # TypeScript types
│   └── index.ts         # All type definitions
│
├── utils/               # Utility functions
│   ├── helpers.ts       # Helper functions
│   └── constants.ts     # Application constants
│
├── database/            # Database configuration
│   └── schema.sql       # PostgreSQL schema
│
├── middleware/          # Next.js middleware
│   └── auth.ts          # Authentication middleware
│
├── public/              # Static assets
│
└── Config files         # Root configuration
    ├── next.config.js
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── postcss.config.js
    ├── .env.local
    ├── .eslintrc.json
    ├── .prettierrc.json
    ├── package.json
    └── Readme.md
```

## Pattern: Creating a New Feature

### 1. Define Types
```typescript
// types/index.ts - Add type definition
export interface MyFeature {
  id: string;
  name: string;
  // ... properties
}
```

### 2. Create Validation Schema
```typescript
// lib/validations/schemas.ts - Add schema
export const createMyFeatureSchema = z.object({
  name: z.string().min(2),
  // ... fields
});
```

### 3. Create Service Layer
```typescript
// services/myfeature.ts
export const myFeatureService = {
  async getAll() { /* ... */ },
  async getById(id: string) { /* ... */ },
  async create(data: CreateMyFeatureInput) { /* ... */ },
};
```

### 4. Create Page/Route
```typescript
// app/myfeature/page.tsx
'use client';
export default function MyFeaturePage() {
  // Implementation
}
```

### 5. Create Components
```typescript
// components/myfeature/MyFeatureCard.tsx
export function MyFeatureCard() {
  // Reusable component
}
```

## Common Code Patterns

### Error Handling
```typescript
try {
  const data = await operation();
  return { data, error: null };
} catch (error) {
  return { data: null, error };
}
```

### Form Validation
```typescript
const form = useForm<CreateOrderInput>({
  resolver: zodResolver(createOrderSchema),
  defaultValues: {},
});
```

### Data Fetching (TanStack Query)
```typescript
const { data, isPending, error } = useQuery({
  queryKey: ['orders', filters],
  queryFn: () => orderService.getAll(filters),
});
```

### Supabase Query
```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value)
  .limit(10);
```

## Database Operations

### Common Query Patterns

**Get single record:**
```sql
SELECT * FROM users WHERE id = $1
```

**List with pagination:**
```sql
SELECT * FROM orders 
ORDER BY created_at DESC 
LIMIT $1 OFFSET $2
```

**Count total records:**
```sql
SELECT COUNT(*) as total FROM orders 
WHERE status = $1
```

**Join multiple tables:**
```sql
SELECT o.*, dp.* FROM orders o
LEFT JOIN order_assignments oa ON o.id = oa.order_id
LEFT JOIN delivery_personnel dp ON oa.personnel_id = dp.id
```

## Security Best Practices

### 1. **Environment Variables**
- Never hardcode secrets
- Use `.env.local` for local development
- Reference: `.env.example`

### 2. **Input Validation**
- Validate all inputs with Zod
- Validate on both client and server
- Example: `signUpSchema` in schemas.ts

### 3. **Role-Based Access Control**
```typescript
// Check user role
if (!hasRole(user.role, ['admin', 'supervisor'])) {
  throw new ForbiddenError();
}
```

### 4. **Database Security**
- Use parameterized queries (automatic with Supabase)
- Enable RLS policies in Supabase
- Use service role key only on server

### 5. **Error Messages**
- Don't expose internal details
- Use generic messages for security errors
- Log errors server-side for debugging

## Performance Optimization

### 1. **Database Indexes**
All defined in schema.sql for:
- Frequent WHERE clauses
- Foreign keys
- Sorting columns
- Composite queries

### 2. **Query Optimization**
- Limit SELECT columns to needed ones
- Use pagination for large datasets
- Add WHERE conditions early

### 3. **Frontend Optimization**
- Debounce search input (500ms)
- Lazy load images
- Memoize expensive components
- Use TanStack Query for caching

## Development Workflow

### 1. **Running the Project**
```bash
npm run dev          # http://localhost:3000
npm run type-check   # Check TypeScript
npm run format       # Format code
npm run lint         # Lint code
```

### 2. **Testing Database**
- Use Supabase SQL Editor for schema testing
- Test queries before using in code

### 3. **Environment Setup**
- Copy `.env.example` to `.env.local`
- Add your Supabase credentials
- Never commit `.env.local`

## Deployment Checklist

### Pre-Deployment
- [ ] Run `npm run type-check` - no errors
- [ ] Run `npm run lint` - no errors
- [ ] Test authentication flow
- [ ] Test main CRUD operations
- [ ] Test on mobile/tablet
- [ ] Check dark mode
- [ ] Verify all environment variables

### Vercel Deployment
- [ ] Connect GitHub repository
- [ ] Set environment variables
- [ ] Configure build settings
- [ ] Test deployment preview

### Supabase Deployment
- [ ] Database schema deployed
- [ ] RLS policies configured
- [ ] Backups configured
- [ ] Environment variables set

## Future Enhancements

### Phase 2: Integrations
- Blue Dart API integration
- Excel import/export
- OCR document processing

### Phase 3: Advanced Features
- GPS tracking
- Real-time notifications
- AI Assistant
- Maps integration

### Phase 4: Enterprise
- Multi-tenant support
- Custom branding
- Advanced analytics
- Payment processing

## Helpful Commands

```bash
# Development
npm run dev              # Start development server
npm run type-check      # TypeScript validation
npm run format          # Format all code
npm run lint            # Lint all code

# Production
npm run build           # Production build
npm start              # Start production server

# Database (when using Supabase CLI)
npm run db:push        # Push schema changes
npm run db:pull        # Pull latest schema
```

## Resources & References

- **Next.js Docs:** https://nextjs.org/docs
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Zod Docs:** https://zod.dev
- **React Hook Form:** https://react-hook-form.com
- **TanStack Query:** https://tanstack.com/query

## Contact & Support

For questions or issues related to the architecture, refer to:
1. Code comments and JSDoc
2. This documentation
3. Type definitions in `types/index.ts`
4. Schema in `database/schema.sql`

---
**Project Version:** 1.0.0-alpha
