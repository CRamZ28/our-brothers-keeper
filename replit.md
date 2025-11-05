# Our Brother's Keeper - Replit Project Documentation

## Overview
Our Brother's Keeper is a compassionate platform designed to help families and communities provide sustained support to those who have lost a loved one. The application facilitates coordination of care through features like a needs board, shared calendar, meal train, messaging, and update tracking. The project aims to offer a robust and user-friendly experience for managing community support during difficult times.

## User Preferences
- **Design Style**: Modern glassmorphism with gradient backgrounds (teal → blue → purple)
- **Logo**: Professional teal cross held by caring hands (stored at `client/public/obk-logo.png`) - w-16 h-16 size across the app
- **Scripture Font**: Pinyon Script for biblical verse (Galatians 6:2) on landing page

## System Architecture
The application is built with a React frontend (Vite, TypeScript, Tailwind CSS) and an Express.js backend utilizing tRPC for type-safe APIs. PostgreSQL is used as the database with Drizzle ORM, and Replit Auth handles authentication. The architecture emphasizes a clear separation of concerns with a `client/`, `server/`, and `shared/` directory structure.

### Key Features
- **Meal Train Management**: Full-featured meal coordination with:
  - **Day Scheduling System**: Admin/primary can select specific days for meals with quick options (Select All, Weekdays Only, Weekends Only, Clear All)
  - **Days Ahead Control**: Limit how far in advance supporters can sign up (configurable 1-365 days)
  - **Availability Enforcement**: Volunteers cannot sign up for unavailable days
  - Calendar and list views for meal signups
  - Daily capacity controls (1-10 volunteers per day)
  - Per-day capacity overrides for specific dates
  - Dual-layer privacy controls (meal train visibility + address visibility)
  - Dietary preferences (allergies, dislikes, favorite meals)
  - Special delivery instructions
  - Volunteer notes and status tracking
- **Group Management**: Full CRUD operations for organizing supporters
  - Create custom groups (e.g., Inner Circle, Church Friends)
  - Edit group names and descriptions
  - Manage group members with user selector interface
  - Delete groups with usage warnings
  - Member count tracking
  - Used for custom visibility controls on needs, events, and meal trains
- **Needs Board**: Community support requests with group filtering
- **Shared Calendar**: Event scheduling and coordination
- **Messaging**: Private communication between supporters and family
- **Updates**: Family news and progress sharing
- **Privacy Controls**: Comprehensive visibility scoping (all supporters, specific groups, roles, or custom user selection) with centralized enforcement across all features
- **Role-Based Access**: Admin, primary, and supporter roles with appropriate permissions
- **Invitation System**: Secure supporter onboarding

### Security & Privacy Architecture
**PRODUCTION-READY:** Comprehensive visibility filtering with zero information leakage.

**Centralized Visibility System (`server/visibilityHelpers.ts`):**
- `checkContentVisibility()`: Single-item visibility check for any content type
- `filterByVisibility()`: Performance-optimized list filtering (caches group membership to eliminate N+1 queries)
- `checkContentVisibilitySync()`: Internal helper for synchronous filtering with pre-fetched groups

**Five-Step Security Pattern** (enforced across ALL endpoints):
1. Fetch resource by ID
2. Return NOT_FOUND if resource doesn't exist
3. Return NOT_FOUND for cross-household access (never FORBIDDEN)
4. Check visibility using `filterByVisibility` - return NOT_FOUND if unauthorized
5. Check permissions - only return FORBIDDEN after visibility confirmed

**Visibility Enforcement:**
- All list endpoints (`needs.list`, `events.list`, `messages.listAnnouncements`) filter by visibility
- All get endpoints check household ownership + visibility before returning data
- All mutation endpoints (update, delete, claim, RSVP) validate visibility before permissions
- Primary/Admin can always see all content regardless of visibility scope

**Performance Optimization:**
- Group membership cached per request (1 DB call instead of N for lists)
- Supports filtering 100+ items with only 1 database query

**Automated Security Tests:**
- 17 comprehensive tests in `server/__tests__/visibility-security.test.ts`
- Full coverage: group visibility (with mocks), custom visibility, role restrictions, performance validation
- Prevents security regressions that could leak private information

**Developer Documentation:**
- `CONTRIBUTING.md` documents security patterns for future development
- Includes correct/incorrect examples, common pitfalls, code review checklist
- Required reading before adding new endpoints

The UI/UX features a consistent glassmorphism theme across all pages (Dashboard, Needs, Calendar, MealTrain, Messages, Updates, People, Home), incorporating gradient backgrounds (teal → blue → purple), animated gradient orbs, frosted glass cards (`bg-white/90 backdrop-blur-md`), and enhanced shadow effects for a professional and modern aesthetic.

