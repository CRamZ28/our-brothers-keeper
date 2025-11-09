# Our Brother's Keeper - Replit Project Documentation

## Overview
Our Brother's Keeper is a compassionate platform designed to help families and communities provide sustained support to those who have lost a loved one. The application facilitates coordination of care through features like a needs board, shared calendar, meal train, messaging, and update tracking. The project aims to offer a robust and user-friendly experience for managing community support during difficult times by simplifying community support and communication for families in need.

## User Preferences
- **Design Style**: Modern glassmorphism with gradient backgrounds (teal → blue → purple)
- **Sidebar**: Darker teal gradient with rounded container, glowing logo symbol with CSS small-caps text, frosted active pill, mauve hover effects
- **Logo**: Professional glowing teal cross held by caring hands symbol (stored at `client/public/obk-symbol.png`) with CSS-styled "Our Brother's Keeper" text using small caps (first letters O, B, K larger)
- **Scripture Font**: Pinyon Script for biblical verse (Galatians 6:2) on landing page

## System Architecture
The application is built with a React frontend (Vite, TypeScript, Tailwind CSS) and an Express.js backend utilizing tRPC for type-safe APIs. PostgreSQL is used as the database with Drizzle ORM, and Replit Auth handles authentication. The architecture emphasizes a clear separation of concerns with a `client/`, `server/`, and `shared/` directory structure.

### UI/UX Decisions
The UI/UX features a consistent glassmorphism theme across all pages (Dashboard, Needs, Calendar, MealTrain, Messages, Updates, People, Home). This includes:
- Gradient backgrounds (teal → blue → purple)
- Animated gradient orbs
- Frosted glass cards (`bg-white/90 backdrop-blur-md`)
- Enhanced shadow effects for a professional and modern aesthetic.
- A custom-implemented sidebar replacing `shadcn/ui` for full design control, featuring a darker teal gradient, rounded containers, a glowing logo, frosted active pills for active routes, and mauve hover effects.
- The Dashboard features a modern SaaS aesthetic with semi-transparent cards, a gradient background (from-white via-[#6BC4B8]/20 to-gray-100), and a "Family Hero Card" with gradient text.
- The Memory Wall has a "True Vision Board Aesthetic" with overlapping, randomly rotated cards, varied sizes, decorative tape elements, and vibrant color coding for different entry types.

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
- **Messaging**: Private communication and announcements with media upload support.
- **Updates**: Family news and progress sharing.
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