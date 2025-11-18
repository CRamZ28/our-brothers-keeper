import { test, expect } from '@playwright/test';

test.describe('Questions Page (Admin/Primary Only)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to questions page
    // Note: Requires authentication as admin/primary user
    await page.goto('/questions');
  });

  test.skip('should display questions page for admin users', async ({ page }) => {
    // Check for page title
    await expect(page.getByText('Questions & Messages')).toBeVisible();
  });

  test.skip('should show unread count in sidebar', async ({ page }) => {
    // Navigate to dashboard first
    await page.goto('/dashboard');
    
    // Check for Questions link with unread count
    const questionsLink = page.getByRole('button', { name: /Questions/ });
    await expect(questionsLink).toBeVisible();
    
    // Should show count in parentheses if there are unread questions
    // e.g., "Questions (3)"
  });

  test.skip('should display list of questions', async ({ page }) => {
    // Check for questions list
    await expect(page.locator('[data-testid="question-item"]').first()).toBeVisible();
  });

  test.skip('should mark question as read', async ({ page }) => {
    // Click on a question
    const question = page.locator('[data-testid="question-item"]').first();
    await question.click();
    
    // Question should be marked as read (styling change)
    // Unread count should decrease
  });

  test.skip('should reply to a question', async ({ page }) => {
    // Click on a question
    const question = page.locator('[data-testid="question-item"]').first();
    await question.click();
    
    // Fill in reply
    await page.getByLabel('Your Reply').fill('Thank you for your question. Here is the answer...');
    
    // Submit reply
    await page.getByRole('button', { name: 'Send Reply' }).click();
    
    // Verify success
    await expect(page.getByText('Reply sent successfully')).toBeVisible();
  });

  test.skip('should show threaded conversation', async ({ page }) => {
    // Click on a question with replies
    const question = page.locator('[data-testid="question-item"]').first();
    await question.click();
    
    // Should display original question and all replies
    await expect(page.locator('[data-testid="question-reply"]').first()).toBeVisible();
  });

  test.skip('should filter between read and unread questions', async ({ page }) => {
    // Check for filter options
    await page.getByLabel('Show').click();
    await page.getByRole('option', { name: 'Unread Only' }).click();
    
    // Should only show unread questions
  });
});
