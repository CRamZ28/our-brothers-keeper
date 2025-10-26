# Our Brother's Keeper - Replit Project Documentation

## Overview
Our Brother's Keeper is a compassionate platform that helps families and communities provide sustained, meaningful support to those who have lost a loved one. The application features a needs board, shared calendar, messaging, and update tracking to help coordinate support during difficult times.

**Current Status**: Successfully imported and running on Replit
**Last Updated**: October 26, 2025

## Project Architecture

### Technology Stack
- **Frontend**: React 19 with Vite 7, TypeScript, Tailwind CSS
- **Backend**: Express.js with tRPC for type-safe API
- **Database**: MySQL (using Drizzle ORM)
- **Package Manager**: pnpm
- **Runtime**: Node.js 20

### Project Structure
```
my-brothers-keeper/
├── client/              # Frontend React application
│   ├── public/          # Static assets
│   └── src/             # React components, pages, and hooks
├── server/              # Backend Express server
│   ├── _core/           # Core server functionality (auth, context, etc.)
│   └── *Router.ts       # tRPC routers for different features
├── shared/              # Shared types and constants
├── drizzle/             # Database schema and migrations
└── vite.config.ts       # Vite configuration
```

## Development Setup

### Environment Variables
The project requires several environment variables configured in `my-brothers-keeper/.env`:

**Required Variables:**
- `DATABASE_URL`: MySQL database connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `VITE_APP_ID`: Application identifier
- `VITE_OAUTH_PORTAL_URL`: OAuth server URL
- `OAUTH_SERVER_URL`: Backend OAuth server URL

**Optional Variables:**
- `VITE_APP_TITLE`: Application title (defaults to "Our Brother's Keeper")
- `VITE_APP_LOGO`: Application logo URL
- `BUILT_IN_FORGE_API_URL`: Forge API endpoint (for image generation, etc.)
- `BUILT_IN_FORGE_API_KEY`: Forge API key

### Development Server
The development server runs on port 5000 and serves both the frontend (via Vite) and backend (Express).

**Command**: `pnpm run dev`
**Runs**: `tsx watch server/_core/index.ts`

The server:
- Binds to `0.0.0.0:5000` for Replit compatibility
- Serves Vite dev server in development mode
- Serves static files from `dist/public` in production mode
- Provides tRPC API endpoints at `/api/trpc`

## Replit-Specific Configuration

### Recent Changes (October 26, 2025)
1. **Vite Configuration** (`vite.config.ts`):
   - Added Replit domains to `allowedHosts`: `.replit.dev`, `.replit.app`, `.repl.co`
   - Configured server to bind to `0.0.0.0:5000`
   - Set `strictPort: true` to ensure port 5000 is used

2. **Server Configuration** (`server/_core/index.ts`):
   - Updated to bind to `0.0.0.0` for external access
   - Fixed port to 5000 for Replit compatibility
   - Removed dynamic port selection for predictable deployment

3. **Environment Variables**:
   - Added all required Vite environment variables
   - Configured OAuth URLs for local development

## Database Configuration

### Current Setup
The project is configured to use MySQL via Drizzle ORM. The schema includes tables for:
- Users and authentication
- Households (primary organizational unit)
- Groups and group members
- Invites
- Events and RSVPs
- Needs and need claims
- Messages and announcements
- Audit logs and notification preferences

### Database Migration
**Important**: The project currently requires a MySQL database. The `DATABASE_URL` in the `.env` file needs to be updated with a valid MySQL connection string.

To run migrations:
```bash
cd my-brothers-keeper
pnpm run db:push
```

## Deployment

### Deployment Configuration
- **Type**: VM deployment (stateful application)
- **Build Command**: `cd my-brothers-keeper && pnpm run build`
- **Run Command**: `cd my-brothers-keeper && pnpm run start`

The build command:
1. Builds the Vite frontend to `dist/public`
2. Bundles the backend server with esbuild to `dist/index.js`

The production server serves static files from `dist/public` and runs the tRPC API.

## Known Issues and Notes

### Development Warnings
- PWA service worker registration fails in development mode (expected behavior)
- Some Vite environment variables show warnings if not set (optional features)

### Database Requirement
The application requires a MySQL database to be fully functional. Currently, the database connection is configured but not connected. Users will need to:
1. Set up a MySQL database
2. Update the `DATABASE_URL` in `.env`
3. Run database migrations with `pnpm run db:push`

### OAuth Configuration
The OAuth configuration is set up for local development. For production deployment, the OAuth URLs need to be updated to match the deployed environment.

## Project Features

### Core Functionality
1. **Needs Board**: Coordinate and track support needs (meals, rides, errands)
2. **Shared Calendar**: Keep everyone informed about important events
3. **Messages**: Private communication between supporters and household
4. **Updates**: Share updates about the family's situation
5. **User Management**: Invite system for supporters with role-based access

### Authentication
- OAuth-based authentication system
- JWT-based session management
- Role-based access control (admin, supporter, user, primary)

## User Preferences
None recorded yet.
