# Testing Guide for Our Brother's Keeper

This guide explains how to run automated end-to-end tests for the Our Brother's Keeper platform.

## Overview

The test suite uses **Playwright** for end-to-end testing, covering all critical user workflows including:

- Authentication flow
- Needs Board (create, claim, filter)
- Events Calendar (create, RSVP, view toggle)
- Meal Train (sign up, unclaim, capacity)
- Contact Support form
- Questions/Messages (admin only)
- UI/UX glassmorphism design
- Accessibility

## Prerequisites

1. **Node.js and pnpm** installed
2. **PostgreSQL database** configured (see main README)
3. **Environment variables** set up (`.env` file)
4. **Dev server** running or configured to auto-start

## Installation

Playwright is already installed as a dev dependency. If you need to install it manually:

```bash
cd my-brothers-keeper
pnpm add -D @playwright/test playwright
```

Install Playwright browsers (first time only):

```bash
pnpm exec playwright install
```

## Running Tests

### Run all tests

```bash
pnpm test:e2e
```

### Run specific test file

```bash
pnpm exec playwright test tests/e2e/02-needs-board.spec.ts
```

### Run tests in UI mode (interactive)

```bash
pnpm exec playwright test --ui
```

### Run tests in headed mode (see browser)

```bash
pnpm exec playwright test --headed
```

### Run tests in debug mode

```bash
pnpm exec playwright test --debug
```

## Test Structure

```
my-brothers-keeper/
├── tests/
│   ├── e2e/
│   │   ├── auth.setup.ts                   # Auth setup (expects /api/test/login — not yet implemented)
│   │   ├── 01-authentication.spec.ts      # Login/auth flows
│   │   ├── 02-needs-board.spec.ts         # Needs CRUD operations
│   │   ├── 03-events-calendar.spec.ts     # Events CRUD operations
│   │   ├── 04-meal-train.spec.ts          # Meal train functionality
│   │   ├── 05-contact-form.spec.ts        # Contact form submission
│   │   ├── 06-questions-admin.spec.ts     # Admin questions feature
│   │   ├── 07-ui-ux.spec.ts               # Design & accessibility
│   │   └── helpers.ts                      # Test utilities
│   └── fixtures/
│       └── testData.ts                     # Test data constants
├── playwright.config.ts                    # Playwright configuration
└── TESTING.md                              # This file
```

## Important Notes

### Authentication

⚠️ **Automated test login is not yet wired up.**

The E2E suite is designed to authenticate via a test-only endpoint that would create authenticated sessions without requiring the email magic-link flow. That endpoint does **not exist yet** — `tests/e2e/auth.setup.ts` expects a `/api/test/login` endpoint that must still be added before the E2E suite can authenticate.

**How it's intended to work (once the endpoint exists):**

1. **Test Auth Endpoint** (`/api/test/login`): Development-only endpoint that creates valid sessions — **not yet implemented**
2. **Auth Setup** (`tests/e2e/auth.setup.ts`): Runs before all tests, creates an admin user session
3. **Storage State** (`playwright/.auth/user.json`): Saved authentication state reused across all tests
4. **Test User**: Created with admin privileges for full feature access

**The real auth stack:**
- Production/dev auth is **Auth.js** (`@auth/express`) using email magic links sent via **Resend** (`server/auth.ts`, mounted at `/api/auth/*`)
- Sessions are Auth.js database sessions via the Drizzle adapter (`sessions` table)
- The planned test-login endpoint must create a real session in the database, just like regular auth, but bypass the magic-link email step

### Test Data

Test data is defined in `tests/fixtures/testData.ts`. Update this file to match your test environment:

```typescript
export const testData = {
  household: {
    name: 'Smith Family',
    lovedOneName: 'John Smith',
    slug: 'smith-family-test',
  },
  // ... more test data
};
```

### Test Status

✅ **Ready to Run:**
- Authentication flow tests
- Sidebar navigation tests
- Contact form display tests

⏸️ **Skipped (Available to Enable):**
- Most feature workflow tests are marked with `.skip` to allow gradual test enablement
- Remove `.skip` to activate tests as you verify they work with your data:

```typescript
// Skipped - won't run
test.skip('should create a new need', async ({ page }) => {

// Active - will run
test('should create a new need', async ({ page }) => {
```

**Why some tests are skipped:**
- Allows you to enable tests incrementally
- Prevents false failures during initial setup
- You can verify each workflow before running tests

## Viewing Test Reports

After running tests, view the HTML report:

```bash
pnpm exec playwright show-report
```

This opens an interactive report showing:
- Pass/fail status for each test
- Screenshots of failures
- Videos of failed tests
- Execution traces

## Common Issues

### "page.goto: Timeout" errors

- **Solution**: Ensure dev server is running (`pnpm run dev`)
- Check `baseURL` in `playwright.config.ts` matches your server

### Authentication failures

- **Solution**: Set up auth as described above
- Verify the Auth.js stack is configured (`AUTH_SECRET`, `RESEND_API_KEY`, `DATABASE_URL` set; see `server/auth.ts`), and note the E2E suite cannot authenticate until the `/api/test/login` endpoint is implemented

### Element not found errors

- **Solution**: Update selectors to match actual UI
- Use Playwright Inspector (`--debug` flag) to find correct selectors

### Database state issues

- **Solution**: Reset database between test runs if needed
- Consider using database snapshots/transactions

## Writing New Tests

1. Create a new file in `tests/e2e/`
2. Use the `TestHelpers` class for common operations:

```typescript
import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers';

test('my new test', async ({ page }) => {
  const helpers = new TestHelpers(page);
  
  await helpers.navigateAndWaitForSidebar('/my-page');
  await helpers.fillInputByLabel('Title', 'My Test Title');
  await helpers.clickButtonByText('Submit');
  await helpers.waitForToast('Success!');
});
```

3. Add test data to `testData.ts` if needed
4. Run the test: `pnpm exec playwright test tests/e2e/my-test.spec.ts`

## CI/CD Integration

To run tests in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Install dependencies
  run: pnpm install
  
- name: Install Playwright browsers
  run: pnpm exec playwright install --with-deps

- name: Run E2E tests
  run: pnpm test:e2e
  
- name: Upload test results
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

## Best Practices

1. **Keep tests independent** - Each test should be able to run alone
2. **Use test data fixtures** - Don't hardcode data in tests
3. **Clean up after tests** - Delete created data or reset state
4. **Use meaningful assertions** - Check for specific content, not just visibility
5. **Handle async properly** - Always await Playwright commands
6. **Use retries for flaky tests** - Configure in `playwright.config.ts`
7. **Screenshot failures** - Enabled by default in config

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [Test Generator](https://playwright.dev/docs/codegen) - `pnpm exec playwright codegen`

## Questions?

For issues with the test suite, check:
1. This documentation
2. Playwright's official docs
3. Test helper functions in `helpers.ts`
4. Example tests in `tests/e2e/`
