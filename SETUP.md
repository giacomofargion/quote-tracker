# QuoteReality Setup Guide

## Phase 1: Database & Auth Foundation - Complete ✅

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Neon Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Database Setup

1. **Create a Neon Database Project**
   - Go to [Neon Console](https://console.neon.tech)
   - Create a new project
   - Copy the connection string to `DATABASE_URL`

2. **Run the Schema**
   - Execute the SQL in `lib/db/schema.sql` in your Neon SQL editor
   - This creates all necessary tables, indexes, and triggers
   - If you already had a database, run any SQL in `lib/db/migrations/` to add new columns (e.g. `001_add_project_description.sql` for the project description field)

### Clerk Setup

1. **Create a Clerk Application**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com)
   - Create a new application
   - Copy the publishable key and secret key to your `.env.local`

2. **Configure Clerk URLs** (Optional)
   - Defaults work for most cases
   - If needed, add to `.env.local`:
     ```env
     NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
     NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
     NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
     NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
     ```

### What's Been Implemented

✅ Neon database connection and schema
✅ Clerk authentication with middleware
✅ API routes for:
   - Projects (GET, POST, PATCH, DELETE)
   - Sessions (POST, DELETE)
   - Settings (GET, PATCH)
✅ Zustand store migrated from localStorage to API calls
✅ Loading states and error handling
✅ Timer persistence across page navigation
✅ Active timer indicator in sidebar
✅ User authentication guards on all routes
✅ Sign-in and sign-up pages

### Next Steps

Phase 2: UI Enhancements
- Install Framer Motion
- Add page transitions
- Animate key interactions
- Install Aceternity UI components
- Enhance visual components
