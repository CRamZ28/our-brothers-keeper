# Our Brother's Keeper - Replit Project Documentation

## Overview
Our Brother's Keeper is a compassionate platform that helps families and communities provide sustained, meaningful support to those who have lost a loved one. The application features a needs board, shared calendar, messaging, and update tracking to help coordinate support during difficult times.

**Current Status**: ✅ Fully operational on Replit with PostgreSQL and Replit Auth
**Last Updated**: October 26, 2025

## Project Architecture

### Technology Stack
- **Frontend**: React 19 with Vite 7, TypeScript, Tailwind CSS
- **Backend**: Express.js with tRPC for type-safe API
- **Database**: PostgreSQL (using Drizzle ORM)
- **Authentication**: Replit Auth (OpenID Connect with Passport.js)
- **Session Store**: PostgreSQL (connect-pg-simple)
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
│   ├── replitAuth.ts    # Replit Auth configuration
│   └── *Router.ts       # tRPC routers for different features
├── shared/              # Shared types and constants
├── drizzle/             # Database schema and migrations
└── vite.config.ts       # Vite configuration
```

## Development Setup

### Environment Variables
The project requires these environment variables configured in `my-brothers-keeper/.env`:

**Required Variables:**
- `DATABASE_URL`: PostgreSQL database connection string (provided by Replit)
- `SESSION_SECRET`: Secret key for session signing
- `REPLIT_DOMAINS`: Comma-separated list of Replit domains for auth

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
- Exposes Replit Auth endpoints: `/api/login`, `/api/logout`, `/api/auth/user`

## Authentication System

### Replit Auth Integration
The application uses Replit's built-in authentication system (OpenID Connect) which provides:
- **Multiple login options**: Google, GitHub, X (Twitter), Apple, and email/password
- **Automatic user management**: Users are created/updated automatically on login
- **Secure session handling**: PostgreSQL-backed sessions with automatic refresh
- **Multi-domain support**: Works across all Replit domains (.replit.dev, .replit.app, .repl.co)

### Auth Flow
1. User clicks "Sign In" → redirected to `/api/login`
2. Replit Auth handles login via OpenID Connect
3. User profile synced to database (email, name, avatar from Replit profile)
4. Session stored in PostgreSQL
5. Frontend checks auth status via `/api/auth/user`

### Auth Endpoints
- `GET /api/login` - Initiate login flow
- `GET /api/logout` - Log out and clear session
- `GET /api/auth/user` - Get current user info (used by frontend)
- `GET /api/auth/callback` - OAuth callback (internal)

## Database Configuration

### PostgreSQL Schema
The database uses Drizzle ORM with PostgreSQL and includes 19 tables:
- **users**: User profiles (string-based IDs from Replit Auth)
- **households**: Primary organizational unit for families
- **groups**: Support groups within households
- **group_members**: Membership in groups
- **invites**: Pending user invitations
- **events**: Calendar events
- **event_rsvps**: Event responses
- **needs**: Support needs (meals, rides, etc.)
- **need_claims**: Claims on needs
- **messages**: Private messages
- **announcements**: Public announcements
- **updates**: Family updates
- **sessions**: Express session storage (managed by connect-pg-simple)
- **admin_groups**: Admin group definitions
- **admin_group_members**: Admin group membership
- **admin_messages**: Admin messaging
- **admin_message_recipients**: Admin message routing
- **notification_prefs**: User notification preferences
- **audit_logs**: Audit trail

### Key Schema Changes (October 26, 2025 Migration)
1. **Database Engine**: Migrated from MySQL to PostgreSQL
2. **User IDs**: Changed from integer to varchar (string) to support Replit Auth's OpenID `sub` claims
3. **Index Naming**: All 44 indices renamed to be globally unique (PostgreSQL requirement)
4. **Enums**: Converted to PostgreSQL pgEnum types
5. **Syntax**: Updated all operations to use PostgreSQL syntax (.returning(), onConflictDoUpdate)

### Running Migrations
To apply schema changes:
```bash
cd my-brothers-keeper
pnpm run db:push
```

## Design & UI

### Glassmorphism Theme
The application features a modern glassmorphism design with:
- **Gradient backgrounds**: Teal → Blue → Purple color scheme
- **Frosted glass effects**: Backdrop blur on cards and navigation
- **Animated orbs**: Subtle background animations for visual interest
- **Hover animations**: Interactive feedback on buttons and cards
- **Color-coded icons**: Teal backgrounds for feature cards
- **Enhanced typography**: Modern font styles with better hierarchy

## Replit-Specific Configuration

### Recent Changes (October 26, 2025)
1. **Authentication Migration**:
   - Removed custom OAuth system
   - Integrated Replit Auth (OpenID Connect)
   - Added session management with PostgreSQL storage
   - Updated all frontend auth flows to use `/api/login` and `/api/logout`

2. **Database Migration**:
   - Converted entire schema from MySQL to PostgreSQL
   - Updated all 44 index names to be globally unique
   - Changed user ID type from integer to varchar (string)
   - Updated all database operations to PostgreSQL syntax

3. **Vite Configuration** (`vite.config.ts`):
   - Added Replit domains to `allowedHosts`: `.replit.dev`, `.replit.app`, `.repl.co`
   - Configured server to bind to `0.0.0.0:5000`
   - Set `strictPort: true` to ensure port 5000 is used

4. **Server Configuration** (`server/_core/index.ts`):
   - Updated to bind to `0.0.0.0` for external access
   - Fixed port to 5000 for Replit compatibility
   - Integrated Replit Auth middleware

## Deployment

### Deployment Configuration
- **Type**: VM deployment (stateful application with sessions)
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

### Important Notes
- The application is now fully integrated with Replit Auth - no external OAuth setup required
- All user data is stored in Replit's managed PostgreSQL database
- Sessions are persisted in PostgreSQL for reliability across deployments

## Project Features

### Core Functionality
1. **Needs Board**: Coordinate and track support needs (meals, rides, errands)
2. **Shared Calendar**: Keep everyone informed about important events
3. **Messages**: Private communication between supporters and household
4. **Updates**: Share updates about the family's situation
5. **User Management**: Invite system for supporters with role-based access

### Authentication & Security
- Replit Auth with OpenID Connect (Google, GitHub, X, Apple, email/password)
- PostgreSQL-backed session management with auto-refresh
- Role-based access control (admin, supporter, user, primary)
- Secure session signing with SESSION_SECRET

## User Preferences
- **Design Style**: Modern glassmorphism with gradient backgrounds (teal → blue → purple)
- **Authentication**: Replit Auth (chosen over custom OAuth)
