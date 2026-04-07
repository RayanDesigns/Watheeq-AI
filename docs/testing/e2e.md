# Watheeq AI — End-to-End Testing Guide

## Overview

The E2E test suite uses **Playwright** with **TypeScript** to verify all user-facing workflows across the Watheeq insurance claims platform. Tests cover three personas: **Claimant**, **Claims Examiner**, and **Admin**.

## Architecture

```
e2e/
├── playwright.config.ts        # Playwright configuration
├── auth.setup.ts               # Project setup: creates `.auth/admin.json` after servers are up
├── global-teardown.ts          # Post-test cleanup
├── package.json                # E2E-specific dependencies
├── tsconfig.json               # TypeScript config for E2E
├── .env.test.example           # Environment variable template (copy to .env.test — gitignored at repo root)
│
├── fixtures/
│   └── base.fixture.ts         # Shared test fixtures with page objects
│
├── pages/                      # Page Object Model
│   ├── login.page.ts           # /login (phone + OTP)
│   ├── admin-login.page.ts     # /admin-login (email/password)
│   ├── register.page.ts        # /register (claimant/examiner)
│   ├── claimant-claims.page.ts # /claimant/claims (list)
│   ├── claimant-new-claim.page.ts # /claimant/claims/new (form)
│   ├── claimant-claim-detail.page.ts # /claimant/claims/[id]
│   ├── examiner-claims.page.ts # /examiner/claims (queue)
│   ├── examiner-claim-detail.page.ts # /examiner/claims/[id] (review)
│   ├── admin-dashboard.page.ts # /dashboard/admin
│   ├── admin-requests.page.ts  # /dashboard/admin/requests
│   └── admin-policies.page.ts  # /dashboard/admin/policies
│
├── tests/
│   ├── auth/                   # Authentication tests
│   │   ├── admin-login.spec.ts
│   │   ├── admin-login.smoke.spec.ts
│   │   ├── phone-login.spec.ts
│   │   ├── registration.spec.ts
│   │   └── session.spec.ts
│   ├── claimant/               # Claimant portal tests
│   │   ├── claims-list.spec.ts
│   │   ├── new-claim.spec.ts
│   │   └── claim-detail.spec.ts
│   ├── examiner/               # Examiner portal tests
│   │   ├── claims-queue.spec.ts
│   │   └── claim-review.spec.ts
│   ├── admin/                  # Admin portal tests
│   │   ├── dashboard.spec.ts
│   │   ├── examiner-requests.spec.ts
│   │   └── policies.spec.ts
│   ├── security/               # Cross-role authorization
│   │   └── authorization.spec.ts
│   └── negative/               # Validation and resilience
│       ├── validation.spec.ts
│       └── resilience.spec.ts
│
├── utils/
│   ├── env.ts                  # Environment variable loader
│   ├── api-helpers.ts          # API request helpers for setup/teardown
│   └── test-data.ts            # Test data generators
│
└── data/
    └── fixtures/
        ├── sample.pdf          # Valid PDF for upload tests
        └── invalid.txt         # Invalid file for negative tests
```

## Prerequisites

1. **Node.js 18+** and **npm**
2. **Python 3.11+** with backend dependencies installed
3. **Firebase project** with Auth and Firestore configured
4. **Admin account** created via `python backend/create_admin.py`

## Quick Start

### 1. Install Dependencies

```bash
cd e2e
npm install
npx playwright install --with-deps
```

### 2. Configure Environment

```bash
cp .env.test.example .env.test
# Edit .env.test with your Firebase credentials
```

### 3. Start the App (if not using webServer config)

```bash
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: Backend
cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000
```

### 4. Run Tests

```bash
# All tests (Chromium)
npm test

# Smoke tests only
npm run test:smoke

# With UI mode (interactive)
npm run test:ui

# Debug mode (step through)
npm run test:debug

# Headed browser (visible)
npm run test:headed

# Specific file
npx playwright test tests/auth/admin-login.spec.ts

# Specific project
npm run test:firefox
```

### 5. View Reports

```bash
npm run report
```

## Authentication Strategy

