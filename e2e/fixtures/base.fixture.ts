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
 * Pre-configured test fixture with admin auth state already loaded.
 * Use this for admin-portal tests to skip manual login.
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

export { expect };
