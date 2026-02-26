# Our Brother's Keeper

A compassionate platform that helps families and communities provide sustained, meaningful support to those who have lost a loved one.

> **Status**: Currently hosted on Replit. Archived in GitHub for future migration to independent hosting.

---

## What It Does

Our Brother's Keeper gives a grieving family a private, organized hub where their support community can:

- **Needs Board** — Post and claim practical needs (meals, errands, childcare, etc.)
- **Meal Train** — Schedule and coordinate meal delivery
- **Events Calendar** — Share important dates and upcoming gatherings
- **Family Updates** — Post announcements and media for supporters to see
- **Memory Wall** — Drag-and-drop vision board for shared memories, stories, and photos
- **Messaging** — Direct messages between supporters and the family
- **Reminders** — Personal and event-linked email reminders
- **Resources** — Curated grief support guidance (faith-based and general)
- **People Management** — Invite supporters, manage access tiers, create groups

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Backend | Express.js + tRPC |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Replit Auth (OpenID Connect / Passport.js) |
| File Storage | Replit Object Storage (Google Cloud Storage sidecar) |
| Email | Resend |
| Package Manager | pnpm (workspaces) |
| Runtime | Node.js 18+ |

---

## Repository Structure

```
our-brothers-keeper/
  my-brothers-keeper/    # Main application (all source code lives here)
    client/              # React frontend
    server/              # Express + tRPC API
    shared/              # Shared types and constants
    drizzle/             # DB schema and migration outputs
    scripts/             # Utility scripts
    tests/               # Playwright end-to-end tests
    DEPLOYMENT.md        # Self-hosting guide
    .env.example         # Required environment variables
  attached_assets/       # Design assets
```

---

## Quick Start

```bash
cd my-brothers-keeper
cp .env.example .env      # Fill in your values
pnpm install
pnpm db:push              # Apply DB schema
pnpm dev                  # Start dev server at http://localhost:5000
```

See [`my-brothers-keeper/DEPLOYMENT.md`](my-brothers-keeper/DEPLOYMENT.md) for full setup instructions, including what to replace when hosting outside of Replit.

---

## Hosting & Migration

This app is **currently Replit-dependent** in two places:

1. **Authentication** — `server/replitAuth.ts` uses Replit's OIDC provider
2. **File storage** — `server/objectStorage.ts` uses Replit's internal GCS sidecar

Everything else (database, email, frontend, API) is standard and portable. See [DEPLOYMENT.md](my-brothers-keeper/DEPLOYMENT.md) for step-by-step migration instructions.

---

## External Services Required

| Service | Purpose | Link |
|---|---|---|
| PostgreSQL | Database | Any provider |
| Resend | Transactional email | [resend.com](https://resend.com) |
| Auth Provider | User login (when off Replit) | Auth0, Clerk, Google OAuth, etc. |
| Object Storage | File uploads (when off Replit) | AWS S3, Cloudflare R2, etc. |
