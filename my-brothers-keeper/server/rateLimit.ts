import type { Request, Response, NextFunction } from "express";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting for the authentication channel.
 *
 * Magic-link sign-in is unauthenticated and triggers an email per request, so
 * without throttling an attacker can flood a victim's inbox and burn the Resend
 * quota. This caps sign-in attempts per target email (falling back to IP).
 *
 * Backed by Upstash Redis so the limit is durable across serverless instances.
 * It is FAIL-OPEN: if Upstash isn't configured, or any error occurs, sign-in
 * proceeds normally — we never lock legitimate families out over rate limiting.
 *
 * To activate: connect an Upstash Redis store to the Vercel project (Storage →
 * Marketplace → Upstash for Redis), which injects UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN.
 */
let limiter: Ratelimit | null | undefined;

function getLimiter(): Ratelimit | null {
  if (limiter !== undefined) {
    return limiter;
  }
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    limiter = null; // not configured → disabled
    return null;
  }
  try {
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      // 5 sign-in attempts per identifier per 10 minutes.
      limiter: Ratelimit.slidingWindow(5, "10 m"),
      prefix: "rl:auth",
      analytics: false,
    });
  } catch (error) {
    console.error(
      "[rateLimit] init failed (disabling):",
      error instanceof Error ? error.message : String(error)
    );
    limiter = null;
  }
  return limiter;
}

export async function authRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Only the sign-in POST sends emails; let GET callbacks etc. through.
  if (req.method !== "POST") {
    return next();
  }

  const rl = getLimiter();
  if (!rl) {
    return next(); // fail-open: not configured
  }

  try {
    const fwd = req.headers["x-forwarded-for"];
    const ip = (Array.isArray(fwd) ? fwd[0] : fwd || req.ip || "unknown")
      .split(",")[0]
      .trim();
    const email = String((req.body as { email?: unknown })?.email ?? "")
      .toLowerCase()
      .trim();

    // Throttle per target email (the inbox-flooding vector); fall back to IP.
    const identifier = email ? `email:${email}` : `ip:${ip}`;
    const { success } = await rl.limit(identifier);
    if (!success) {
      return res.status(429).json({
        error: "Too many sign-in attempts. Please wait a few minutes and try again.",
      });
    }
  } catch (error) {
    // Fail-open on any limiter error — never block a legitimate sign-in.
    console.error(
      "[rateLimit] check failed (allowing):",
      error instanceof Error ? error.message : String(error)
    );
  }

  return next();
}
