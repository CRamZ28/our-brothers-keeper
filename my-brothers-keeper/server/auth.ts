import { ExpressAuth, getSession } from "@auth/express";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Resend from "@auth/express/providers/resend";
import type { Request, Response, NextFunction } from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "../drizzle/schema";

const { Pool } = pg;

let _pool: pg.Pool | null = null;
let _authDb: ReturnType<typeof drizzle> | null = null;
let _authConfig: ReturnType<typeof buildAuthConfig> | null = null;
let _authHandler: ReturnType<typeof ExpressAuth> | null = null;

function getAuthDb() {
  if (!_authDb && process.env.DATABASE_URL) {
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
    _authDb = drizzle(_pool);
  }
  return _authDb;
}

function buildAuthConfig() {
  const db = getAuthDb();
  if (!db) {
    throw new Error("DATABASE_URL is required for authentication");
  }
  if (!process.env.AUTH_SECRET) {
    throw new Error("AUTH_SECRET is required (generate with `openssl rand -hex 32`)");
  }
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is required to send magic-link emails");
  }

  return {
        basePath: "/api/auth",
        adapter: DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
    secret: process.env.AUTH_SECRET,
    trustHost: true,
    session: { strategy: "database" as const },
    providers: [
      Resend({
        apiKey: process.env.RESEND_API_KEY,
        from: process.env.AUTH_EMAIL_FROM ?? "Our Brother's Keeper <notifications@obkapp.com>",
      }),
    ],
        callbacks: {
      async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
        try {
          // Same-origin relative paths are safe.
          if (url.startsWith("/")) return `${baseUrl}${url}`;
          // Absolute URLs are allowed only when their ORIGIN matches ours. A
          // prefix check (startsWith) is bypassable, e.g. https://obkapp.com.evil.com.
          if (new URL(url).origin === new URL(baseUrl).origin) return url;
        } catch {
          // malformed URL → fall through to the safe default
        }
        return `${baseUrl}/dashboard`;
      },
      async session({ session, user }) {
        if (session.user && user?.id) {
          session.user.id = user.id;
        }
        return session;
      },
    },
  };
}

function getAuthConfig() {
  if (!_authConfig) {
    _authConfig = buildAuthConfig();
  }
  return _authConfig;
}

/**
 * Lazy-mounted Express handler for Auth.js. Returns a wrapper so the actual
 * handler is constructed on first request — this means a misconfigured env
 * won't crash the whole app at boot time.
 */
export const authHandler = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!_authHandler) {
      _authHandler = ExpressAuth(getAuthConfig());
    }
    return _authHandler(req, res, next);
  } catch (error) {
    console.error("[auth] handler init failed:", error);
    res.status(500).json({ error: "Authentication not configured" });
  }
};

/**
 * Express middleware that returns 401 unless the request carries a valid Auth.js session.
 * Sets `res.locals.session` for downstream handlers.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await getSession(req, getAuthConfig());
    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    res.locals.session = session;
    next();
  } catch (error) {
    console.error("[auth] requireAuth error:", error);
    res.status(500).json({ error: "Auth check failed" });
  }
}

/**
 * Returns the current user id from the Auth.js session, or null if not signed in.
 * Used by the tRPC context to build per-request user context.
 */
export async function getSessionUserId(req: Request): Promise<string | null> {
  try {
    const session = await getSession(req, getAuthConfig());
    return (session?.user as { id?: string } | undefined)?.id ?? null;
  } catch {
    return null;
  }
}
