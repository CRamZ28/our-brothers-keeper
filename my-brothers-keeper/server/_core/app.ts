import * as Sentry from "@sentry/node";
import express, { type Express } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { authHandler } from "../auth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import uploadRouter from "../uploadRouter";
import { processReminders } from "../reminderProcessor";

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
  app.use("/api/auth/*", authHandler);

  app.use("/api", uploadRouter);
  app.use("/uploads", express.static("uploads"));

  // Legacy object paths (/objects/...) referenced the old Replit/GCS bucket,
  // which no longer exists. New uploads live on Vercel Blob and are referenced by
  // their full CDN URL, so they never hit this route. Kept only so any stale
  // reference in old data degrades to a clean 404 instead of a 500.
  app.get("/objects/:objectPath(*)", (_req, res) => {
    res.status(404).json({ error: "File not found" });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}
