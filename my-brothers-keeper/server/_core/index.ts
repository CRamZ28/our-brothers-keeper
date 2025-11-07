import "dotenv/config";
import * as Sentry from "@sentry/node";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { setupAuth, isAuthenticated } from "../replitAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import uploadRouter from "../uploadRouter";
import { getUser } from "../db";

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
  
  // Sentry error handler must be registered early to capture all requests
  if (process.env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
  }
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Setup Replit Auth (includes sessions, passport, and auth routes)
  await setupAuth(app);
  
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
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000");

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
    console.log(`Replit Auth enabled`);
  });
}

startServer().catch(console.error);
