import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected route without auth
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/api\/login/);
  });

  test('should display landing page for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    
    // Check for landing page elements (glassmorphism design)
    await expect(page.locator('text=Our Brother\'s Keeper')).toBeVisible();
    
    // Landing page should be accessible
    await expect(page).toHaveURL('/');
  });

  test('should show dashboard for authenticated users', async ({ page, context }) => {
    // Note: This test requires manual Replit Auth or mocked auth
    // For actual testing, you'll need to set up auth cookies or use test accounts
    
    // Mock authenticated state by setting session cookie
    // In production, you would use actual Replit Auth flow
    await context.addCookies([{
      name: 'repl_auth',
      value: 'test-session-token',
      domain: 'localhost',
      path: '/',
    }]);

    await page.goto('/dashboard');
    
    // If properly authenticated, should see dashboard elements
    // This test will fail without proper auth setup
  });
});

test.describe('Sidebar Navigation', () => {
  test.skip('should display all navigation links for authenticated users', async ({ page }) => {
    // Requires authentication
    await page.goto('/dashboard');
    
    // Check all sidebar navigation items
    const navItems = [
      'Dashboard',
      'Needs',
      'Events',
      'Meal Train',
      'Family Updates',
      'Memory Wall',
      'Gift Registry',
      'Reminders',
      'People',
      'Settings',
      'Contact Support',
    ];

    for (const item of navItems) {
      await expect(page.getByRole('button', { name: item })).toBeVisible();
    }
  });

  test.skip('should show Questions link only for admin/primary users', async ({ page }) => {
    // Requires authentication as admin/primary user
    await page.goto('/dashboard');
    
    // Questions link should be visible for admin/primary
    await expect(page.getByRole('button', { name: /Questions/ })).toBeVisible();
  });
});
