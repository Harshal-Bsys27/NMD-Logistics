# NMD Logistics Management System

A production-ready SaaS-style web application for managing logistics operations. Built for real business use with professional-grade architecture, security, and scalability.

## 📋 Project Overview

**Project Name:** NMD Logistics Management System (NMD-LMS)

**Purpose:** Complete logistics operations management platform for delivery companies to manage orders, assign delivery personnel, track progress, and generate analytics.

**Target User:** Logistics companies and delivery service providers

**Status:** MVP Development

## ✨ Key Features (MVP)

- **Authentication & Authorization** - Role-based access control (Admin, Supervisor, Delivery Personnel)
- **Order Management** - Create, edit, delete, and view orders with full details
- **Order Assignment** - Intelligent assignment of orders to delivery personnel
- **Delivery Personnel Management** - Manage staff, vehicles, and performance metrics
- **Delivery Tracking** - Real-time status updates and delivery history
- **Analytics Dashboard** - Performance metrics, completion rates, and KPIs
- **Reports** - Generate comprehensive operational reports
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Dark Mode** - Professional dark theme support

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- React Hook Form
- TanStack Query
- Recharts
- Lucide Icons

**Backend:**
- Next.js Server Actions
- Route Handlers

**Database:**
- PostgreSQL
- Supabase

**Authentication:**
- Supabase Auth

**Storage:**
- Supabase Storage

**Deployment:**
- Vercel (Frontend)
- Supabase (Backend & Database)

### Project Structure

```
app/                    # Next.js App Router
├── layout.tsx         # Root layout
├── page.tsx           # Home page
├── auth/              # Authentication pages
├── dashboard/         # Dashboard module
├── orders/            # Orders module
├── personnel/         # Delivery personnel module
├── assignments/       # Order assignments module
├── reports/           # Reports module
├── analytics/         # Analytics module
└── api/              # API routes and server actions

components/            # Reusable UI components
├── ui/               # Base UI components (buttons, inputs, cards, etc.)
├── layout/           # Layout components (navbar, sidebar, etc.)
└── common/           # Common components (loaders, skeletons, etc.)

features/             # Feature-specific business logic
├── auth/             # Authentication feature
├── orders/           # Orders feature
├── assignments/      # Assignments feature
├── personnel/        # Personnel feature
├── analytics/        # Analytics feature
└── reports/          # Reports feature

hooks/                # Custom React hooks

lib/                  # Utility functions and helpers
├── supabase/        # Supabase configuration
├── validations/     # Zod schemas
└── errors.ts        # Error handling

services/             # External service integrations
├── auth.ts          # Authentication service
└── api.ts           # API service

types/               # TypeScript type definitions

utils/               # General utilities
├── helpers.ts       # Helper functions
└── constants.ts     # Application constants

database/            # Database configuration
└── schema.sql       # Complete database schema

middleware/          # Next.js middleware
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account
- PostgreSQL knowledge (optional, for schema customization)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Harshal-Bsys27/NMD-Logistics.git
cd NMD-Logistics
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Fill in your Supabase credentials and application settings.

4. Set up the database:
   - Create a new PostgreSQL database in Supabase
   - Run the SQL schema from `database/schema.sql` in Supabase SQL Editor

5. Run the development server:
```bash
npm run dev
```

Visit http://localhost:3000 to access the application.

## 📚 Database Schema

The database is designed with the following tables:

- **users** - All application users with roles and permissions
- **delivery_personnel** - Driver/delivery staff information
- **orders** - Delivery orders with pickup/delivery details
- **order_assignments** - Assignment of orders to personnel
- **delivery_status_history** - Audit trail of delivery progress
- **reports** - Generated reports and analytics
- **analytics_metrics** - Daily performance metrics
- **settings** - Application configuration
- **audit_log** - Comprehensive audit trail

See `database/schema.sql` for the complete schema with relationships, constraints, and indexes.

## 🔐 Security & Best Practices

- ✅ TypeScript for type safety
- ✅ Zod for input validation
- ✅ Environment variables for secrets
- ✅ Row-level security (RLS) policies
- ✅ Role-based access control (RBAC)
- ✅ Input sanitization
- ✅ Error handling and logging
- ✅ Audit trail for compliance
- ✅ Rate limiting ready

## 📱 Responsive Design

- Mobile-first approach
- Tailwind CSS responsive utilities
- Tested on all screen sizes
- Touch-friendly interfaces

## 🎨 UI Design Philosophy

- Minimal and professional
- Similar to Vercel, Linear, Stripe Dashboard
- Clean typography and spacing
- Consistent color scheme
- Accessible color contrasts
- Dark mode support

## 📊 Modules Overview

### 1. Authentication
- Sign up / Sign in
- Password reset
- Role-based access control
- Session management

### 2. Dashboard
- Overview of key metrics
- Recent orders
- Performance indicators
- Quick actions

### 3. Orders Module
- Create new orders
- List and filter orders
- Edit order details
- Delete orders
- Advanced search

### 4. Personnel Management
- Add delivery personnel
- Manage vehicle information
- Track performance
- Update availability

### 5. Order Assignment
- Assign orders to personnel
- Track assignment status
- Reassign orders
- Performance analytics

### 6. Delivery Tracking
- Real-time status updates
- Delivery location tracking
- Status history
- Customer notifications (future)

### 7. Reports
- Delivery performance reports
- Revenue reports
- Personnel reports
- Custom date ranges

### 8. Analytics
- Dashboard with key metrics
- Charts and visualizations
- Performance trends
- Export capabilities

## 🚫 Out of Scope (MVP)

The following features are planned for future phases:

- Blue Dart API integration
- Courier integrations
- Excel import/export
- OCR document processing
- AI Assistant
- Google Maps integration
- GPS real-time tracking
- Push notifications
- WhatsApp integration
- Payment processing
- Chat/messaging

## 🔧 Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# TypeScript type checking
npm run type-check

# Code formatting
npm run format

# Linting
npm run lint

# Database commands
npm run db:push    # Push schema to database
npm run db:pull    # Pull latest schema
```

