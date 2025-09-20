# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application built with TypeScript that provides business scaling action plans using OpenAI integration. The app features:

- **Authentication**: Complete auth system with Supabase (sign up, login, password reset, OAuth)
- **Admin Panel**: User management with data tables (`/admin/user`)
- **Action Plans**: Core business feature for creating and managing scalable business action plans
- **AI Integration**: OpenAI GPT-4o-mini for generating business advice and action plans

## Development Commands

```bash
# Development (with Turbopack)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Architecture & State Management

### State Management Stack
- **Zustand**: Global state management (user state in `src/stores/user-store.ts`)
- **TanStack Query**: Server state, caching, and data fetching with automatic invalidation
- **Supabase**: Backend services, auth, and database

### Key Architectural Patterns
- **Service Classes**: Business logic encapsulated in service classes (e.g., `ActionPlanService`)
- **Custom Hooks**: Reusable logic in hooks like `useOpenAI` for AI interactions
- **Provider Pattern**: Context providers for Zustand and TanStack Query setup

## Database & Backend

### Supabase Integration
- **Database Types**: Generate types with `npx supabase gen types typescript --project-id "$PROJECT_REF" --schema public > database.types.ts`
- **Migrations**: Located in `supabase/migrations/` following `YYYYMMDDHHmmss_description.sql` format
- **RLS Policies**: Must be created for all tables with granular permissions (separate policies for select/insert/update/delete)
- **Client Setup**: Multiple client configurations in `src/lib/supabase/` (client, server, middleware)

### Current Database Schema
- `action_plans` table for storing business action plans with steps and completion tracking
- User authentication handled by Supabase Auth

## UI & Styling

### Component System
- **Shadcn/ui**: Primary UI component library with "new-york" style
- **Tailwind CSS v4**: Utility-first styling with CSS variables
- **Radix UI**: Headless components for complex interactions
- **Lucide React**: Icon library

### Component Organization
- `src/components/ui/`: Shadcn components
- `src/components/`: Global reusable components only
- Page-specific components: Co-located with pages in `src/app/`

## API & External Services

### OpenAI Integration
- Custom hook `useOpenAI` for chat interactions
- API endpoint at `/api/openai`
- Default model: `gpt-4o-mini`
- Used for generating business scaling action plans

### HubSpot Integration
- Contact management API at `/api/hubspot/contacts`
- Environment variable: API key should be configured

## Environment Variables

Required environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Development Guidelines

### Database Changes
- Follow migration naming convention strictly
- Always enable RLS on new tables
- Create granular policies for each operation and role
- Include detailed comments in migrations

### Code Organization
- Use TypeScript strictly with proper typing
- Follow existing import alias patterns (`@/*`)
- Service classes for complex business logic
- Custom hooks for reusable stateful logic

### Authentication Flow
- Middleware handles route protection
- User state managed globally via Zustand
- Auth context provides user session management
- Admin routes protected at `/admin/*`

## Testing & Quality

- ESLint configured with Next.js and TypeScript rules
- No specific test framework currently configured
- Type checking via TypeScript compiler