// Authentication module — local dev auth with session-based login
// Replaces Replit OIDC auth for self-hosted deployments.
//
// For production, swap the local strategy with Google OAuth, Auth0, Clerk, etc.
// The setupAuth() and isAuthenticated exports are consumed by server/_core/index.ts
// and must keep their signatures stable.

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { upsertUser, getUser } from "./db";
import type { UpsertUser } from "../drizzle/schema";
import { randomUUID } from "crypto";

// Extend Express session to include returnTo property
declare module "express-session" {
  interface SessionData {
    returnTo?: string;
  }
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  const isProduction = process.env.NODE_ENV === "production";

  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: sessionTtl,
    },
  });
}

/**
 * Upsert a user record from login form data.
 * Mirrors the shape the rest of the app expects.
 */
async function upsertLocalUser(data: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}) {
  const userData: UpsertUser = {
    id: data.id,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    profileImageUrl: null,
    name: [data.firstName, data.lastName].filter(Boolean).join(" ") || null,
    lastSignedIn: new Date(),
  };
  await upsertUser(userData);
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize the whole session user object (same approach as Replit Auth used)
  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // ── Login page (HTML form) ────────────────────────────────
  app.get("/api/login", (req, res) => {
    // Store intended redirect path in session if provided
    if (req.query.redirect && typeof req.query.redirect === "string") {
      const redirect = req.query.redirect;
      if (redirect.startsWith("/") && !redirect.includes("//")) {
        req.session.returnTo = redirect;
      }
    }

    // If already authenticated, redirect to home or returnTo
    if (req.isAuthenticated && req.isAuthenticated()) {
      const redirectTo = req.session.returnTo || "/";
      delete req.session.returnTo;
      return res.redirect(redirectTo);
    }

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sign In – Our Brother's Keeper</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #f0fdfa; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,.08); padding: 2.5rem; width: 100%; max-width: 420px; }
    h1 { font-size: 1.5rem; color: #0d9488; margin-bottom: .25rem; }
    .subtitle { color: #64748b; font-size: .875rem; margin-bottom: 1.5rem; }
    label { display: block; font-size: .875rem; font-weight: 500; color: #334155; margin-bottom: .25rem; }
    input { width: 100%; padding: .625rem .75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: .875rem; margin-bottom: 1rem; }
    input:focus { outline: none; border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13,148,136,.15); }
    button { width: 100%; padding: .75rem; background: #0d9488; color: #fff; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; }
    button:hover { background: #0f766e; }
    .note { margin-top: 1.25rem; padding: .75rem; background: #fef3c7; border-radius: 8px; font-size: .8rem; color: #92400e; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Our Brother's Keeper</h1>
    <p class="subtitle">Development Login</p>
    <form method="POST" action="/api/login">
      <label for="email">Email</label>
      <input id="email" name="email" type="email" required placeholder="you@example.com" />
      <label for="firstName">First Name</label>
      <input id="firstName" name="firstName" type="text" required placeholder="Jane" />
      <label for="lastName">Last Name</label>
      <input id="lastName" name="lastName" type="text" required placeholder="Doe" />
      <button type="submit">Sign In</button>
    </form>
    <div class="note">
      <strong>Dev mode:</strong> No password required. This login page is for local development only.
      Replace with Google OAuth, Auth0, or Clerk before deploying to production.
    </div>
  </div>
</body>
</html>`);
  });

  // ── Login handler ─────────────────────────────────────────
  app.post("/api/login", async (req, res, next) => {
    try {
      const { email, firstName, lastName } = req.body;

      if (!email || !firstName || !lastName) {
        return res.status(400).send("Email, first name, and last name are required.");
      }

      // Deterministic user ID based on email so the same email always maps to the same user
      const id = email as string;

      await upsertLocalUser({ id, email, firstName, lastName });

      // Build session user object matching the shape context.ts expects
      const sessionUser = {
        claims: {
          sub: id,
          email,
          first_name: firstName,
          last_name: lastName,
          exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 1 week
        },
        access_token: `dev-token-${randomUUID()}`,
        refresh_token: `dev-refresh-${randomUUID()}`,
        expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };

      req.login(sessionUser, (err) => {
        if (err) return next(err);

        const redirectTo = req.session.returnTo || "/";
        delete req.session.returnTo;
        res.redirect(redirectTo);
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).send("Internal server error during login.");
    }
  });

  // ── Callback route (kept for compatibility — redirects to login) ──
  app.get("/api/callback", (_req, res) => {
    res.redirect("/api/login");
  });

  // ── Logout ────────────────────────────────────────────────
  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

/**
 * Express middleware that gates routes behind authentication.
 * Returns 401 if the session is missing or expired.
 */
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  // Token has expired — in dev mode we simply reject (no refresh flow)
  return res.status(401).json({ message: "Unauthorized" });
};
