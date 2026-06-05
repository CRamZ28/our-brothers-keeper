# Our Brother's Keeper — Deployment Guide

This document explains everything you need to know to run this app outside of Replit. The codebase is currently written to run on Replit but the core app is fully portable — two pieces of infrastructure are Replit-specific and need to be swapped when self-hosting.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Backend | Express.js + tRPC |
| Database | PostgreSQL via [Neon](https://neon.tech) (Drizzle ORM) |
| Auth | Replit Auth / OpenID Connect (Passport.js) |
| File Storage | Vercel Blob (direct browser-to-Blob uploads) |
| Email | Resend |
| Package Manager | pnpm (workspaces) |
| Runtime | Node.js |

---

## Prerequisites

- Node.js >= 18
- pnpm >= 8 (`npm install -g pnpm`)
- A [Neon](https://neon.tech) account for PostgreSQL (free tier works — project `obk-prod` already created under c.ramsey28@gmail.com)
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

### 2. File / Object Storage — **Vercel Blob** (done)

File storage uses **[Vercel Blob](https://vercel.com/docs/vercel-blob)**. This was previously Replit Object Storage (a GCS bucket via Replit's sidecar) and has been fully swapped — no Replit-specific storage code remains.

**How it works:**
- The browser uploads files **directly to Blob** using `@vercel/blob/client`'s `upload()` (see `client/src/lib/uploadFile.ts`). Large files (videos up to 50MB) therefore never pass through the serverless function, which Vercel caps at ~4.5MB per request body.
- `server/uploadRouter.ts` exposes `POST /api/upload`, which is **authenticated** (`requireAuth`) and only mints a short-lived, scoped upload token (`handleUpload` → `onBeforeGenerateToken`). It enforces an allowed content-type list and a 50MB size cap server-side.
- `server/objectStorage.ts` is now a thin Vercel Blob wrapper (`ObjectStorageService`) used for **server-side** storage only — e.g. the one-off photo migration script and best-effort blob deletion.

**Setup:** In the Vercel dashboard, open the **Storage** tab, create a **Blob** store, and connect it to the project. This injects `BLOB_READ_WRITE_TOKEN` automatically — that is the only required configuration. For local dev, run `vercel env pull .env` (or paste the token into `.env`); uploads fail without it.

> **Note:** `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` are still listed in `package.json` from an earlier, abandoned S3 plan. They are unused and can be removed.

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
| `BLOB_READ_WRITE_TOKEN` | Yes (prod) | Auto-injected when a Vercel Blob store is connected to the project; powers photo/video uploads |

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
2. **Uploaded files**: New uploads already live in Vercel Blob and are referenced by their full CDN URL in the database. Any legacy `/objects/...` references from the Replit era point to the old (now-gone) GCS bucket and will 404 — re-upload those few assets through the app if needed.

---

## Project Structure

```
my-brothers-keeper/
  client/          # React frontend (Vite)
  server/          # Express + tRPC backend
    _core/         # App bootstrap (index.ts), auth, context
    drizzle/       # Database schema + migrations folder
    *.Router.ts    # tRPC/Express routers (one per feature)
    auth.ts        # Auth.js (email magic links via Resend)
    objectStorage.ts # Vercel Blob wrapper (server-side storage)
    uploadRouter.ts  # Authenticated Blob upload-token route
    emailService.ts  # Resend email service
    db.ts          # Drizzle DB client
  shared/          # Types and constants shared between client + server
  drizzle/         # Drizzle migration output
  scripts/         # Utility scripts
  tests/           # Playwright e2e tests
```
