import { Page } from '@playwright/test';

export class TestHelpers {
  constructor(public page: Page) {}

  /**
   * Wait for the page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Navigate and wait for sidebar to be visible (indicates logged in state)
   */
  async navigateAndWaitForSidebar(path: string) {
    await this.page.goto(path);
    await this.page.waitForSelector('nav', { timeout: 10000 });
  }

  /**
   * Check if user is on dashboard
   */
  async isOnDashboard() {
    return this.page.url().includes('/dashboard');
  }

  /**
   * Fill glassmorphic form input by label
   */
  async fillInputByLabel(label: string, value: string) {
    const input = this.page.getByLabel(label, { exact: false });
    await input.fill(value);
  }

  /**
   * Click glassmorphic button by text
   */
  async clickButtonByText(text: string) {
    const button = this.page.getByRole('button', { name: text });
    await button.click();
  }

  /**
   * Wait for toast notification
   */
  async waitForToast(text?: string) {
    if (text) {
      await this.page.getByText(text).waitFor({ state: 'visible', timeout: 5000 });
    } else {
      await this.page.locator('[data-sonner-toast]').first().waitFor({ state: 'visible', timeout: 5000 });
    }
  }

  /**
   * Navigate using sidebar
   */
  async navigateViaSidebar(linkText: string) {
    const sidebarLink = this.page.getByRole('button', { name: linkText });
    await sidebarLink.click();
    await this.waitForPageLoad();
  }

  /**
   * Select from dropdown by value
   */
  async selectDropdownValue(selectLabel: string, value: string) {
    await this.page.getByLabel(selectLabel).click();
    await this.page.getByRole('option', { name: value }).click();
  }
}
