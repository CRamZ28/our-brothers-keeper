# Our Brother's Keeper - Replit Project Documentation

## Overview
Our Brother's Keeper is a platform designed to provide sustained support to families and communities after the loss of a loved one. It offers features like a needs board, shared calendar, meal train, messaging, and update tracking to simplify community support and communication during difficult times. The project aims to be a user-friendly and robust solution for managing community support.

## User Preferences
- **Design Style**: Glassmorphism architecture with abstract wave background image
- **Background**: Abstract wavy teal background (`/waves-bg.png`) with large decorative blur orbs for added depth
- **Blur Orbs**: Three large visible orbs (600px, 700px, 400px) with cyan, emerald, and teal colors for depth
- **Glass System**:
  - **Glass Container**: `background: rgba(255, 255, 255, 0.03)` - no blur, responsive viewport margins (16px mobile, 24px desktop), `2px solid rgba(255, 255, 255, 0.25)` border glow, full-width content for maximum screen utilization
  - **Sidebar**: `linear-gradient(to bottom, rgba(255, 255, 255, 0.65), rgba(192, 192, 192, 0.55))` with `backdrop-filter: blur(40px) saturate(180%)` - white to silver gradient glassmorphism with enhanced frosting, neutral text colors
  - **Main Content**: `background: rgba(255, 255, 255, 0)` - fully transparent, no blur, full-width layout
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
The application uses a React frontend (Vite, TypeScript, Tailwind CSS) and an Express.js backend with tRPC for type-safe APIs. PostgreSQL with Drizzle ORM is used for data persistence, and Replit Auth handles authentication. The project structure separates `client/`, `server/`, and `shared/` concerns.

### Role and Access Tier Alignment
User roles and access tiers are strictly aligned to prevent permission/visibility issues:
- Primary and Admin users always have `family` access (full visibility and control).
- Supporter users default to `community` access, with options to upgrade.
- A helper function `getAccessTierForRole()` in `server/db.ts` enforces this alignment during household creation, invite acceptance, and all user role assignments.

### UI/UX Decisions
The UI/UX is built on a consistent glassmorphism design system, featuring:
- **Glassmorphism Architecture**: Transparent and blurred elements over a wavy teal background with decorative blur orbs.
- **Dashboard**: Displays a central family name, customizable area, and cards for Supporters, Open Needs, and Upcoming Events, using consistent design elements.
- **Responsive Design**: The interface is optimized for various screen sizes, including mobile devices.
- **Calendar UI Consistency**: All calendars (Events, Needs, Meal Train) maintain a transparent glassmorphism style with distinct color coding.
- **Memory Wall**: An interactive drag-and-drop vision board with overlapping, rotated cards and color-coded content for memories, stories, and images.

### Technical Implementations & Feature Specifications
- **Core Features**: Include Meal Train management, Group management, a Needs Board with unclaim functionality, an Events Calendar with "Important Dates," Family Updates with media uploads, an interactive Memory Wall, and a Resources page.
- **Resources & Education**: A tabbed insights hub (`/resources`) provides sections for "For Those Who Are Grieving," "For Friends & Family," and "Ongoing Support & Community," offering guidance and actionable features.
- **Privacy & Access Control**: A 3-option visibility model is applied across all features. An Access Tier System (Community/Friend/Family) allows users to select support levels, with Role-Based Access (Admin, Primary, Supporter) defining permissions.
- **Onboarding & Support**: Features a secure invitation system for supporters, an interactive onboarding tour using `react-joyride`, and contextual `HelpIcon` components.
- **Communication & Notifications**: An opt-in email notification system for 15 event types, with configurable user preferences. A personal Reminder System supports both need/event-based and standalone reminders, processed by a background job.
- **Household Search**: A `/search` route allows discovering existing family support pages via fuzzy name matching.
- **User & Content Management**: Supports profile picture uploads integrated with object storage.
- **Security & Privacy Architecture**: A production-ready, centralized visibility system (`server/visibilityHelpers.ts`) implements a "Five-Step Security Pattern" for endpoint validation, optimized with group membership caching.
- **Database Management**: Uses Drizzle ORM's **push workflow** for schema management.
- **Performance**: PWA configuration excludes large assets from service worker precaching, utilizing runtime caching for efficiency.
- **React Deduplication**: Vite configuration includes `dedupe: ["react", "react-dom"]` to prevent "Invalid hook call" errors.

## External Dependencies
- **Database**: PostgreSQL
- **Authentication**: Replit Auth (OpenID Connect via Passport.js)
- **Session Store**: PostgreSQL (`connect-pg-simple`)
- **Email Service**: Resend (configured with `RESEND_API_KEY`, sends from `notifications@obkapp.com`)
- **Error Monitoring**: Sentry
- **Frontend Framework**: React
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend Framework**: Express.js
- **API Layer**: tRPC
- **Package Manager**: pnpm
- **Runtime**: Node.js