# Our Brother's Keeper - Replit Project Documentation

## Overview
Our Brother's Keeper is a compassionate platform designed to help families and communities provide sustained support to those who have lost a loved one. The application facilitates coordination of care through features like a needs board, shared calendar, meal train, messaging, and update tracking. The project aims to offer a robust and user-friendly experience for managing community support during difficult times by simplifying community support and communication for families in need.

## User Preferences
- **Design Style**: Glassmorphism architecture with abstract wave background image
- **Background**: Abstract wavy teal background (`/waves-bg.png`) with large decorative blur orbs for added depth
- **Blur Orbs**: Three large visible orbs (600px, 700px, 400px) with cyan, emerald, and teal colors for depth
- **Glass System**:
  - **Glass Container**: `background: rgba(255, 255, 255, 0.03)` - no blur, 40px viewport margins, `2px solid rgba(255, 255, 255, 0.25)` border glow
  - **Sidebar**: `linear-gradient(to bottom, rgba(255, 255, 255, 0.65), rgba(192, 192, 192, 0.55))` with `backdrop-filter: blur(40px) saturate(180%)` - white to silver gradient glassmorphism with enhanced frosting, dark teal text
  - **Main Content**: `background: rgba(255, 255, 255, 0)` - fully transparent, no blur
  - **Cards**: `background: rgba(255, 255, 255, 0.1)` with `backdrop-filter: blur(6px)`
