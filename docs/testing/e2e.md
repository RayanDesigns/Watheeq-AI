# Watheeq AI — End-to-End Testing Guide

## Overview

The E2E test suite uses **Playwright** with **TypeScript** to verify all user-facing workflows across the Watheeq insurance claims platform. Tests are organized by **sprint** to mirror the Project Release Road-map, covering three personas: **Claimant**, **Claims Examiner**, and **Admin**.

## Architecture

```
e2e/
├── playwright.config.ts        # Playwright configuration (sprint + browser + tag projects)
├── auth.setup.ts               # Project setup: creates `.auth/admin.json` after servers are up
├── global-teardown.ts          # Post-test cleanup
├── package.json                # E2E-specific dependencies and sprint scripts
├── tsconfig.json               # TypeScript config for E2E
├── .env.test.example           # Environment variable template (copy to .env.test — gitignored)
│
├── fixtures/
│   └── base.fixture.ts         # Shared test fixtures with page objects and adminTest
│
├── pages/                      # Page Object Model (shared across all sprints)
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
│   ├── sprint1/                # Auth, registration, policies (US-1..8, US-25..27)
│   │   ├── US-001-claimant-registration.spec.ts
│   │   ├── US-002-examiner-registration.spec.ts
│   │   ├── US-003-otp-verification.spec.ts
│   │   ├── US-004-registration-request-mgmt.spec.ts
│   │   ├── US-005-registration-notification.spec.ts
│   │   ├── US-006-claimant-examiner-login.spec.ts
│   │   ├── US-007-admin-login.spec.ts
│   │   ├── US-008-user-logout.spec.ts
│   │   ├── US-025-policy-plan-addition.spec.ts
│   │   ├── US-026-policy-plan-deletion.spec.ts
│   │   └── US-027-policy-plan-viewing.spec.ts
│   │
│   ├── sprint2/                # Claim lifecycle, examiner queue (US-9..17)
│   │   ├── US-009-claim-submission.spec.ts
│   │   ├── US-010-claim-confirmation.spec.ts
│   │   ├── US-011-claim-history.spec.ts
│   │   ├── US-012-claim-status-tracking.spec.ts
│   │   ├── US-013-claim-cancellation.spec.ts
│   │   ├── US-014-claim-decision-notification.spec.ts
│   │   ├── US-015-submitted-claims-view.spec.ts
│   │   ├── US-016-claim-picking.spec.ts
│   │   └── US-017-claim-access-restriction.spec.ts
│   │
│   ├── sprint3/                # Examiner decisions, AI analysis (US-18..23)
│   │   ├── US-018-assigned-claims-overview.spec.ts
│   │   ├── US-019-claim-decision.spec.ts
│   │   ├── US-020-ai-analysis-trigger.spec.ts
│   │   ├── US-021-ai-claim-analysis.spec.ts
│   │   ├── US-022-ai-coverage-decision-view.spec.ts
│   │   └── US-023-ai-draft-response.spec.ts
│   │
│   ├── sprint4/                # Draft editing, admin analytics (US-24, US-28..30)
│   │   ├── US-024-draft-response-editing.spec.ts
│   │   ├── US-028-claims-statistics.spec.ts
│   │   ├── US-029-examiner-performance.spec.ts
│   │   └── US-030-system-activity-log.spec.ts
│   │
│   └── cross-sprint/           # Business-flow E2E scenarios
│       ├── E2E-001-full-claim-lifecycle.spec.ts
│       ├── E2E-002-examiner-onboarding.spec.ts
│       ├── E2E-003-claim-rejection-cancellation.spec.ts
│       ├── E2E-004-policy-lifecycle.spec.ts
│       └── E2E-005-ai-assisted-decision.spec.ts
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

## File Naming Convention

| Pattern | Purpose |
|---------|---------|
| `US-{NNN}-{kebab-title}.spec.ts` | Sprint test file mapped to a user story |
| `E2E-{NNN}-{kebab-title}.spec.ts` | Cross-sprint business-flow scenario |
| `*.page.ts` | Page Object Model file |
| `*.fixture.ts` | Playwright custom fixture |

Each spec file's `test.describe` block includes `@` tags in its name for filtering:

```typescript
test.describe("US-7: Admin Login @sprint1 @auth @admin @login", () => {
  test("TC-S1-029: admin logs in @smoke @release", async ({ ... }) => {
    // ...
  });
});
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
# ── Sprint-scoped ─────────────────────────────────────────
npm run test:sprint1          # All Sprint 1 tests
npm run test:sprint2          # All Sprint 2 tests
npm run test:sprint3          # All Sprint 3 tests
npm run test:sprint4          # All Sprint 4 tests
npm run test:cross-sprint     # Cross-sprint E2E scenarios

