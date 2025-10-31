# Our Brother's Keeper - Replit Project Documentation

## Overview
Our Brother's Keeper is a compassionate platform designed to help families and communities provide sustained support to those who have lost a loved one. The application facilitates coordination of care through features like a needs board, shared calendar, meal train, messaging, and update tracking. The project aims to offer a robust and user-friendly experience for managing community support during difficult times.

## User Preferences
- **Design Style**: Modern glassmorphism with gradient backgrounds (teal → blue → purple)
- **Logo**: Custom wooden cross with "OBK" in teal (stored at `client/public/obk-logo.png`)

## System Architecture
The application is built with a React frontend (Vite, TypeScript, Tailwind CSS) and an Express.js backend utilizing tRPC for type-safe APIs. PostgreSQL is used as the database with Drizzle ORM, and Replit Auth handles authentication. The architecture emphasizes a clear separation of concerns with a `client/`, `server/`, and `shared/` directory structure.

### Key Features
- **Meal Train Management**: Full-featured meal coordination with:
  - Calendar and list views for meal signups
  - Daily capacity controls (1-10 volunteers per day)
  - Dual-layer privacy controls (meal train visibility + address visibility)
  - Dietary preferences (allergies, dislikes, favorite meals)
  - Special delivery instructions
  - Volunteer notes and status tracking
- **Needs Board**: Community support requests with group filtering
- **Shared Calendar**: Event scheduling and coordination
- **Messaging**: Private communication between supporters and family
- **Updates**: Family news and progress sharing
- **Privacy Controls**: Comprehensive visibility scoping (all supporters, specific groups, roles, or private) with centralized enforcement across all meal train operations
- **Role-Based Access**: Admin, primary, and supporter roles with appropriate permissions
- **Invitation System**: Secure supporter onboarding

### Security & Privacy Architecture
The meal train feature uses shared visibility helper functions (`checkMealTrainVisibility` and `checkAddressVisibility`) that enforce consistent privacy controls across all routes:
- `mealTrain.get`: Returns meal train data only to authorized users
- `mealTrain.listSignups`: Returns signup data only to authorized users
- `mealTrain.volunteer`: Allows volunteering only by authorized users
- `mealTrain.updateSignup`: Allows updates only by the volunteer or admin/primary
- `mealTrain.cancelSignup`: Allows cancellations only by the volunteer or admin/primary

The UI/UX features a consistent glassmorphism theme across all pages, incorporating gradient backgrounds, animated gradient orbs, frosted glass cards, and enhanced shadow effects for a professional and modern aesthetic.

## External Dependencies
- **Database**: PostgreSQL (managed by Replit, accessed via Drizzle ORM)
- **Authentication**: Replit Auth (OpenID Connect via Passport.js)
- **Session Store**: PostgreSQL (using `connect-pg-simple`)
- **Frontend Framework**: React
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend Framework**: Express.js
- **API Layer**: tRPC
- **Package Manager**: pnpm
- **Runtime**: Node.js
- **SMS Notifications (Planned)**: Twilio (manual setup required)