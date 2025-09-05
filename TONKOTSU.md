# REPO CONTEXT
This file contains important context about this repo for [Tonkotsu](https://www.tonkotsu.ai) and helps it work faster and generate better code.

## Technology Stack
- Next.js 15 with TypeScript
- React 19
- Tailwind CSS
- pnpm as package manager
- Radix UI components
- Supabase

## Commands

### Initial Setup
```bash
pnpm install
```

### Running Build
```bash
pnpm build
```

### Running Lint
```bash
pnpm lint
```

### Running Tests
No test framework is currently configured in this project.

### Running Dev Server
```bash
pnpm dev
```

## Project Structure
This is a Next.js application with the following structure:
- `app/` - Next.js app router pages and layouts with server actions
- `components/` - Reusable UI components including profile forms and job application dialog
- `hooks/` - Custom React hooks including job management hooks
- `lib/` - Utility functions, database types, validations, job search functions, server actions, and Supabase configurations
- `styles/` - CSS and styling files
- `public/` - Static assets
- `supabase/` - Database schema and seed files
- `middleware.ts` - Route protection and role-based access control