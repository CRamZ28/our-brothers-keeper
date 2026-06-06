import * as Sentry from "@sentry/node";
import express, { type Express } from "express";
import helmet from "helmet";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { authHandler } from "../auth";
import { authRateLimit } from "../rateLimit";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { Readable } from "stream";
import { get } from "@vercel/blob";
import uploadRouter from "../uploadRouter";
import { processReminders } from "../reminderProcessor";
import { getSessionUserId } from "../auth";
import { getUser } from "../db";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [Sentry.httpIntegration(), Sentry.expressIntegration()],
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || "development",
  });
}

export async function createApp(): Promise<Express> {
  const app = express();

  // Required by @auth/express when running behind a proxy (Vercel does)
  app.set("trust proxy", true);

  // Security headers. CSP and COEP are left off to avoid breaking the SPA and
  // media loading, but this still adds HSTS, X-Content-Type-Options: nosniff,
  // a strict Referrer-Policy, and X-Frame-Options: DENY (clickjacking defense).
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      frameguard: { action: "deny" },
    })
  );

  if (process.env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
  }

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.get("/api/cron/reminders", async (req, res) => {
    const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
    if (!process.env.CRON_SECRET || req.headers.authorization !== expected) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      await processReminders();
      res.json({ ok: true });
    } catch (error) {
      console.error("[Cron] processReminders error:", error);
      res.status(500).json({ error: "Failed" });
    }
  });

  // Auth.js handles /api/auth/signin, /api/auth/callback/*, /api/auth/signout, /api/auth/session, etc.
  app.use("/api/auth/*", authRateLimit, authHandler);

  app.use("/api", uploadRouter);
  app.use("/uploads", express.static("uploads"));

  // Authenticated media proxy. Uploaded files are stored as PRIVATE Vercel Blob
  // objects under `uploads/<householdId>/...`; they are never world-readable.
  // A file is streamed only to a signed-in member of the owning household.
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const userId = await getSessionUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const user = await getUser(userId);
      if (!user?.householdId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Strip the leading "/objects/" to recover the blob pathname, and confirm
      // it lives in THIS user's household namespace.
      const pathname = req.path.replace(/^\/objects\//, "");
      if (!pathname.startsWith(`uploads/${user.householdId}/`)) {
        return res.status(404).json({ error: "File not found" });
      }

      const result = await get(pathname, { access: "private" });
      if (!result || result.statusCode !== 200) {
        return res.status(404).json({ error: "File not found" });
      }

      res.setHeader("Content-Type", result.blob.contentType);
      // Private per-user cache: the browser may reuse it, shared caches may not.
      res.setHeader("Cache-Control", "private, max-age=3600");
      Readable.fromWeb(result.stream as any).pipe(res);
    } catch (error) {
      console.error(
        "[objects] serve error:",
        error instanceof Error ? error.message : String(error)
      );
      if (!res.headersSent) {
        res.status(500).json({ error: "Error serving file" });
      }
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ error, path, type }) {
        // Surface the real server-side error (tRPC otherwise swallows it into the
        // HTTP 500 body, which the errorFormatter masks). Helps diagnose 500s.
        console.error(
          `[trpc] ${type} ${path ?? "<no-path>"} -> ${error.code}: ${error.message}`
        );
        const cause = (error.cause ?? undefined) as Error | undefined;
        if (cause) {
          console.error(`[trpc] cause:`, cause.stack ?? cause.message);
        }
      },
    })
  );

  return app;
}
