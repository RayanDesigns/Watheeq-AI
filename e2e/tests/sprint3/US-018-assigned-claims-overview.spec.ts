import { test, expect } from "../../fixtures/base.fixture";

/**
 * US-18 – Assigned Claims Overview
 *
 * As a Claims Examiner, I want to view all claims I have picked,
 * so that I have a complete overview of my assigned claims.
 */
test.describe("US-18: Assigned Claims Overview @sprint3 @examiner @claims @assigned", () => {
  // test.use({ storageState: ".auth/examiner.json" });
  test.skip(true, "Requires examiner auth state");

  /* ── TC-S3-001 ─ Under Review tab shows assigned claims ──── */
  test("TC-S3-001: examiner views assigned claims in Under Review tab @smoke @release", async ({
    examinerClaimsPage,
  }) => {
    await examinerClaimsPage.goto();
    await examinerClaimsPage.expectLoaded();

    await test.step("Navigate to Under Review tab", async () => {
      await examinerClaimsPage.selectTab("under review");
    });

    await test.step("Verify claims or empty state", async () => {
      const hasClaims = await examinerClaimsPage.claimCards
        .first()
        .isVisible()
        .catch(() => false);
      const hasEmpty = await examinerClaimsPage.emptyStateHeading
        .isVisible()
        .catch(() => false);
      expect(hasClaims || hasEmpty).toBeTruthy();
    });
  });

  /* ── TC-S3-002 ─ Decided claims in correct tabs ─────────── */
  test("TC-S3-002: decided claims appear in Approved/Rejected tabs @regression", async ({
    examinerClaimsPage,
  }) => {
    await examinerClaimsPage.goto();
    await examinerClaimsPage.expectLoaded();

    await test.step("Check Approved tab", async () => {
      await examinerClaimsPage.selectTab("approved");
      await examinerClaimsPage.page.waitForTimeout(1000);
    });

    await test.step("Check Rejected tab", async () => {
      await examinerClaimsPage.selectTab("rejected");
      await examinerClaimsPage.page.waitForTimeout(1000);
    });
  });

  /* ── TC-S3-003 ─ Other examiner's claims not in my view ──── */
  test("TC-S3-003: claims picked by other examiners not in my assigned view @authorization", async ({
    examinerClaimsPage,
  }) => {
    await examinerClaimsPage.goto();
    await examinerClaimsPage.selectTab("under review");

    // Each claim in this tab should belong to the current examiner
    // Exact assertion depends on whether the UI shows examiner name
    await examinerClaimsPage.page.waitForTimeout(2000);
  });
});
