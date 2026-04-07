import { adminTest as test, expect } from "../../fixtures/base.fixture";

/**
 * US-4 – Registration Request Management
 *
 * As an Admin, I want to approve or reject Claims Examiner registration
 * requests, so that I can control who has access to the system.
 */
test.describe("US-4: Registration Request Management @sprint1 @admin @examiner-requests", () => {
  /* ── TC-S1-015 ─ View pending requests ───────────────────── */
  test("TC-S1-015: admin views pending examiner requests @smoke @release", async ({
    adminRequestsPage,
  }) => {
    await adminRequestsPage.goto();
    await adminRequestsPage.expectLoaded();

    await test.step("Click Pending tab", async () => {
      const pendingTab = adminRequestsPage.tabPending;
      if (await pendingTab.isVisible().catch(() => false)) {
        await pendingTab.click();
      }
    });

    await test.step("Verify requests or empty state", async () => {
      await adminRequestsPage.page.waitForTimeout(3000);
      const hasRequests = await adminRequestsPage.requestCards
        .first()
        .isVisible()
        .catch(() => false);
      const hasEmpty = await adminRequestsPage.emptyState
        .isVisible()
        .catch(() => false);
      expect(hasRequests || hasEmpty).toBeTruthy();
    });
  });

  /* ── TC-S1-016 ─ Approve request ─────────────────────────── */
  test("TC-S1-016: admin approves examiner registration request @smoke @release", async ({
    adminRequestsPage,
  }) => {
    await adminRequestsPage.goto();
    await adminRequestsPage.expectLoaded();

    await test.step("Navigate to Pending tab", async () => {
      if (await adminRequestsPage.tabPending.isVisible().catch(() => false)) {
        await adminRequestsPage.tabPending.click();
        await adminRequestsPage.page.waitForTimeout(2000);
      }
    });

    const hasRequests = await adminRequestsPage.requestCards
      .first()
      .isVisible()
      .catch(() => false);
    test.skip(!hasRequests, "No pending requests available to approve");

    await test.step("Click Approve on first pending request", async () => {
      const approveBtn = adminRequestsPage.requestCards
        .first()
        .getByRole("button", { name: /Approve/i });
      await approveBtn.click();
    });
  });

  /* ── TC-S1-017 ─ Reject request ──────────────────────────── */
  test("TC-S1-017: admin rejects examiner registration request @regression", async ({
    adminRequestsPage,
  }) => {
    await adminRequestsPage.goto();
    await adminRequestsPage.expectLoaded();

    if (await adminRequestsPage.tabPending.isVisible().catch(() => false)) {
      await adminRequestsPage.tabPending.click();
      await adminRequestsPage.page.waitForTimeout(2000);
    }

    const hasRequests = await adminRequestsPage.requestCards
      .first()
      .isVisible()
      .catch(() => false);
    test.skip(!hasRequests, "No pending requests available to reject");

    const rejectBtn = adminRequestsPage.requestCards
      .first()
      .getByRole("button", { name: /Reject/i });
    await rejectBtn.click();
  });

  /* ── TC-S1-018 ─ Filter by status tabs ───────────────────── */
  test("TC-S1-018: filter requests by status tabs @regression", async ({
    adminRequestsPage,
  }) => {
    await adminRequestsPage.goto();
    await adminRequestsPage.expectLoaded();

    for (const tab of [
      adminRequestsPage.tabPending,
      adminRequestsPage.tabApproved,
      adminRequestsPage.tabRejected,
    ]) {
      if (await tab.isVisible().catch(() => false)) {
        await tab.click();
        await adminRequestsPage.page.waitForTimeout(1000);
      }
    }
  });
});
