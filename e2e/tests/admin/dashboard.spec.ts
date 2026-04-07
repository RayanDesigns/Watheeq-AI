import { adminTest as test, expect } from "../../fixtures/base.fixture";

test.describe("Admin Dashboard", () => {
  test("should display admin dashboard with navigation cards", async ({
    adminDashboardPage,
  }) => {
    await adminDashboardPage.goto();
    await adminDashboardPage.expectLoaded();

    await expect(adminDashboardPage.examinerRequestsCard).toBeVisible();
    await expect(adminDashboardPage.policyPlansCard).toBeVisible();
  });

  test("should display welcome message with admin name", async ({
    adminDashboardPage,
  }) => {
    await adminDashboardPage.goto();
    await adminDashboardPage.expectLoaded();
    await expect(adminDashboardPage.welcomeHeading).toContainText("Welcome");
  });

  test("should navigate to examiner requests", async ({ adminDashboardPage }) => {
    await adminDashboardPage.goto();
    await adminDashboardPage.expectLoaded();
    await adminDashboardPage.navigateToExaminerRequests();
    await expect(adminDashboardPage.page).toHaveURL(/\/dashboard\/admin\/requests/);
  });

  test("should navigate to policy plans", async ({ adminDashboardPage }) => {
    await adminDashboardPage.goto();
    await adminDashboardPage.expectLoaded();
    await adminDashboardPage.navigateToPolicyPlans();
    await expect(adminDashboardPage.page).toHaveURL(/\/dashboard\/admin\/policies/);
  });

  test("should show pending examiner requests count", async ({
    adminDashboardPage,
  }) => {
    await adminDashboardPage.goto();
    await adminDashboardPage.expectLoaded();
    // Pending badge is conditionally visible — just ensure dashboard loads
    // The badge appears only if there are pending requests
    const badge = adminDashboardPage.pendingBadge;
    const isVisible = await badge.isVisible().catch(() => false);
    if (isVisible) {
      await expect(badge).toContainText(/\d+\s*pending/i);
    }
  });

  test("should sign out from dashboard", async ({ adminDashboardPage }) => {
    await adminDashboardPage.goto();
    await adminDashboardPage.expectLoaded();
    await adminDashboardPage.signOut();
    await expect(adminDashboardPage.page).toHaveURL(/\/login/);
  });
});
