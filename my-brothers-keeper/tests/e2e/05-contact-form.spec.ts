import { test, expect } from '@playwright/test';
import { testData } from '../fixtures/testData';

test.describe('Contact Support Form', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to contact page
    // Note: Requires authentication (provided by auth.setup.ts)
    await page.goto('/contact');
  });

  test('should display contact form', async ({ page }) => {
    // Check for form elements
    await expect(page.getByText('CONTACT SUPPORT')).toBeVisible();
    await expect(page.getByLabel('Request Type')).toBeVisible();
    await expect(page.getByLabel('Subject *')).toBeVisible();
    await expect(page.getByLabel('Message *')).toBeVisible();
  });

  test('should have Feature Suggestion as default request type', async ({ page }) => {
    // Check default value
    const selectTrigger = page.getByLabel('Request Type');
    await expect(selectTrigger).toContainText('💡 Feature Suggestion');
  });

  test.skip('should show all request type options', async ({ page }) => {
    // Click request type dropdown
    await page.getByLabel('Request Type').click();
    
    // Verify all options
    await expect(page.getByRole('option', { name: /Feature Suggestion/ })).toBeVisible();
    await expect(page.getByRole('option', { name: /Bug Report/ })).toBeVisible();
    await expect(page.getByRole('option', { name: /General Feedback/ })).toBeVisible();
    await expect(page.getByRole('option', { name: /URL Change Request/ })).toBeVisible();
  });

  test.skip('should submit contact form successfully', async ({ page }) => {
    // Fill out form
    await page.getByLabel('Subject *').fill(testData.contactForm.subject);
    await page.getByLabel('Message *').fill(testData.contactForm.message);
    
    // Select request type
    await page.getByLabel('Request Type').click();
    await page.getByRole('option', { name: /Bug Report/ }).click();
    
    // Submit form
    await page.getByRole('button', { name: 'Send Message' }).click();
    
    // Verify success toast
    await expect(page.getByText('Message sent successfully')).toBeVisible({ timeout: 5000 });
    
    // Form should be cleared
    await expect(page.getByLabel('Subject *')).toHaveValue('');
    await expect(page.getByLabel('Message *')).toHaveValue('');
  });

  test.skip('should validate required fields', async ({ page }) => {
    // Try to submit without subject
    await page.getByLabel('Message *').fill('Test message');
    await page.getByRole('button', { name: 'Send Message' }).click();
    
    // Should show validation error
    await expect(page.getByText('Please enter a subject')).toBeVisible();
  });

  test.skip('should validate minimum message length', async ({ page }) => {
    // Fill with short message
    await page.getByLabel('Subject *').fill('Test');
    await page.getByLabel('Message *').fill('Short');
    
    await page.getByRole('button', { name: 'Send Message' }).click();
    
    // Should show validation error
    await expect(page.getByText(/at least 10 characters/)).toBeVisible();
  });

  test.skip('should show character count', async ({ page }) => {
    // Type in message field
    await page.getByLabel('Message *').fill('Test message');
    
    // Should display character count
    await expect(page.getByText(/12 characters/)).toBeVisible();
  });

  test.skip('should display user email', async ({ page }) => {
    // Should show logged in user's email
    await expect(page.getByText(/Your contact info:/)).toBeVisible();
  });
});
