import "dotenv/config";
import * as Sentry from "@sentry/node";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { setupAuth, isAuthenticated } from "../replitAuth";
import { setupTestAuth } from "../testAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import uploadRouter from "../uploadRouter";
import { getUser } from "../db";
import { processAutoPromotions } from "../autoPromotion";
import { processReminders } from "../reminderProcessor";
import { ENV } from "./env";
import { ObjectStorageService, ObjectNotFoundError } from "../objectStorage";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
    ],
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || "development",
  });
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Log object storage configuration on startup
  console.log("[ObjectStorage] Configuration:", {
    PRIVATE_OBJECT_DIR: process.env.PRIVATE_OBJECT_DIR || "NOT SET",
    PUBLIC_OBJECT_SEARCH_PATHS: process.env.PUBLIC_OBJECT_SEARCH_PATHS || "NOT SET",
  });
  
  // Sentry error handler must be registered early to capture all requests
  if (process.env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
  }
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Setup Replit Auth (includes sessions, passport, and auth routes)
  await setupAuth(app);
  
  // Setup test-only auth endpoints for E2E testing
  await setupTestAuth(app);
  
  // Auth endpoint for frontend
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
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
  
  // File upload endpoint
  app.use("/api", uploadRouter);
  
  // Serve uploaded files
  app.use("/uploads", express.static("uploads"));
  
  // Serve object storage files
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
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // development mode uses Vite, production mode uses static files
  if (!ENV.isProduction) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000");

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
    console.log(`Replit Auth enabled`);
    
    // Set up auto-promotion background job
    // Run once on startup to catch any pending promotions
    processAutoPromotions()
      .then(() => {
        console.log("[AutoPromotion] Initial auto-promotion check completed");
      })
      .catch((error) => {
        console.error("[AutoPromotion] Error during initial auto-promotion check:", error);
      });
    
    // Run every hour (3600000ms)
    const autoPromotionInterval = setInterval(() => {
      processAutoPromotions()
        .catch((error) => {
          console.error("[AutoPromotion] Error during scheduled auto-promotion:", error);
        });
    }, 3600000);
    
    // Set up reminder processing background job
    // Run once on startup to catch any pending reminders
    processReminders()
      .then(() => {
        console.log("[Reminders] Initial reminder check completed");
      })
      .catch((error) => {
        console.error("[Reminders] Error during initial reminder check:", error);
      });
    
    // Run every 15 minutes (900000ms) for timely reminder delivery
    const reminderInterval = setInterval(() => {
      processReminders()
        .catch((error) => {
          console.error("[Reminders] Error during scheduled reminder processing:", error);
        });
    }, 900000);
    
    // Clean up intervals on server shutdown
    process.on('SIGTERM', () => {
      console.log('[AutoPromotion] Cleaning up auto-promotion interval');
      console.log('[Reminders] Cleaning up reminder interval');
      clearInterval(autoPromotionInterval);
      clearInterval(reminderInterval);
    });
    
    console.log("[AutoPromotion] Background job scheduled to run every hour");
    console.log("[Reminders] Background job scheduled to run every 15 minutes");
  });
}

startServer().catch(console.error);