### Admin (fully automated)
Admin login uses email/password via Firebase Auth. The `auth.setup.ts` project creates `.auth/admin.json` by logging in through the browser (after dev servers start). That state is reused for all admin tests via `storageState`.

### Claimant & Examiner (requires OTP sandbox)
These roles use SMS OTP via Authentica, which cannot be automated without an OTP sandbox. Options:

1. **Authentica Test Mode**: If Authentica provides a sandbox/test mode with a fixed OTP (e.g., "1234"), configure the test phone numbers and expected OTP in `.env.test`.

2. **Manual Auth State Generation**:
   ```bash
   # Start the app, then:
   npx playwright codegen http://localhost:3000/login

   # Manually log in via the browser, then save state:
   # In the Playwright Inspector, copy the storage state
   ```
   Save the JSON to `.auth/claimant.json` or `.auth/examiner.json`.

3. **Firebase Admin SDK** (recommended for CI): Add a test setup script that uses Firebase Admin SDK to create custom tokens, then exchanges them for auth state via the browser. See `auth.setup.ts` for the login pattern.

Once auth state files exist, uncomment the `storageState` lines in claimant/examiner test files.

## Test Projects

| Project | Description | Usage |
|---------|-------------|-------|
| `chromium` | Main browser, full test suite | Default for CI |
| `firefox` | Cross-browser verification | Optional |
| `mobile-chrome` | Mobile responsive testing | Optional |
| `smoke` | Critical path only (~1 min) | Pre-merge, quick checks |

## Writing New Tests

### Using Page Objects

```typescript
import { test, expect } from "../../fixtures/base.fixture";

test("example test", async ({ adminDashboardPage }) => {
  await adminDashboardPage.goto();
  await adminDashboardPage.expectLoaded();
  await expect(adminDashboardPage.welcomeHeading).toBeVisible();
});
```

### Using Admin Auth State

```typescript
import { adminTest as test, expect } from "../../fixtures/base.fixture";

test("admin-only test", async ({ page }) => {
  // Already authenticated as admin
  await page.goto("/dashboard/admin");
});
```

### Using test.step for Readability

```typescript
test("complex flow", async ({ page }) => {
  await test.step("Navigate to form", async () => {
    await page.goto("/claimant/claims/new");
  });

  await test.step("Fill form data", async () => {
    // ...
  });

  await test.step("Submit and verify", async () => {
    // ...
  });
});
```

## Locator Strategy (Priority Order)

1. `getByRole()` — semantic, accessible
2. `getByLabel()` — form elements with labels
3. `getByPlaceholder()` — input fields
4. `getByText()` — visible text content
5. `getByTestId()` — explicit test IDs (add sparingly)
6. CSS selectors — last resort

## Retry and Timeout Strategy

| Setting | Local | CI | Reasoning |
|---------|-------|----|-----------|
| Test timeout | 60s | 60s | Accounts for OTP delays, API latency |
| Expect timeout | 10s | 10s | SPA hydration + API calls |
| Action timeout | 15s | 15s | File uploads, form submissions |
| Navigation timeout | 30s | 30s | Next.js cold start on first visit |
| Retries | 0 | 2 | CI may have transient issues |
| Workers | auto | 2 | CI containers have limited resources |

## Test Data Strategy

- **Unique per run**: `test-data.ts` generates unique names with random suffixes
- **No shared mutable state**: Each test creates its own data
- **Cleanup**: Firestore data is namespaced; stale data doesn't conflict
- **Fixtures**: Static files (PDFs) live in `data/fixtures/`

## Troubleshooting

### Tests fail with "Firebase not configured"
Ensure `.env.test` has valid Firebase credentials and that the backend `.env` matches.

### Admin login fails in `auth.setup`
1. Verify the admin account exists: `python backend/create_admin.py`
2. Check that `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env.test` match
3. Ensure Firestore rules are deployed

### OTP tests are skipped
This is expected. See "Authentication Strategy" above for setup options.

### Traces and screenshots
On failure, find them in `e2e/test-results/`. View traces with:
```bash
npx playwright show-trace test-results/path/to/trace.zip
```
