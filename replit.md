# Our Brother's Keeper - Replit Project Documentation

## Overview
Our Brother's Keeper is a compassionate platform designed to help families and communities provide sustained support to those who have lost a loved one. The application simplifies community support and communication for families in need by offering features such as a needs board, shared calendar, meal train, messaging, and update tracking. The project's goal is to offer a robust and user-friendly experience for managing community support during difficult times.

## User Preferences
- **Design Style**: Glassmorphism architecture with abstract wave background image
- **Background**: Abstract wavy teal background (`/waves-bg.png`) with large decorative blur orbs for added depth
- **Blur Orbs**: Three large visible orbs (600px, 700px, 400px) with cyan, emerald, and teal colors for depth
- **Glass System**:
  - **Glass Container**: `background: rgba(255, 255, 255, 0.03)` - no blur, 40px viewport margins, `2px solid rgba(255, 255, 255, 0.25)` border glow
  - **Sidebar**: `linear-gradient(to bottom, rgba(255, 255, 255, 0.65), rgba(192, 192, 192, 0.55))` with `backdrop-filter: blur(40px) saturate(180%)` - white to silver gradient glassmorphism with enhanced frosting, neutral text colors
  - **Main Content**: `background: rgba(255, 255, 255, 0)` - fully transparent, no blur
  - **Cards**: `background: rgba(255, 255, 255, 0.1)` with `backdrop-filter: blur(6px)`
  - **Landing Page Glass**: Darker glass containers (`background: rgba(15, 23, 42, 0.4)` with `backdrop-blur-lg`) for WCAG-compliant text contrast, plus a darkening overlay (`linear-gradient(to bottom, rgba(15, 23, 42, 0.25), rgba(6, 78, 59, 0.20))`) for legibility while preserving glassmorphism aesthetic
