import { adminTest as test, expect } from "../../fixtures/base.fixture";

test.describe("Admin Examiner Requests", () => {
  test("should display examiner requests page", async ({ adminRequestsPage }) => {
    await adminRequestsPage.goto();
    await adminRequestsPage.expectLoaded();
  });

  test("should show requests list or empty state", async ({ adminRequestsPage }) => {
    await adminRequestsPage.goto();
    await adminRequestsPage.expectLoaded();

    // Wait for loading to complete
    await adminRequestsPage.page.waitForTimeout(3000);

    const hasRequests = await adminRequestsPage.requestCards.first().isVisible().catch(() => false);
    const hasEmpty = await adminRequestsPage.emptyState.isVisible().catch(() => false);

    expect(hasRequests || hasEmpty).toBeTruthy();
  });

  test("should filter requests by status tabs if available", async ({ adminRequestsPage }) => {
    await adminRequestsPage.goto();
    await adminRequestsPage.expectLoaded();

    const pendingTab = adminRequestsPage.tabPending;
    if (await pendingTab.isVisible().catch(() => false)) {
      await pendingTab.click();
      await adminRequestsPage.page.waitForTimeout(1000);
    }
  });

  test("should navigate back to dashboard", async ({ adminRequestsPage }) => {
    await adminRequestsPage.goto();
    await adminRequestsPage.expectLoaded();

    const backLink = adminRequestsPage.backLink;
    if (await backLink.isVisible().catch(() => false)) {
      await backLink.click();
      await expect(adminRequestsPage.page).toHaveURL(/\/dashboard\/admin/);
    }
  });
});
