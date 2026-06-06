# Our Brother's Keeper — Deployment Guide

This document explains how the app is deployed and how to run it locally. The app is live on **[Vercel](https://vercel.com)** at [obkapp.com](https://obkapp.com), with the project root set to `my-brothers-keeper` and auto-deploys from the `main` branch. The Express + tRPC backend runs as a single serverless function (`api/index.js`, bundled from `server/_vercel/handler.ts`), backed by Neon Postgres (Drizzle ORM), Auth.js email magic links via Resend, and Vercel Blob for media.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Backend | Express.js + tRPC |
| Database | PostgreSQL via [Neon](https://neon.tech) (Drizzle ORM) |
| Auth | Auth.js (`@auth/express`) — email magic links via Resend |
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

## Authentication & File Storage

### 1. Authentication (`server/auth.ts`)

The app uses **Auth.js** (`@auth/express`) for passwordless **email magic-link** sign-in via Resend. The handler is mounted at `/api/auth/*` (see `server/_core/app.ts`), so Auth.js owns `/api/auth/signin`, `/api/auth/callback/*`, `/api/auth/signout`, `/api/auth/session`, etc. Sessions are database sessions persisted through the Drizzle adapter (`sessions` table).

Two helpers from `server/auth.ts` guard the rest of the app:

- `requireAuth` — Express middleware that returns `401` unless the request carries a valid Auth.js session.
- `getSessionUserId` — used by the tRPC context to resolve the current user id (or `null`) per request.

Required env vars: `AUTH_SECRET` (generate with `openssl rand -hex 32`), `RESEND_API_KEY`, and `DATABASE_URL`. Optionally set `AUTH_EMAIL_FROM` to override the magic-link sender address.

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
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

Sessions are Auth.js database sessions, persisted in PostgreSQL through the Drizzle adapter (`sessions` table) — no Redis needed.

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
| `AUTH_SECRET` | Yes | Random string for Auth.js (`openssl rand -hex 32`), keep secret |
| `RESEND_API_KEY` | Yes | From resend.com — sends magic-link + notification email |
| `CRON_SECRET` | Yes (prod) | Authenticates the Vercel Cron call to `/api/cron/reminders` via `Authorization: Bearer <CRON_SECRET>` |
| `BLOB_READ_WRITE_TOKEN` | Yes (prod) | Auto-injected when a Vercel Blob store is connected to the project; powers photo/video uploads |
| `AUTH_EMAIL_FROM` | Optional | Overrides the magic-link sender address |

---

## Deployment (Vercel)

The app is deployed on **Vercel** and live at [obkapp.com](https://obkapp.com).

- **Project root:** `my-brothers-keeper`.
- **Auto-deploy:** every push to `main` triggers a production deploy.
- **Build** (`vercel.json`): Vite builds the frontend to `dist/public`, and esbuild bundles `server/_vercel/handler.ts` into `api/index.js` — the whole Express + tRPC backend runs as one serverless function. Requests to `/api/*` and `/objects/*` rewrite to it; everything else serves the SPA `index.html`.
- **Environment:** set the variables from the table above in the Vercel project settings. Connecting a Vercel Blob store auto-injects `BLOB_READ_WRITE_TOKEN`.
- **Reminders:** a Vercel Cron entry in `vercel.json` hits `/api/cron/reminders` on schedule `0 0 * * *` (once daily, the max cadence on the Hobby plan). The route is protected by `CRON_SECRET` (`Authorization: Bearer <CRON_SECRET>`).

> Self-hosting on a generic Node host (Railway, Render, Fly.io, a VPS, etc.) is possible since the core app is portable — you'd run `pnpm build` / `pnpm start` instead of the serverless bundle and provide your own scheduler for the reminders job — but Vercel is the supported deployment.

---

## Backups

1. **Database**: Dump the Neon Postgres database with `pg_dump`:
   ```bash
   pg_dump "$DATABASE_URL" > backup.sql
   # restore into another database:
   psql "$NEW_DATABASE_URL" < backup.sql
   ```
2. **Uploaded files**: Media lives in **Vercel Blob** and is referenced by its full CDN URL in the database. Blob objects persist independently of deploys; if you migrate stores, re-point or re-upload assets as needed.

---

## Project Structure

```
my-brothers-keeper/
  client/          # React frontend (Vite)
  server/          # Express + tRPC backend
    _core/         # App bootstrap (app.ts), auth wiring, tRPC context
    _vercel/       # Serverless entry (handler.ts → bundled to api/index.js)
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