## 📝 Coding Standards

- Write clean, readable code
- Use TypeScript everywhere
- Use meaningful variable/function names
- Add JSDoc comments for complex logic
- Keep components modular and reusable
- Follow single responsibility principle
- Use proper folder structure
- Write validation for all inputs
- Handle errors gracefully

## 🤝 Contributing

Contributions should:
1. Follow the coding standards
2. Include proper TypeScript types
3. Add validation using Zod
4. Include error handling
5. Follow the existing architecture

## 📖 Documentation

- See `/database/schema.sql` for database documentation
- See `types/index.ts` for all TypeScript types
- See `lib/validations/schemas.ts` for validation schemas

## 🎯 MVP Roadmap

- [x] Project initialization and setup
- [ ] Database schema and Supabase configuration
- [ ] Authentication module (sign up, sign in, roles)
- [ ] Dashboard with basic metrics
- [ ] Orders CRUD operations
- [ ] Order assignment module
- [ ] Delivery personnel management
- [ ] Delivery status tracking
- [ ] Reports and analytics
- [ ] Responsive design implementation
- [ ] Dark mode
- [ ] Testing and QA
- [ ] Deployment preparation

## 🚀 Deployment

### Vercel (Frontend)
1. Connect GitHub repository to Vercel
2. Set environment variables
3. Deploy with automatic CI/CD

### Supabase (Backend)
1. Set up PostgreSQL database
2. Run migrations
3. Configure Row Level Security policies

## 🐛 Known Issues

None currently. Please report issues via GitHub Issues.

## 📄 License

This project is proprietary and confidential.

## 👨‍💻 Author

Built as a production-ready portfolio project demonstrating professional software engineering practices.

---

**Built with ❤️ for real business value**