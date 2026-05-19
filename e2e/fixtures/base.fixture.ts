import { test as base, expect } from "@playwright/test";
import { LoginPage } from "../pages/login.page";
import { AdminLoginPage } from "../pages/admin-login.page";
import { RegisterPage } from "../pages/register.page";
import { ClaimantClaimsPage } from "../pages/claimant-claims.page";
import { ClaimantNewClaimPage } from "../pages/claimant-new-claim.page";
import { ClaimantClaimDetailPage } from "../pages/claimant-claim-detail.page";
import { ExaminerClaimsPage } from "../pages/examiner-claims.page";
import { ExaminerClaimDetailPage } from "../pages/examiner-claim-detail.page";
import { AdminDashboardPage } from "../pages/admin-dashboard.page";
import { AdminRequestsPage } from "../pages/admin-requests.page";
import { AdminPoliciesPage } from "../pages/admin-policies.page";
import { ApiHelper } from "../utils/api-helpers";
import { storageStatePath } from "../utils/env";

type WatheeqFixtures = {
  loginPage: LoginPage;
  adminLoginPage: AdminLoginPage;
  registerPage: RegisterPage;
  claimantClaimsPage: ClaimantClaimsPage;
  claimantNewClaimPage: ClaimantNewClaimPage;
  claimantClaimDetailPage: ClaimantClaimDetailPage;
  examinerClaimsPage: ExaminerClaimsPage;
  examinerClaimDetailPage: ExaminerClaimDetailPage;
  adminDashboardPage: AdminDashboardPage;
  adminRequestsPage: AdminRequestsPage;
  adminPoliciesPage: AdminPoliciesPage;
  apiHelper: ApiHelper;
};

export const test = base.extend<WatheeqFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  adminLoginPage: async ({ page }, use) => {
    await use(new AdminLoginPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
  claimantClaimsPage: async ({ page }, use) => {
    await use(new ClaimantClaimsPage(page));
  },
  claimantNewClaimPage: async ({ page }, use) => {
    await use(new ClaimantNewClaimPage(page));
  },
  claimantClaimDetailPage: async ({ page }, use) => {
    await use(new ClaimantClaimDetailPage(page));
  },
  examinerClaimsPage: async ({ page }, use) => {
    await use(new ExaminerClaimsPage(page));
  },
  examinerClaimDetailPage: async ({ page }, use) => {
    await use(new ExaminerClaimDetailPage(page));
  },
  adminDashboardPage: async ({ page }, use) => {
    await use(new AdminDashboardPage(page));
  },
  adminRequestsPage: async ({ page }, use) => {
    await use(new AdminRequestsPage(page));
  },
  adminPoliciesPage: async ({ page }, use) => {
    await use(new AdminPoliciesPage(page));
  },
  apiHelper: async ({ request }, use) => {
    // Default: no token. Tests that need an authenticated helper
    // should create one with a real token.
    await use(new ApiHelper(request, ""));
  },
});

/**
 * Pre-configured test fixture that reuses the admin session captured by
 * `auth.setup.ts` via Playwright's `storageState` (with `indexedDB: true`
 * support in Playwright ≥ 1.51). The Firebase Web SDK persists the signed-in
 * user in IndexedDB, so capturing that store is required for admin-scoped
 * pages to skip the login redirect.
 *
 * Reusing a single captured session — instead of re-authenticating via the
 * UI in every test — avoids Firebase's `auth/quota-exceeded` throttling
 * that triggers when dozens of tests hammer the password-verify endpoint
 * in parallel.
 */
export const adminTest = base.extend<WatheeqFixtures>({
  storageState: storageStatePath("admin"),
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  adminLoginPage: async ({ page }, use) => {
    await use(new AdminLoginPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
  claimantClaimsPage: async ({ page }, use) => {
    await use(new ClaimantClaimsPage(page));
  },
  claimantNewClaimPage: async ({ page }, use) => {
    await use(new ClaimantNewClaimPage(page));
  },
  claimantClaimDetailPage: async ({ page }, use) => {
    await use(new ClaimantClaimDetailPage(page));
  },
  examinerClaimsPage: async ({ page }, use) => {
    await use(new ExaminerClaimsPage(page));
  },
  examinerClaimDetailPage: async ({ page }, use) => {
    await use(new ExaminerClaimDetailPage(page));
  },
  adminDashboardPage: async ({ page }, use) => {
    await use(new AdminDashboardPage(page));
  },
  adminRequestsPage: async ({ page }, use) => {
    await use(new AdminRequestsPage(page));
  },
  adminPoliciesPage: async ({ page }, use) => {
    await use(new AdminPoliciesPage(page));
  },
  apiHelper: async ({ request }, use) => {
    await use(new ApiHelper(request, ""));
  },
});

/**
 * Claimant-authenticated fixture. Reuses the captured storageState so every
 * test starts already signed in as the seeded test claimant
 * (phone_966500000001) with IndexedDB-backed Firebase session.
 */
export const claimantTest = base.extend<WatheeqFixtures>({
  storageState: storageStatePath("claimant"),
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  adminLoginPage: async ({ page }, use) => {
    await use(new AdminLoginPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
  claimantClaimsPage: async ({ page }, use) => {
    await use(new ClaimantClaimsPage(page));
  },
  claimantNewClaimPage: async ({ page }, use) => {
    await use(new ClaimantNewClaimPage(page));
  },
  claimantClaimDetailPage: async ({ page }, use) => {
    await use(new ClaimantClaimDetailPage(page));
  },
  examinerClaimsPage: async ({ page }, use) => {
    await use(new ExaminerClaimsPage(page));
  },
  examinerClaimDetailPage: async ({ page }, use) => {
    await use(new ExaminerClaimDetailPage(page));
  },
  adminDashboardPage: async ({ page }, use) => {
    await use(new AdminDashboardPage(page));
  },
  adminRequestsPage: async ({ page }, use) => {
    await use(new AdminRequestsPage(page));
  },
  adminPoliciesPage: async ({ page }, use) => {
    await use(new AdminPoliciesPage(page));
  },
  apiHelper: async ({ request }, use) => {
    await use(new ApiHelper(request, ""));
  },
});

/**
 * Examiner-authenticated fixture. Seeded examiner is phone_966500000002
 * with role=examiner and status=active (skips the pending-approval gate).
 */
export const examinerTest = base.extend<WatheeqFixtures>({
  storageState: storageStatePath("examiner"),
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  adminLoginPage: async ({ page }, use) => {
    await use(new AdminLoginPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
  claimantClaimsPage: async ({ page }, use) => {
    await use(new ClaimantClaimsPage(page));
  },
  claimantNewClaimPage: async ({ page }, use) => {
    await use(new ClaimantNewClaimPage(page));
  },
  claimantClaimDetailPage: async ({ page }, use) => {
    await use(new ClaimantClaimDetailPage(page));
  },
  examinerClaimsPage: async ({ page }, use) => {
    await use(new ExaminerClaimsPage(page));
  },
  examinerClaimDetailPage: async ({ page }, use) => {
    await use(new ExaminerClaimDetailPage(page));
  },
  adminDashboardPage: async ({ page }, use) => {
    await use(new AdminDashboardPage(page));
  },
  adminRequestsPage: async ({ page }, use) => {
    await use(new AdminRequestsPage(page));
  },
  adminPoliciesPage: async ({ page }, use) => {
    await use(new AdminPoliciesPage(page));
  },
  apiHelper: async ({ request }, use) => {
    await use(new ApiHelper(request, ""));
  },
});

export { expect };