- **Logo**: Professional teal cross held by caring hands emblem (stored at `client/public/obk-emblem.png`) displayed directly on sidebar without background container
- **Typography**: Dark teal text (`text-teal-700/900`) on light frosted glass for optimal readability
- **Active Navigation**: `background: rgba(176, 140, 167, 0.7)` (Mauve Purple #B08CA7) with dark teal text
- **Scripture Font**: Pinyon Script for biblical verse (Galatians 6:2) on landing page
- **Family Name Font**: Cinzel Decorative (serif, small-caps, text-5xl) in brand teal (#2DB5A8) with subtle shadow to match logo emblem

## System Architecture
The application is built with a React frontend (Vite, TypeScript, Tailwind CSS) and an Express.js backend utilizing tRPC for type-safe APIs. PostgreSQL is used as the database with Drizzle ORM, and Replit Auth handles authentication. The architecture emphasizes a clear separation of concerns with a `client/`, `server/`, and `shared/` directory structure.

### UI/UX Decisions
The UI/UX features a glassmorphism design system with consistent teal gradient:
- **Glassmorphism Architecture**:
  - **Background**: Abstract wavy teal background image (`/waves-bg.png`) with large decorative orbs
  - **Blur Orbs**: Three large visible orbs (600px cyan/40, 700px emerald/35, 400px teal/45) with heavy blur for depth
  - **Glass Container**: `rgba(255, 255, 255, 0.03)` with no blur, 40px margins, white border glow
  - **Sidebar**: `linear-gradient(white to silver)` with 40px blur + saturate(180%) - white to silver gradient glassmorphism with enhanced frosting, dark teal text (`text-teal-700`)
  - **Main Content**: `rgba(255, 255, 255, 0)` - fully transparent, no blur, shows wave background
  - **Cards**: `rgba(255, 255, 255, 0.1)` with 6px blur, white/30 preview items
- **Active Navigation**: `rgba(176, 140, 167, 0.7)` (Mauve Purple #B08CA7) with dark teal text
- **Typography**: Dark teal (`text-teal-700/900`) on all frosted glass surfaces for excellent readability
- **Logo Implementation**: Emblem displayed directly on sidebar without background container
- **Dashboard**: Centered family name pill, optional photo placeholder, three equal square cards (Supporters, Open Needs, Upcoming Events) with polished professional design:
  - Each card features white icon on solid teal background (#2DB5A8), large number display (5xl), teal gradient accent bar, preview items, and Mauve Purple action button
  - Hover effects with subtle shadow lift for interactivity
  - Teal gradient accent bars (#2DB5A8 → #4DD0C4) add visual pop beneath numbers
- **Responsive Design**: Glass container adapts across breakpoints, mobile header integrated inside unified container
- **Memory Wall**: Vision board aesthetic with overlapping cards, random rotations, varied sizes, decorative tape, and vibrant color coding

### Technical Implementations & Feature Specifications
- **Meal Train Management**: Comprehensive meal coordination including:
    - Day scheduling system with quick selection options.
    - Configurable "Days Ahead Control" for sign-ups.
    - Daily capacity controls and per-day overrides.
    - Dual-layer privacy and dietary preference management.
- **Group Management**: Full CRUD operations for organizing supporters with custom visibility controls.
- **Needs Board**: Community support requests with group filtering.
- **Shared Calendar**: Event scheduling and coordination with Important Dates feature.
    - **Important Dates**: Admin/primary-only feature for tracking birthdays, anniversaries, milestones, and holidays.
    - Supports yearly recurring dates for birthdays and anniversaries.
    - Optional person association to link dates to specific household members.
    - Enforced security ensures only admin/primary users can create or modify important dates.
- **Family Updates**: Unified timeline for family communication including announcements and personal updates with 5 types (Announcement, General Update, Gratitude, Memory, Milestone). Supports media uploads (photos, videos, documents) and pinned announcements.
- **Memory Wall**: A community collage for memories, stories, encouragement, and prayers. Features an aesthetic with random rotations, absolute positioning, varied card sizes, decorative tape, and vibrant color coding. Supports image uploads and filtering.
- **Gift Registry**: Wishlist management with three-stage tracking (Needed, Purchased, Received), priority levels, and optional item details.
- **Privacy Controls**: Comprehensive visibility scoping (all supporters, specific groups, roles, or custom user selection) enforced across all features.
- **Access Tier System**: Three-tier access control (Community/Friend/Family) with invisible tiering for inclusive experience:
    - Users select their relationship tier when joining (Family Member, Friend, or Community Member)
    - All users start as "Community" tier by default regardless of selection (invisible to them)
    - Admin/Primary can review pending tier requests and approve upgrades to Friend or Family tiers
    - Optional auto-promotion: Admin can enable automatic tier upgrades after configurable hours (default 48, range 1-168)
    - Meal trains default to Family+Friend visibility with optional Community tier inclusion toggle
    - All visibility filtering respects access tiers while maintaining existing group-based controls
    - Hourly background job processes auto-promotions for households with feature enabled
    - Tier approval UI integrated into People page for admin/primary users
    - Auto-promotion settings available in Settings page for admin/primary users
- **Role-Based Access**: Admin, primary, and supporter roles with defined permissions.
    - **Admin/Primary Permissions**: Full control over household management including:
        - Delete or modify any content (needs, events, updates, messages, memory wall entries, gift registry items, meal trains)
        - Remove users from the household (removes from all groups, sets status to blocked)
        - Send direct messages to specific users using custom visibility scoping
        - Manage all household settings and configurations
        - Approve or deny access tier upgrade requests
        - Configure auto-promotion settings (enable/disable, hours threshold)
- **Invitation System**: Secure supporter onboarding.
- **Notification System**: Opt-in email notifications for 11 event types, configurable by users.
- **Profile Pictures**: User avatar upload system with object storage integration for easy recognition of community members.
    - Upload profile pictures (images up to 5MB)
    - Display avatars with fallback to initials
    - UserAvatar component used throughout the app
    - Integrated in People page for profile management and user lists
- **Error Monitoring**: Production error tracking with Sentry integration.
    - Automatic error capture for frontend (React) and backend (Express)
    - Session replay for debugging user issues
    - Email alerts on production errors
    - Performance monitoring and tracing

### System Design Choices
- **Security & Privacy Architecture**: Production-ready with a centralized visibility system (`server/visibilityHelpers.ts`) ensuring zero information leakage.
    - A "Five-Step Security Pattern" is enforced across all endpoints to validate resource existence, household access, visibility, and permissions.
    - Visibility enforcement filters all list and get endpoints and validates mutations.
    - Performance is optimized by caching group membership per request.
    - 17 automated security tests ensure no regressions.
    - `CONTRIBUTING.md` documents security patterns for future development.
- **Database Management**: Uses Drizzle ORM's **push workflow** for schema management. Schema changes are defined in `drizzle/schema.ts` and applied via `npm run db:push`, eliminating manual SQL migrations.

## External Dependencies
- **Database**: PostgreSQL (managed by Replit, accessed via Drizzle ORM)
- **Authentication**: Replit Auth (OpenID Connect via Passport.js)
- **Session Store**: PostgreSQL (using `connect-pg-simple`)
- **Email Service**: Resend (transactional emails with custom domain `notifications.obkapp.com`)
- **Error Monitoring**: Sentry (production error tracking, session replay, and performance monitoring)
- **Frontend Framework**: React
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend Framework**: Express.js
- **API Layer**: tRPC
- **Package Manager**: pnpm
- **Runtime**: Node.js