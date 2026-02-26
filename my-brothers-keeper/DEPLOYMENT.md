# Our Brother's Keeper — Deployment Guide

This document explains everything you need to know to run this app outside of Replit. The codebase is currently written to run on Replit but the core app is fully portable — two pieces of infrastructure are Replit-specific and need to be swapped when self-hosting.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Backend | Express.js + tRPC |
| Database | PostgreSQL (via Drizzle ORM) |
| Auth | Replit Auth / OpenID Connect (Passport.js) |
| File Storage | Google Cloud Storage via Replit Sidecar |
| Email | Resend |
| Package Manager | pnpm (workspaces) |
| Runtime | Node.js |

---

## Prerequisites

- Node.js >= 18
- pnpm >= 8 (`npm install -g pnpm`)
- A PostgreSQL database (v14+)
- A [Resend](https://resend.com) account for email
- File/object storage (see below)

---

## Local Development Setup

```bash
# 1. Install dependencies
cd my-brothers-keeper
pnpm install

# 2. Copy and fill in environment variables
cp .env.example .env
# Edit .env with your values

# 3. Push database schema
pnpm db:push

# 4. Start the dev server
pnpm dev
```

The app runs on `http://localhost:5000` by default.

---

## Build for Production

```bash
pnpm build   # Builds frontend (Vite) + bundles server (esbuild) into dist/
pnpm start   # Runs dist/index.js
```

---

## Replit-Specific Code — What to Replace When Self-Hosting

### 1. Authentication (`server/replitAuth.ts`)

The app currently uses **Replit Auth** (OpenID Connect) via Passport.js. On Replit, the following env vars are injected automatically:

- `REPLIT_DOMAINS` — the allowed domain(s) for OIDC redirect
- `REPL_ID` — used as the OIDC client ID
- `ISSUER_URL` — defaults to `https://replit.com/oidc`

**To self-host**, you have two options:

**Option A — Replace with a standard OIDC provider** (recommended):
Swap `server/replitAuth.ts` with any Passport.js-compatible OIDC strategy (Google, Auth0, Clerk, etc.). The `setupAuth()` function is called once in `server/_core/index.ts`, and `isAuthenticated` is the middleware used on protected routes.

**Option B — Replace with username/password auth**:
Implement a local Passport strategy and issue JWTs or session cookies. Update `server/replitAuth.ts` accordingly.

The user object shape expected by the app (see `shared/_core/` and `drizzle/schema.ts`):
```ts
{
  id: string,         // unique user ID (from OIDC sub claim)
  email: string,
  firstName: string,
  lastName: string,
  profileImageUrl: string | null
}
```

---

### 2. File / Object Storage (`server/objectStorage.ts`)

The app currently uses **Replit Object Storage**, which is a Google Cloud Storage bucket accessed through Replit's internal sidecar proxy at `http://127.0.0.1:1106`.

Env vars used on Replit (set automatically):
- `PRIVATE_OBJECT_DIR` — bucket name/path prefix (e.g., `/obk-2xgfm9hb`)
- `REPLIT_SIDECAR_ENDPOINT` — injected by Replit at `http://127.0.0.1:1106`

**To self-host**, replace `server/objectStorage.ts` with your own storage adapter. The file exports a class `ObjectStorageService` with these methods:

```ts
uploadFile(filePath: string, file: Express.Multer.File): Promise<string>
getObjectEntityFile(filePath: string): Promise<Buffer>
downloadObject(filePath: string): Promise<Buffer>
signObjectURL(filePath: string): Promise<string>
```

Good replacement options:
- **AWS S3** — use `@aws-sdk/client-s3` (already in package.json as a dependency)
- **Cloudflare R2** — S3-compatible, very cost-effective
- **Supabase Storage** — if using Supabase for the DB as well
- **Local disk** — for development only

File uploads are handled in `server/uploadRouter.ts` which uses `multer` in memory mode and passes files to `objectStorage.ts`.

---

## Database

The app uses **PostgreSQL** with Drizzle ORM. Schema is in `drizzle/schema.ts`.

```bash
# Push schema changes to your database (no migration files needed)
pnpm db:push
```

Set `DATABASE_URL` in your `.env` to a full PostgreSQL connection string:
```
DATABASQL_URL=postgresql://user:password@host:5432/dbname
```

Sessions are stored in PostgreSQL via `connect-pg-simple` — no Redis needed.

---

## Email (Resend)

Email is handled in `server/emailService.ts` using [Resend](https://resend.com). All emails send from `notifications@obkapp.com` — if you change the FROM address you must verify that domain in Resend.

Set `RESEND_API_KEY` in your `.env`.

---

## Environment Variables Summary

See `.env.example` for the full annotated list. Required for production:

| Variable | Required | Notes |
|---|---|---|
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | Yes | Default: `5000` |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Random string, keep secret |
| `RESEND_API_KEY` | Yes | From resend.com |
| `REPLIT_DOMAINS` | Replit only | Auto-injected by Replit |
| `REPL_ID` | Replit only | Auto-injected by Replit |
| `ISSUER_URL` | Replit only | `https://replit.com/oidc` |
| `PRIVATE_OBJECT_DIR` | Replit only | Object storage bucket path |

---

## Hosting Recommendations (when ready)

| Platform | Notes |
|---|---|
| **Railway** | Easiest — supports Node + Postgres in one project, automatic deploys from GitHub |
| **Render** | Similar to Railway, free tier available |
| **Fly.io** | More control, good for persistent workloads |
| **DigitalOcean App Platform** | Simple, managed Postgres add-on available |
| **VPS (DigitalOcean/Linode)** | Full control, requires manual setup (Nginx, PM2, etc.) |

> Regardless of platform, you will need to replace `replitAuth.ts` and `objectStorage.ts` before the app will run outside Replit.

---

## Data Migration

When you're ready to move production data off Replit:

1. **Database**: Export from Replit's PostgreSQL using `pg_dump`:
   ```bash
   pg_dump "$DATABASE_URL" > backup.sql
   psql "$NEW_DATABASE_URL" < backup.sql
   ```
2. **Uploaded files**: Download all objects from your Replit Object Storage bucket and re-upload to your new storage provider. The Replit console/UI can be used to export files, or use the `@google-cloud/storage` SDK with the sidecar endpoint to list and download them.

---

## Project Structure

```
my-brothers-keeper/
  client/          # React frontend (Vite)
  server/          # Express + tRPC backend
    _core/         # App bootstrap (index.ts), auth, context
    drizzle/       # Database schema + migrations folder
    *.Router.ts    # tRPC/Express routers (one per feature)
    replitAuth.ts  # << REPLACE when self-hosting
    objectStorage.ts # << REPLACE when self-hosting
    emailService.ts  # Resend email service
    db.ts          # Drizzle DB client
  shared/          # Types and constants shared between client + server
  drizzle/         # Drizzle migration output
  scripts/         # Utility scripts
  tests/           # Playwright e2e tests
```
