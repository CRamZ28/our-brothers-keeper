# Our Brother's Keeper - Replit Project Documentation

## Overview
Our Brother's Keeper is a compassionate platform designed to help families and communities provide sustained support to those who have lost a loved one. The application simplifies community support and communication by offering features such as a needs board, shared calendar, meal train, messaging, and update tracking, aiming to provide a robust and user-friendly experience for managing community support during difficult times.

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
The application features a React frontend (Vite, TypeScript, Tailwind CSS) and an Express.js backend with tRPC for type-safe APIs. It uses PostgreSQL with Drizzle ORM and Replit Auth for authentication. The architecture follows a clear separation of concerns with `client/`, `server/`, and `shared/` directories.

### Role and Access Tier Alignment
**Critical Business Rule**: User roles and access tiers must align to prevent permission/visibility mismatches:
- **Primary users**: ALWAYS get `family` access tier (full visibility + full control)
- **Admin users**: ALWAYS get `family` access tier (full visibility + elevated control)
- **Supporter users**: Get `community` access tier by default (can request upgrades to friend/family)
- **Helper function**: `getAccessTierForRole()` in `server/db.ts` enforces this alignment
- **Enforcement points**: Household creation, invite acceptance, and all user role assignments automatically set appropriate access tier

### UI/UX Decisions
The UI/UX is built around a consistent glassmorphism design system using teal gradients and neutral typography, featuring:
- **Glassmorphism Architecture**: Transparent and blurred elements over a wavy teal background with decorative blur orbs.
- **Dashboard**: Centralized family name, customizable display area, and cards for Supporters, Open Needs, and Upcoming Events. Cards use white icons on teal backgrounds, large numbers, teal gradient accent bars, and Mauve Purple action buttons.
- **Responsive Design**: Adapts UI elements for various screen sizes, including mobile-first optimization.
- **Calendar UI Consistency**: Uniform transparent glassmorphism styling across all calendars (Events, Needs, Meal Train) with distinct color coding for entries.
- **Memory Wall**: Interactive drag-and-drop vision board with overlapping cards, random rotations, and vibrant color coding for memories, stories, and images.

### Technical Implementations & Feature Specifications
- **Core Features**: Includes Meal Train management (scheduling, capacity, preferences), Group management (CRUD for supporters), Needs Board (community support requests, unclaim functionality), Events Calendar (scheduling, "Important Dates"), Family Updates (unified timeline, media uploads), and an interactive Memory Wall.
- **Privacy & Access Control**: Comprehensive 3-option visibility model applied across all features. An Access Tier System (Community/Friend/Family) allows users to select their support level, with optional auto-promotion. Role-Based Access (Admin, Primary, Supporter) defines permissions.
- **Onboarding & Support**: Secure invitation system for supporters via public household pages. An interactive onboarding tour using `react-joyride` guides primary users through setup, with contextual `HelpIcon` components for in-app assistance.
- **Communication & Notifications**: Opt-in email notification system for 14 event types, with configurable user preferences and role-sensitive defaults. A personal Reminder System for needs and events, processed by a background job.
- **Household Search**: `/search` route with fuzzy name matching for discovering existing family support pages.
- **User & Content Management**: Profile picture uploads with object storage integration.
- **Security & Privacy Architecture**: Production-ready, centralized visibility system (`server/visibilityHelpers.ts`) implementing a "Five-Step Security Pattern" for endpoint validation, optimized by caching group membership.
- **Database Management**: Drizzle ORM's **push workflow** for schema management, defining changes in `drizzle/schema.ts`.
- **Performance**: PWA configuration optimized to exclude large assets from service worker precaching, using runtime caching instead to reduce precache size.
- **React Deduplication**: Vite configuration includes `dedupe: ["react", "react-dom"]` to prevent "Invalid hook call" errors.

## External Dependencies
- **Database**: PostgreSQL
- **Authentication**: Replit Auth (OpenID Connect via Passport.js)
- **Session Store**: PostgreSQL (`connect-pg-simple`)
- **Email Service**: Resend (manually configured with RESEND_API_KEY secret, sends from notifications@obkapp.com)
- **Error Monitoring**: Sentry
- **Frontend Framework**: React
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend Framework**: Express.js
- **API Layer**: tRPC
- **Package Manager**: pnpm
- **Runtime**: Node.js

## Recent Changes
- **November 21, 2025**:
  - **Broadcast Email Notifications**: Admin/primary users can now send broadcast messages with automatic email notifications. When admins send messages to supporters (individual, group, or all), recipients receive both in-app messages and email notifications with the full message content. Emails include beautiful HTML formatting with "BROADCAST MESSAGE" badge, household branding, and direct link to view in app. System tracks email delivery success/failure rates and logs all broadcast activity.
  - **Role/Access Tier Alignment System**: Implemented comprehensive multi-layer safeguards ensuring primary/admin users always maintain family-tier access. Includes atomic SQL enforcement, validation checks, tier-only update protection, and helper functions across all code paths (invites, household creation, role changes, auto-promotion, manual approvals).
  - **UI Refinements**: Removed pixelated noise texture from background for smoother glassmorphic appearance. Updated Settings page URL card with transparent glassmorphism styling.
- **November 20, 2025**: 
  - **Object Storage Fix**: Removed silent fallback to local file storage in `server/uploadRouter.ts` that caused dashboard photos to disappear in production. Now enforces object storage only - uploads fail loudly if object storage is misconfigured, ensuring all uploads persist permanently in autoscale deployments
  - **Sidebar User Profile**: Updated user button background to mauve purple gradient (`rgba(176, 140, 167, 0.35)`) for better visibility. Admin/Primary roles now display as distinctive teal badges with white text instead of subtle gray text
  - **Landing Page Z-Index Fix**: Added `z-index: 10` to main content wrapper to ensure section headers ("Why Our Brother's Keeper", "You're in Control—Always", "Everything You Need") appear above fixed background layers on mobile
  - **Landing Page Background Architecture**: Separated wavy background into dedicated fixed layer to solve iOS Safari `background-attachment: fixed` limitation - background now stays perfectly still while content scrolls on mobile
  - **Memory Wall Enhancements**: Increased card base opacity from `0.85` to `0.95` for better readability when stacked. Added click-to-expand feature with full-screen modal view, supporting mouse/touch/keyboard (Enter/Space keys), drag detection with 100ms debounce, interactive element exclusion (buttons/images), and proper accessibility (ARIA attributes, focus management)
  - **Landing Page Mobile Fix**: Reduced feature card background opacity (white cards: `0.35` → `0.15`, purple cards: `0.4` → `0.18`) to eliminate "floating panel" effect on mobile scroll, allowing wavy background to show through naturally
- **November 19, 2025**: Comprehensive mobile optimization and bug fixes:
  - **Mobile Text Overflow Protection**: Added `min-w-0` and `break-words` to GlassPageLayout, DashboardLayout, Card components, and page-specific fixes for Needs/MealTrain with standardized flex pattern (icon `shrink-0` + text wrapper `min-w-0 flex-1` + content `break-words`)
  - **Timezone Bug Fix**: Fixed Dashboard memorial dates displaying one day earlier (e.g., showing 7/20 instead of 7/21) by parsing YYYY-MM-DD strings directly instead of using `new Date()` which caused UTC conversion issues in western timezones
  - **Role Management**: Both Primary and Admin users can now change user roles (admin/supporter) via dropdown on People page
- **November 18, 2025**: Implemented invite email functionality via Resend API. Emails now sent to supporters when invited to join a household's support circle. Manual RESEND_API_KEY configuration (Replit connector integration declined by user).