import { test, expect } from '@playwright/test';
import { testData } from '../fixtures/testData';

test.describe('Events Calendar', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to calendar page
    // Note: Requires authentication
    await page.goto('/calendar');
  });

  test.skip('should display calendar with view toggle', async ({ page }) => {
    // Check for Calendar/List toggle
    await expect(page.getByRole('button', { name: /Calendar/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /List/ })).toBeVisible();
  });

  test.skip('should show Create Event button for admin/primary users', async ({ page }) => {
    // Only visible for admin/primary roles
    await expect(page.getByRole('button', { name: 'Create Event' })).toBeVisible();
  });

  test.skip('should create a new event successfully', async ({ page }) => {
    // Click Create Event button
    await page.getByRole('button', { name: 'Create Event' }).click();
    
    // Fill out the form
    await page.getByLabel('Title *').fill(testData.event.title);
    await page.getByLabel('Description (optional)').fill(testData.event.description);
    await page.getByLabel('Location (optional)').fill(testData.event.location);
    
    // Select event type
    await page.getByLabel('Event Type').click();
    await page.getByRole('option', { name: 'Regular Event' }).click();
    
    // Set visibility to Everyone
    await page.getByLabel('Who Can See This').click();
    await page.getByRole('option', { name: 'Everyone' }).click();
    
    // Set start date
    await page.getByLabel('Start Date *').fill(testData.event.date);
    
    // Set start time
    await page.getByLabel('Start Time (optional)').fill('14:00');
    
    // Submit form
    await page.getByRole('button', { name: 'Create Event' }).click();
    
    // Verify success toast
    await expect(page.getByText('Event created successfully')).toBeVisible({ timeout: 5000 });
    
    // Verify the event appears
    await expect(page.getByText(testData.event.title)).toBeVisible();
  });

  test.skip('should validate required fields when creating event', async ({ page }) => {
    // Click Create Event button
    await page.getByRole('button', { name: 'Create Event' }).click();
    
    // Try to submit without filling title
    await page.getByRole('button', { name: 'Create Event' }).click();
    
    // Should show validation error
    await expect(page.getByText('Please enter a title')).toBeVisible();
  });

  test.skip('should allow RSVP to events', async ({ page }) => {
    // Find an event and click RSVP
    const eventCard = page.locator('[data-testid="event-card"]').first();
    await eventCard.getByRole('button', { name: /RSVP/ }).click();
    
    // Verify toast notification
    await expect(page.getByText(/RSVP/i)).toBeVisible();
  });

  test.skip('should toggle between calendar and list views', async ({ page }) => {
    // Click list view
    await page.getByRole('button', { name: /List/ }).click();
    
    // Verify list view is active
    const listButton = page.getByRole('button', { name: /List/ });
    await expect(listButton).toHaveClass(/bg-\[#B08CA7\]/);
    
    // Click calendar view
    await page.getByRole('button', { name: /Calendar/ }).click();
    
    // Verify calendar view is active
    const calendarButton = page.getByRole('button', { name: /Calendar/ });
    await expect(calendarButton).toHaveClass(/bg-\[#B08CA7\]/);
  });

  test.skip('should display Important Dates toggle', async ({ page }) => {
    // Check for Important Dates checkbox/toggle
    await expect(page.getByLabel(/Important Dates/i)).toBeVisible();
  });
});