## Database Management
This project uses Drizzle ORM's **push workflow** for database schema management:
- Schema changes are defined in `drizzle/schema.ts`
- Run `npm run db:push` to apply schema changes directly to the database
- If push encounters warnings, use `npm run db:push --force` to force the update
- **Never manually write SQL migrations** - the push workflow handles all schema updates
- Database schema is version-controlled through `drizzle/schema.ts`

Key database tables for new features:
- `meal_train_days`: Tracks which specific days are available for meal signups
- `groups` & `group_members`: Support custom visibility groups
- `meal_trains`: Extended with `days_ahead_open`, `availability_start_date`, `availability_end_date`

## Recent Updates (November 2025)
- **Dashboard Redesign (Family-Focused & Elegant):**
  - **Family Showcase Hero**: Completely centered section making family the star
  - **Massive Centered Family Name**: text-4xl → text-7xl gradient headline (teal → mauve purple)
  - **Optional Family Photo**: Centered profile image (w-32 → w-40) with elegant border if photoUrl is set
  - **Optional Family Description**: Custom family story/description displayed prominently if set
  - **Database Schema**: Added `photoUrl` and `description` fields to households table for optional family personalization
  - User context demoted to subtle metadata line (name · role · greeting)
  - "Community Momentum" replaces "Community Progress" to emphasize collective action
  - Frosted glass panel design (bg-white/70, backdrop-blur-md) with refined, calming aesthetic
  - Compact horizontal stat pills (icon + number + label inline)
  - Subtle hover states matching glassmorphism theme
- **Enhanced Landing Page (Production-Ready):**
  - Comprehensive feature showcase explaining all 6 core features with detailed capabilities
  - "Why OBK?" section highlighting three key value propositions
  - **Flexible Admin Control** section explaining primary can handle everything themselves or delegate to admins
  - Email notifications callout and final call-to-action
  - Improved content hierarchy and user education for new visitors
  - **Pinyon Script** font for Galatians 6:2 scripture verse (closest free alternative to Bible Script)
- **Logo Updates:**
  - Updated to new professional logo: teal cross held by caring hands
  - Increased logo size across entire app to w-16 h-16 for consistency (including DashboardLayout and all dialogs)
  - Applied uniformly in landing page header, authenticated views, and dialog components
- **UI Consistency (Glassmorphism Design):**
  - Applied landing page glassmorphism design across ALL authenticated pages (Dashboard, Needs, Calendar, MealTrain, Messages, Updates, People, Settings)
  - Implemented consistent animated gradient orbs with proper animations (`animate-blob` with staggered delays: 0ms, 2000ms, 4000ms)
  - Standardized gradient backgrounds: `bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50`
  - Unified orb styling: w-72 h-72, `mix-blend-multiply dark:mix-blend-soft-light`, 20% opacity
  - Professional, cohesive user experience across entire application
- **Media Upload for Announcements:**
  - Added support for uploading images and videos to announcements/messages
  - Multi-file upload with preview thumbnails
  - Automatic image/video detection and display in announcement cards
  - 50MB file limit with strict MIME validation for security
- **Security Enhancements (Production-Ready):**
  - Implemented comprehensive visibility filtering with zero information leakage
  - Optimized performance: Group membership caching eliminates N+1 queries (100 items = 1 DB call)
  - Added 17 automated security tests with full group visibility coverage
  - Created CONTRIBUTING.md with Five-Step Security Pattern documentation
- Added meal train day scheduling system with calendar UI
- Implemented full CRUD for groups on People page
- Expanded glassmorphism design across all app pages
- Created comprehensive recommendations document (RECOMMENDATIONS.md)

## External Dependencies
- **Database**: PostgreSQL (managed by Replit, accessed via Drizzle ORM)
- **Authentication**: Replit Auth (OpenID Connect via Passport.js)
- **Session Store**: PostgreSQL (using `connect-pg-simple`)
- **Email Service**: Resend (transactional emails with custom domain `notifications.obkapp.com`)
- **Frontend Framework**: React
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend Framework**: Express.js
- **API Layer**: tRPC
- **Package Manager**: pnpm
- **Runtime**: Node.js

## Notification System
- **Email Notifications**: Opt-in system using Resend (all notifications default to OFF)
- **Notification Types**: 11 event types (needs, events, meal trains, messages, announcements, updates, invites)
- **User Control**: Settings page allows users to toggle each notification type individually
- **Database Tables**: `notification_preferences`, `notification_logs`, `push_subscriptions` (future use)