- **Logo**: Professional teal cross held by caring hands emblem (stored at `client/public/obk-emblem.png`) displayed directly on sidebar without background container
- **Typography**: Neutral text colors only (black, white, gray shades) for optimal readability - all chromatic text colors removed except family name special styling
- **Active Navigation**: `background: rgba(176, 140, 167, 0.7)` (Mauve Purple #B08CA7) with dark teal text
- **Scripture Font**: Pinyon Script for biblical verse (Galatians 6:2) on landing page
- **Family Name Font**: Cinzel serif with large cap first letters (48px #1fb5b0) and small caps for remaining letters (36px #0fa9a7), wide tracking with enhanced teal drop-shadow glow for prominent focal point display
- **Glass Components**: Reusable glass primitives (GlassCard, GlassButton, GlassBadge) in `client/src/components/ui/glass.tsx` with teal/mauve color tokens
- **Page Layout**: GlassPageLayout wrapper (`client/src/components/GlassPageLayout.tsx`) provides consistent structure with PageHeader, title, and actions slots
- **Visibility Controls**: Standardized 3-option model across all features (Needs, Events, Messages, Meal Train):
  - **Everyone**: Share with all supporters (all family/friend/community tier members)
  - **Specific Groups**: Select from any custom household groups (group names don't affect functionality)
  - **Custom**: Select specific people individually
  - Group names are fully customizable - the dropdown shows all groups created on the People page
  - Meal Train: Address/location visibility follows meal train visibility - anyone who can see the meal train can see the location

## System Architecture
The application is built with a React frontend (Vite, TypeScript, Tailwind CSS) and an Express.js backend utilizing tRPC for type-safe APIs. PostgreSQL is used as the database with Drizzle ORM, and Replit Auth handles authentication. The architecture emphasizes a clear separation of concerns with a `client/`, `server/`, and `shared/` directory structure.

### UI/UX Decisions
The UI/UX features a consistent glassmorphism design system with teal gradients and neutral typography. Key elements include:
- **Glassmorphism Architecture**: Transparent and blurred elements over a wavy teal background with decorative blur orbs.
- **Dashboard**: Centered family name, customizable display area (photo, slideshow, quote, memory), and three equal square cards for Supporters, Open Needs, and Upcoming Events. Cards feature white icons on a solid teal background, large numbers, teal gradient accent bars, and Mauve Purple action buttons with hover effects.
- **Responsive Design**: Adapts glass containers and mobile headers across breakpoints.
- **Calendar UI Consistency**: Uniform transparent glassmorphism styling across Events, Needs, and Meal Train calendars, with distinct color coding for upcoming (mauve purple) and past (grayscale) entries.
- **Memory Wall**: Interactive drag-and-drop vision board with overlapping cards, random rotations, and vibrant color coding. Cards are freely draggable with position persistence, using dnd-kit for smooth interactions.

### Technical Implementations & Feature Specifications
- **Meal Train Management**: Comprehensive meal coordination with day scheduling, configurable "Days Ahead Control," daily capacity controls, and dietary preference management. Includes the standardized 3-option visibility model.
- **Group Management**: Full CRUD operations for organizing supporters with custom visibility controls.
- **Needs Board**: Community support requests with group filtering and an "Unclaim Functionality" for users to release claimed needs, triggering email notifications to admin/primary users.
- **Events Calendar**: Event scheduling and coordination, including an "Important Dates" feature for tracking recurring dates like birthdays and anniversaries, restricted to admin/primary users.
- **Family Updates**: A unified timeline for announcements and personal updates (Announcement, General Update, Gratitude, Memory, Milestone) supporting media uploads and pinned announcements.
- **Memory Wall**: Interactive drag-and-drop community collage for memories, stories, encouragement, prayers, and pictures with image uploads, filtering, and position persistence via dnd-kit.
- **Gift Registry**: Wishlist management with three-stage tracking (Needed, Purchased, Received), priority levels, and optional item details.
- **Privacy Controls**: Comprehensive visibility scoping (all supporters, specific groups, roles, or custom user selection) enforced across all features.
- **Access Tier System**: Three-tier access control (Community/Friend/Family) with invisible tiering. Users select their tier upon joining, and admin/primary users can approve upgrades. Includes optional auto-promotion after a configurable duration.
- **Role-Based Access**: Admin, primary, and supporter roles with defined permissions, including full control for admin/primary users over content, user management, and household settings.
- **Invitation System**: Secure supporter onboarding via public household pages with customizable slug-based URLs. Users can join with Community tier access and request upgrades.
- **Notification System**: Opt-in email notifications for 14 event types, configurable by users, with role-sensitive defaults (e.g., admin/primary receive unclaim notifications by default).
- **Reminder System**: Personal reminders for upcoming needs and events with seven preset time options, processed by a background job.
- **Profile Pictures**: User avatar upload system with object storage integration.
- **Error Monitoring**: Production error tracking and performance monitoring with Sentry integration.
- **Instructional/Onboarding System**: Comprehensive user guidance system with:
  - **Interactive Tours**: Role-based walkthroughs using react-joyride for first-time users and feature-specific tutorials
  - **Tour Tracking**: Database-backed progress tracking per user/household with resume capability
  - **HelpIcon Component**: Contextual help tooltips throughout the app explaining complex features
  - **Tour Library**: 6 predefined tours (household setup, supporter welcome, needs board, meal train, events, gift registry)
  - **Security**: Tour access validated by role with proper authorization checks
  - **Tour Definitions**: Stored in `client/src/lib/tourConfigs.ts` with step-by-step guidance for each feature
  - **Tour Service**: Custom React hook (`useTour`) managing Joyride state and tRPC integration for progress persistence
  - **Database Schema**: `onboarding_tours` (tour definitions) and `user_tour_progress` (user completion tracking) tables

### System Design Choices
- **Security & Privacy Architecture**: Production-ready, centralized visibility system (`server/visibilityHelpers.ts`) with a "Five-Step Security Pattern" for endpoint validation. Security is optimized by caching group membership and validated by 17 automated tests.
- **Database Management**: Uses Drizzle ORM's **push workflow** for schema management, defining changes in `drizzle/schema.ts` and applying via `npm run db:push`.
- **React Deduplication**: Vite config includes `dedupe: ["react", "react-dom"]` to prevent "Invalid hook call" errors caused by multiple React instances in node_modules.

## External Dependencies
- **Database**: PostgreSQL
- **Authentication**: Replit Auth (OpenID Connect via Passport.js)
- **Session Store**: PostgreSQL (`connect-pg-simple`)
- **Email Service**: Resend
- **Error Monitoring**: Sentry
- **Frontend Framework**: React
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend Framework**: Express.js
- **API Layer**: tRPC
- **Package Manager**: pnpm
- **Runtime**: Node.js