# ── Cumulative regression (Sprint 1 + 2 after Sprint 2 delivery) ──
npx playwright test --project=sprint1 --project=sprint2

# ── Tag-filtered ──────────────────────────────────────────
npm run test:smoke            # @smoke tests across all sprints
npm run test:release          # @release gate tests
npx playwright test --grep @validation     # All validation tests
npx playwright test --grep @admin          # All admin persona tests
npx playwright test --grep "(?=.*@sprint2)(?=.*@examiner)"  # Combine tags

# ── Browser matrix ────────────────────────────────────────
npm run test:chromium         # Full suite on Chromium
npm run test:firefox          # Full suite on Firefox
npm run test:mobile           # Mobile Chrome (Pixel 5)

# ── Development ───────────────────────────────────────────
npm run test:ui               # Interactive UI mode
npm run test:debug            # Step-through debugger
npm run test:headed           # Visible browser

# ── Specific file ─────────────────────────────────────────
npx playwright test tests/sprint1/US-007-admin-login.spec.ts
```

### 5. View Reports

```bash
npm run report
```

## Test Projects

| Project | Scope | Usage |
|---------|-------|-------|
| `sprint1` | `tests/sprint1/` only | Run after Sprint 1 delivery |
| `sprint2` | `tests/sprint2/` only | Run after Sprint 2 delivery |
| `sprint3` | `tests/sprint3/` only | Run after Sprint 3 delivery |
| `sprint4` | `tests/sprint4/` only | Run after Sprint 4 delivery |
| `cross-sprint` | `tests/cross-sprint/` only | Business-flow E2E scenarios |
| `smoke` | Tests tagged `@smoke` | Pre-merge quick checks (~1 min) |
| `release` | Tests tagged `@release` | Release gate (must pass to deploy) |
| `chromium` | All tests on Chrome | Default for CI regression |
| `firefox` | All tests on Firefox | Cross-browser verification |
| `mobile-chrome` | All tests on Pixel 5 | Mobile responsive testing |

## Tagging Strategy

Tests use `@` tags in `test.describe` and `test` names for flexible filtering.

### Tag Taxonomy

| Level | Tags | Purpose |
|-------|------|---------|
| **Sprint** | `@sprint1` `@sprint2` `@sprint3` `@sprint4` `@cross-sprint` | Run by sprint |
| **Tier** | `@smoke` `@regression` `@release` | Run by test importance |
| **Persona** | `@admin` `@examiner` `@claimant` | Run by user role |
| **Feature** | `@auth` `@claims` `@policies` `@ai` `@notification` `@dashboard` | Run by feature area |
| **Sub-feature** | `@registration` `@login` `@logout` `@submission` `@cancellation` `@picking` `@decision` `@draft` `@statistics` `@activity-log` | Fine-grained filtering |
| **Type** | `@validation` `@authorization` `@resilience` `@navigation` `@empty-state` | Run by test characteristic |

### Sprint Dependencies

```
Sprint 1 (Auth + Policies) ← foundation for all others
    │
    ├── Sprint 2 (Claims + Examiner Queue)
    │       │
    │       └── Sprint 3 (Decisions + AI Analysis)
    │               │
    │               └── Sprint 4 (Draft Editing + Analytics)
    │
    └── Cross-sprint scenarios span all four sprints
