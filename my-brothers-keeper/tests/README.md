# Test Suite Quick Start

## ✅ Authentication Configured!

The test suite uses automated authentication - no manual setup required.

## Running Tests

```bash
# Run all tests
pnpm test:e2e

# Run with UI (recommended for development)
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e:headed

# Debug specific test
pnpm test:e2e:debug tests/e2e/05-contact-form.spec.ts

# View report
pnpm test:report
```

## What Runs Automatically

1. **Auth Setup** (`auth.setup.ts`): Creates test user session
2. **Test User**: Admin user with email `playwright-test@example.com`
3. **Session Storage**: Saved to `playwright/.auth/user.json`
4. **All Tests**: Run with authenticated session

## Test Status

✅ **Active Tests (will run):**
- Authentication & sidebar navigation
- Contact form display

⏸️ **Skipped Tests (marked with `.skip`):**
- Most workflow tests (needs, events, meal train, etc.)
- Remove `.skip` to enable individual tests

## Architecture

```
tests/
├── auth.setup.ts              # Automated auth (runs first)
├── e2e/
│   ├── 01-authentication.spec.ts
│   ├── 02-needs-board.spec.ts
│   ├── 03-events-calendar.spec.ts
│   ├── 04-meal-train.spec.ts
│   ├── 05-contact-form.spec.ts
│   ├── 06-questions-admin.spec.ts
│   ├── 07-ui-ux.spec.ts
│   └── helpers.ts             # Reusable utilities
└── fixtures/
    └── testData.ts            # Test data constants
```

## How Test Auth Works

**Server Side:**
- `server/testAuth.ts` provides `/api/test/login` endpoint
- Only enabled in development (auto-disabled in production)
- Creates real database sessions

**Client Side:**
- `auth.setup.ts` calls `/api/test/login`
- Saves session cookies to storage state
- All tests reuse the saved session

## Security

✅ Test endpoints are **development-only**  
✅ Automatically disabled in production  
✅ Uses same session system as real auth  
✅ No OAuth mocking or security bypasses

## See Also

- Full documentation: `TESTING.md`
- Playwright config: `playwright.config.ts`
- Test auth endpoint: `server/testAuth.ts`
