# Our Brother's Keeper - Replit Project Documentation

## Overview
Our Brother's Keeper is a compassionate platform that helps families and communities provide sustained, meaningful support to those who have lost a loved one. The application features a needs board, shared calendar, messaging, and update tracking to help coordinate support during difficult times.

**Current Status**: ✅ Fully operational on Replit with PostgreSQL and Replit Auth
**Last Updated**: October 27, 2025 (Added glassmorphism UI design to all dashboard pages + edit/delete functionality)

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
- `VITE_APP_LOGO`: Application logo URL (currently set to `/obk-logo.png` - custom wooden cross logo)
- `BUILT_IN_FORGE_API_URL`: Forge API endpoint (for image generation, etc.)
- `BUILT_IN_FORGE_API_KEY`: Forge API key

**Twilio SMS Notifications (Pending Setup):**
- `TWILIO_ACCOUNT_SID`: Twilio account identifier (not yet configured)
- `TWILIO_AUTH_TOKEN`: Twilio authentication token (not yet configured)
- `TWILIO_PHONE_NUMBER`: Twilio phone number for sending SMS (not yet configured)

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

### Glassmorphism Theme (October 27, 2025)
The application features a comprehensive modern glassmorphism design across all pages:

**Visual Elements:**
- **Gradient backgrounds**: Organic teal → blue → purple color flow throughout the application
- **Animated gradient orbs**: Three floating, pulsing gradient orbs (teal, purple, blue) that create depth and movement
- **Frosted glass cards**: Semi-transparent cards with backdrop-blur effects for a modern, layered look
- **Enhanced shadows**: Elevated shadow effects that respond to user interaction
- **Smooth transitions**: Hover effects that scale cards and increase shadow depth
- **Professional depth**: Layered effects create visual hierarchy and polish

**Pages with Glassmorphism:**
- Landing/Home page: Original design with gradient hero section
- Needs Board: Gradient background with frosted glass need cards
- Calendar: Gradient background with glass-effect event cards and navigation
- Messages/Announcements: Gradient background with glass announcement cards
- Updates: Gradient background with glass update cards and photo galleries

**Design System:**
- Color palette: Teal-500/600, Blue-500/600, Purple-500/600 for gradients
- Transparency: Cards use 60% white opacity (40% dark mode) with backdrop-blur
- Borders: Subtle white/20 opacity borders for definition
- Hover states: Scale to 102% with enhanced shadows
- Animation: Blob animations at 7s, 9s, and 11s intervals for organic movement

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
   - Group-based visibility: Restrict needs to specific groups (e.g., "Immediate Family" for picking up kids from school)
   - Visibility options: All Supporters, Specific Group, By Role, or Private
   - Priority levels and due dates for better organization
2. **Shared Calendar**: Keep everyone informed about important events
3. **Messages**: Private communication between supporters and household
4. **Updates**: Share updates about the family's situation
5. **User Management**: Invite system for supporters with role-based access
6. **Groups**: Organize supporters into groups (Immediate Family, Close Friends, etc.) for targeted needs and communications

### Authentication & Security
- Replit Auth with OpenID Connect (Google, GitHub, X, Apple, email/password)
- PostgreSQL-backed session management with auto-refresh
- Role-based access control (admin, supporter, user, primary)
- Secure session signing with SESSION_SECRET

## User Preferences
- **Design Style**: Modern glassmorphism with gradient backgrounds (teal → blue → purple)
- **Logo**: Custom wooden cross with "OBK" in teal (stored at `client/public/obk-logo.png`)

## Recent Updates

### October 27, 2025 - Glassmorphism UI & Edit/Delete Features
**UI Transformation:**
- Applied comprehensive glassmorphism design to all dashboard pages (Needs, Calendar, Messages, Updates)
- Added gradient backgrounds (teal → blue → purple) with animated orbs to create depth and movement
- Upgraded all cards to frosted glass effects with backdrop-blur and semi-transparency
- Enhanced hover interactions with scale animations and shadow elevation
- Created consistent visual language across the entire application

**Edit/Delete Functionality:**
- **Needs**: Full edit and delete capabilities with permission controls
  - Edit button opens dialog with all need fields pre-filled
  - Delete button with confirmation dialog
  - Permissions: Content creator OR admin/primary can edit/delete
  - Edit/delete buttons visible on need cards in all tabs
  
- **Events/Calendar**: Full edit and delete capabilities
  - Edit button opens dialog with all event fields pre-filled (including optional end date/time)
  - Delete button with confirmation in event detail view
  - Permissions: Event creator OR admin/primary can edit/delete
  - State management clears optional fields when not present (prevents stale data)

### October 26, 2025 - Group Filtering & Custom Logo

**Group Filtering for Needs:**
- Added visibility scope controls to needs creation form
- Users can now restrict needs to specific groups (e.g., "Immediate Family" for sensitive requests like picking up kids from school)
- Visibility options include:
  - **All Supporters**: Everyone can see and claim the need
  - **Specific Group**: Only members of selected group can see (e.g., Immediate Family, Close Friends)
  - **By Role**: Only Admin/Primary can see
  - **Private**: Only Primary can see
- Group selection dropdown appears when "Specific Group" is selected
- Form validates that a group is selected when using group visibility

**Custom Logo Integration:**
- Added custom OBK logo (wooden cross design) to `client/public/obk-logo.png`
- Updated `.env` file to reference the logo: `VITE_APP_LOGO=/obk-logo.png`
- Logo appears throughout the application in navigation and branding

**Twilio SMS Notifications (Planned):**
- User declined Replit Twilio integration
- Manual Twilio setup will be required when credentials are provided
- Will enable SMS notifications for urgent needs, event reminders, and important announcements