```

When running regression after Sprint N delivery, include all prior sprints:

```bash
# After Sprint 2 merges — run Sprint 1 + 2 together
npx playwright test --project=sprint1 --project=sprint2
```

## Authentication Strategy

### Admin (fully automated)
Admin login uses email/password via Firebase Auth. The `auth.setup.ts` project creates `.auth/admin.json` by logging in through the browser (after dev servers start). That state is reused for all admin tests via `storageState` in the `adminTest` fixture.

### Claimant & Examiner (requires OTP bypass)
These roles use SMS OTP via Authentica, which cannot be automated without an OTP bypass. Options:

1. **OTP Bypass (recommended for CI)**: Set `TEST_OTP_CODE=1234` in `.env.test` and configure the backend to accept the fixed code when `WATHEEQ_ENV=test`. All Sprint 1 login/registration tests use `env.TEST_OTP_CODE` for OTP entry.

2. **Authentica Sandbox**: If Authentica provides a sandbox with fixed OTPs, configure the test phone numbers and expected OTP in `.env.test`.

3. **Manual Auth State Generation**:
   ```bash
   npx playwright codegen http://localhost:3000/login
   # Log in via the browser, then save storage state to .auth/claimant.json
   ```

4. **Firebase Admin SDK** (recommended for CI): Add a test setup script that uses Firebase Admin SDK to create custom tokens, then exchanges them for auth state via the browser. See `auth.setup.ts` for the login pattern.

Once auth state files exist, uncomment the `storageState` and `test.skip` lines in claimant/examiner test files (Sprint 2+).

### Test Accounts

| Role | Phone / Email | Source |
|------|---------------|--------|
| Admin | `admin@watheeq.ai` / `Admin@1234` | `backend/create_admin.py` |
| Claimant | `+966500000001` | `.env.test` `TEST_PHONE_CLAIMANT` |
| Examiner | `+966500000002` | `.env.test` `TEST_PHONE_EXAMINER` |
| Examiner 2 | `+966500000003` | `.env.test` `TEST_PHONE_EXAMINER_2` (for US-17 locking tests) |

## Writing New Tests

### Using Page Objects

```typescript
import { test, expect } from "../../fixtures/base.fixture";

test.describe("US-X: Feature Name @sprintN @persona @feature", () => {
  test("TC-SN-XXX: scenario name @smoke @release", async ({ adminDashboardPage }) => {
    await adminDashboardPage.goto();
    await adminDashboardPage.expectLoaded();
    await expect(adminDashboardPage.welcomeHeading).toBeVisible();
  });
});
```

### Using Admin Auth State

```typescript
import { adminTest as test, expect } from "../../fixtures/base.fixture";

test.describe("US-X: Admin Feature @sprintN @admin", () => {
  test("admin-only test @release", async ({ page }) => {
    // Already authenticated as admin
    await page.goto("/dashboard/admin");
  });
});
```

### Using test.step for Readability

```typescript
test("TC-S2-001: submit claim with all fields @smoke", async ({ claimantNewClaimPage }) => {
  await test.step("Fill patient information", async () => {
    await claimantNewClaimPage.fillPatientInfo({ firstName: "Khalid", lastName: "Al-Mansouri", dob: "1990-05-15" });
  });

  await test.step("Upload medical report", async () => {
    await claimantNewClaimPage.uploadMedicalReport("data/fixtures/sample.pdf");
  });

  await test.step("Submit and verify", async () => {
    await claimantNewClaimPage.submitClaim();
    await claimantNewClaimPage.expectConfirmationModal();
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

## Sprint Readiness

| Sprint | Status | Blockers |
|--------|--------|----------|
| Sprint 1 | **Ready** — admin tests fully automated; OTP tests need bypass | OTP bypass for claimant/examiner login and registration |
| Sprint 2 | **Designed** — tests written but `test.skip`'d | Claimant/examiner auth state; ≥1 policy plan seeded |
| Sprint 3 | **Designed** — AI tests are placeholder scaffolds | `ai_service.py` implementation; AI UI components |
| Sprint 4 | **Designed** — placeholder assertions | Stats/metrics/audit-log endpoints and UI |

## Troubleshooting

### Tests fail with "Firebase not configured"
Ensure `.env.test` has valid Firebase credentials and that the backend `.env` matches.

### Admin login fails in `auth.setup`
1. Verify the admin account exists: `python backend/create_admin.py`
2. Check that `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env.test` match
3. Ensure Firestore rules are deployed

### OTP tests are skipped
This is expected until an OTP bypass is configured. See "Authentication Strategy" above.

### Sprint 2–4 tests are skipped
These tests have `test.skip(true, ...)` because they require claimant/examiner auth state. Enable them after configuring OTP bypass and creating storage states.

### Traces and screenshots
On failure, find them in `e2e/test-results/`. View traces with:
```bash
npx playwright show-trace test-results/path/to/trace.zip
```
