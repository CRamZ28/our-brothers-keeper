# Our Brother's Keeper - Replit Project Documentation

## Overview
Our Brother's Keeper is a compassionate platform designed to help families and communities provide sustained support to those who have lost a loved one. The application facilitates coordination of care through features like a needs board, shared calendar, meal train, messaging, and update tracking. The project aims to offer a robust and user-friendly experience for managing community support during difficult times.

## User Preferences
- **Design Style**: Modern glassmorphism with gradient backgrounds (teal → blue → purple)
- **Logo**: Custom wooden cross with "OBK" in teal (stored at `client/public/obk-logo.png`)

## System Architecture
The application is built with a React frontend (Vite, TypeScript, Tailwind CSS) and an Express.js backend utilizing tRPC for type-safe APIs. PostgreSQL is used as the database with Drizzle ORM, and Replit Auth handles authentication. The architecture emphasizes a clear separation of concerns with a `client/`, `server/`, and `shared/` directory structure. Core functionalities include comprehensive meal train management with calendar and list views, privacy controls, and volunteer sign-ups. The UI/UX features a consistent glassmorphism theme across all pages, incorporating gradient backgrounds, animated gradient orbs, frosted glass cards, and enhanced shadow effects for a professional and modern aesthetic. Key features include coordinating support needs, managing a shared calendar, enabling private communication, and sharing family updates. The system supports role-based access control and an invitation system for supporters.

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