import { test, expect } from '@playwright/test';
import { testData } from '../fixtures/testData';

test.describe('Needs Board', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to needs page
    // Note: Requires authentication
    await page.goto('/needs');
  });

  test.skip('should display needs board with view toggle', async ({ page }) => {
    // Check for List/Calendar toggle
    await expect(page.getByRole('button', { name: /List/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Calendar/ })).toBeVisible();
  });

  test.skip('should toggle between list and calendar views', async ({ page }) => {
    // Click calendar view
    await page.getByRole('button', { name: /Calendar/ }).click();
    
    // Verify calendar view is active (button should have active styling)
    const calendarButton = page.getByRole('button', { name: /Calendar/ });
    await expect(calendarButton).toHaveClass(/bg-\[#B08CA7\]/);
    
    // Click list view
    await page.getByRole('button', { name: /List/ }).click();
    
    // Verify list view is active
    const listButton = page.getByRole('button', { name: /List/ });
    await expect(listButton).toHaveClass(/bg-\[#B08CA7\]/);
  });

  test.skip('should show Add Need button for admin/primary users', async ({ page }) => {
    // Only visible for admin/primary roles
    await expect(page.getByRole('button', { name: /Add Need/ })).toBeVisible();
  });

  test.skip('should create a new need successfully', async ({ page }) => {
    // Click Add Need button
    await page.getByRole('button', { name: /Add Need/ }).click();
    
    // Fill out the form
    await page.getByLabel('Title *').fill(testData.need.title);
    
    // Select category
    await page.getByLabel('Category').click();
    await page.getByRole('option', { name: testData.need.category }).click();
    
    // Select priority
    await page.getByLabel('Priority').click();
    await page.getByRole('option', { name: 'Normal' }).click();
    
    // Set visibility to Everyone
    await page.getByLabel('Who Can See This').click();
    await page.getByRole('option', { name: 'Everyone' }).click();
    
    // Add details
    await page.getByLabel('Details (optional)').fill(testData.need.description);
    
    // Submit form
    await page.getByRole('button', { name: 'Create Need' }).click();
    
    // Verify success toast
    await expect(page.getByText('Need created successfully')).toBeVisible({ timeout: 5000 });
    
    // Verify the need appears in the list
    await expect(page.getByText(testData.need.title)).toBeVisible();
  });

  test.skip('should validate required fields when creating need', async ({ page }) => {
    // Click Add Need button
    await page.getByRole('button', { name: /Add Need/ }).click();
    
    // Try to submit without filling title
    await page.getByRole('button', { name: 'Create Need' }).click();
    
    // Should show validation error
    await expect(page.getByText('Please enter a title')).toBeVisible();
  });

  test.skip('should allow claiming a need', async ({ page }) => {
    // Find a need card and click claim button
    const needCard = page.locator('[data-testid="need-card"]').first();
    await needCard.getByRole('button', { name: /Claim/ }).click();
    
    // Verify toast notification
    await expect(page.getByText(/claimed/i)).toBeVisible();
  });

  test.skip('should filter needs by category', async ({ page }) => {
    // Click category filter (if available)
    await page.getByLabel('Filter by category').click();
    await page.getByRole('option', { name: 'Meals' }).click();
    
    // Verify only meals category needs are shown
    const needs = page.locator('[data-category="meals"]');
    await expect(needs.first()).toBeVisible();
  });
});
