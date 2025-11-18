// Test-only authentication helpers for E2E testing
// This file provides endpoints to create authenticated sessions for automated tests
// SECURITY: Only enabled in development/test environments

import type { Express } from "express";
import { upsertUser, getUser } from "./db";
import type { UpsertUser } from "../drizzle/schema";

export async function setupTestAuth(app: Express) {
  // Only enable test auth in development/test environments
  if (process.env.NODE_ENV === 'production') {
    console.log('Test auth endpoints disabled in production');
    return;
  }

  console.log('⚠️  Test auth endpoints enabled (development only)');

  /**
   * Test endpoint: Create an authenticated session
   * POST /api/test/login
   * Body: { userId?: string, email?: string, role?: string }
   */
  app.post('/api/test/login', async (req, res) => {
    try {
      const {
        userId = 'test-user-123',
        email = 'test@example.com',
        firstName = 'Test',
        lastName = 'User',
        role = 'admin'
      } = req.body || {};

      // Create or update test user in database
      const userData: UpsertUser = {
        id: userId,
        email,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        profileImageUrl: null,
        lastSignedIn: new Date(),
      };

      await upsertUser(userData);

      // Get the full user record
      const user = await getUser(userId);
      
      if (!user) {
        return res.status(500).json({ error: 'Failed to create test user' });
      }

      // Create a mock session user object similar to Replit Auth
      const sessionUser = {
        claims: {
          sub: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 1 week
        },
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
      };

      // Log in the user using Passport's login method
      req.login(sessionUser, (err) => {
        if (err) {
          console.error('Test login error:', err);
          return res.status(500).json({ error: 'Failed to create session' });
        }

        res.json({
          success: true,
          user: {
            id: userId,
            email,
            firstName,
            lastName,
            role,
          },
        });
      });
    } catch (error) {
      console.error('Test auth error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Test endpoint: Logout current session
   * POST /api/test/logout
   */
  app.post('/api/test/logout', (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  /**
   * Test endpoint: Get current session info
   * GET /api/test/session
   */
  app.get('/api/test/session', (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      res.json({
        authenticated: true,
        user: {
          id: user.claims?.sub,
          email: user.claims?.email,
          firstName: user.claims?.first_name,
          lastName: user.claims?.last_name,
        },
      });
    } else {
      res.json({ authenticated: false });
    }
  });
}
