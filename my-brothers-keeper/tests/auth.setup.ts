import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

/**
 * Authentication setup for Playwright tests
 * Creates an authenticated session using test-only endpoints
 */
setup('authenticate', async ({ page, context }) => {
  console.log('Setting up test authentication...');

  // Navigate to the app
  await page.goto('/');

  // Use the test auth endpoint to create a session
  // This endpoint is only available in development/test environments
  const response = await page.request.post('/api/test/login', {
    data: {
      userId: 'test-user-playwright',
      email: 'playwright-test@example.com',
      firstName: 'Playwright',
      lastName: 'Test',
      role: 'admin',
    },
  });

  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  console.log('Test user created:', data.user?.email);

  // Verify we're authenticated by navigating to dashboard
  await page.goto('/dashboard');
  
  // Wait for dashboard to load (sidebar indicates authentication)
  await page.waitForSelector('nav', { timeout: 10000 });
  console.log('Authentication successful - dashboard loaded');

  // Save authentication state
  await context.storageState({ path: authFile });
  console.log('Auth state saved to:', authFile);
});
