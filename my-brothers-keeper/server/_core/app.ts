import * as Sentry from "@sentry/node";
import express, { type Express } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { setupAuth, isAuthenticated } from "../replitAuth";
import { setupTestAuth } from "../testAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import uploadRouter from "../uploadRouter";
import { getUser } from "../db";
import { processReminders } from "../reminderProcessor";
import { ObjectStorageService, ObjectNotFoundError } from "../objectStorage";

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

  await setupAuth(app);
  await setupTestAuth(app);

  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.use("/api", uploadRouter);
  app.use("/uploads", express.static("uploads"));

  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "File not found" });
      }
      return res.status(500).json({ error: "Error serving file" });
    }
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
