import { test, expect } from '@playwright/test';

test.describe('UI/UX and Glassmorphism Design', () => {
  test.skip('should display glassmorphism design on landing page', async ({ page }) => {
    await page.goto('/');
    
    // Check for background waves image
    const background = page.locator('body');
    await expect(background).toHaveCSS('background-image', /waves-bg\.png/);
    
    // Check for blur orbs
    await expect(page.locator('[data-testid="blur-orb"]')).toHaveCount(3);
  });

  test.skip('should show logo in sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for OBK emblem
    const logo = page.locator('img[alt*="Our Brother\'s Keeper"]');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('src', '/obk-emblem.png');
  });

  test.skip('should highlight active navigation item', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Dashboard link should be active (mauve purple)
    const dashboardLink = page.getByRole('button', { name: 'Dashboard' });
    await expect(dashboardLink).toHaveCSS('background', /rgba\(176, 140, 167/);
  });

  test.skip('should display user profile with gradient', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for user profile section at bottom
    const profileSection = page.locator('[data-testid="user-profile"]');
    await expect(profileSection).toBeVisible();
    
    // Should have gradient background
    await expect(profileSection).toHaveCSS('background', /gradient/);
  });

  test.skip('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/dashboard');
    
    // Mobile menu should be available
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
  });

  test.skip('should display glass cards with blur effect', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for glass cards
    const card = page.locator('[data-testid="glass-card"]').first();
    await expect(card).toBeVisible();
    
    // Should have backdrop-filter blur
    await expect(card).toHaveCSS('backdrop-filter', /blur/);
  });

  test.skip('should use neutral typography colors', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Text should be neutral colors (black, white, gray)
    // Exception: Family name with teal styling
    const familyName = page.locator('[data-testid="family-name"]');
    await expect(familyName).toHaveCSS('color', /#1fb5b0/);
  });
});

test.describe('Accessibility', () => {
  test.skip('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should have h1 for page title
    await expect(page.locator('h1')).toBeVisible();
  });

  test.skip('should have accessible form labels', async ({ page }) => {
    await page.goto('/contact');
    
    // All form inputs should have labels
    const subjectInput = page.getByLabel('Subject *');
    await expect(subjectInput).toBeVisible();
    
    const messageInput = page.getByLabel('Message *');
    await expect(messageInput).toBeVisible();
  });

  test.skip('should support keyboard navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Tab through navigation items
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to focus on sidebar links
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
