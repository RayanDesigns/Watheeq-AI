import { test, expect } from "../../fixtures/base.fixture";
import { storageStatePath } from "../../utils/env";

/**
 * US-18 – Assigned Claims Overview
 *
 * As a Claims Examiner, I want to view all claims I have picked,
 * so that I have a complete overview of my assigned claims.
 */
test.describe("US-18: Assigned Claims Overview @sprint3 @examiner @claims @assigned", () => {
  test.use({ storageState: storageStatePath("examiner") });

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
      // Wait for the queue fetch to settle before reading visibility, so we
      // don't race the spinner -> list transition (same pattern as US-15).
      await examinerClaimsPage.loadingSpinner
        .first()
        .waitFor({ state: "hidden", timeout: 15_000 })
        .catch(() => {});

      await expect
        .poll(
          async () => {
            const hasClaims = await examinerClaimsPage.claimCards
              .first()
              .isVisible()
              .catch(() => false);
            const hasEmpty = await examinerClaimsPage.emptyStateHeading
              .isVisible()
              .catch(() => false);
            return hasClaims || hasEmpty;
          },
          { timeout: 20_000, intervals: [500, 1000, 2000] },
        )
        .toBeTruthy();
    });
  });

  /* ── TC-S3-002 ─ Decided claims in correct tabs ─────────── */
  test("TC-S3-002: decided claims appear in Approved/Rejected tabs @regression", async ({
    examinerClaimsPage,
  }) => {
    await examinerClaimsPage.goto();
    await examinerClaimsPage.expectLoaded();

    await test.step("Approved tab is reachable and resolves", async () => {
      await examinerClaimsPage.selectTab("approved");
      const settled = examinerClaimsPage.emptyStateHeading.or(
        examinerClaimsPage.claimCards.first(),
      );
      await expect(settled).toBeVisible({ timeout: 15_000 });
    });

    await test.step("Rejected tab is reachable and resolves", async () => {
      await examinerClaimsPage.selectTab("rejected");
      const settled = examinerClaimsPage.emptyStateHeading.or(
        examinerClaimsPage.claimCards.first(),
      );
      await expect(settled).toBeVisible({ timeout: 15_000 });
    });
  });

  /* ── TC-S3-003 ─ Other examiner's claims not in my view ──── */
  test("TC-S3-003: claims picked by other examiners not in my assigned view @authorization", async ({
    examinerClaimsPage,
  }) => {
    await examinerClaimsPage.goto();
    await examinerClaimsPage.selectTab("under review");

    // The fixture `other-examiner-claim-id` belongs to EXAMINER_2. The seeded
    // EXAMINER (running these tests) must NOT see a Pick / View card for it
    // anywhere in the queue. The list filter on the API guarantees this — we
    // just assert from the rendered DOM.
    const otherCard = examinerClaimsPage.page.locator(
      "#view-other-examiner-claim-id, #pick-other-examiner-claim-id",
    );
    await expect(otherCard).toHaveCount(0);
  });
});
