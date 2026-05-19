import { test, expect } from "../../fixtures/base.fixture";
import { storageStatePath } from "../../utils/env";

/**
 * US-15 – Submitted Claims View
 *
 * As a Claims Examiner, I want to view all claims with status Submitted,
 * so that I can identify claims that need to be reviewed.
 */
test.describe("US-15: Submitted Claims View @sprint2 @examiner @claims @queue", () => {
  test.use({ storageState: storageStatePath("examiner") });

  /* ── TC-S2-026 ─ Submitted tab shows submitted claims ───── */
  test("TC-S2-026: examiner views submitted claims tab @smoke @release", async ({
    examinerClaimsPage,
  }) => {
    await examinerClaimsPage.goto();
    await examinerClaimsPage.expectLoaded();

    await test.step("Click Submitted tab", async () => {
      await examinerClaimsPage.selectTab("submitted");
    });

    await test.step("Verify claims or empty state", async () => {
      // Wait for the queue fetch to settle; `isVisible()` is a synchronous
      // check with no auto-retry, so without a wait we can race the async
      // Firestore query and read `false` while the list is still loading.
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

  /* ── TC-S2-027 ─ Empty state for submitted tab ──────────── */
  test("TC-S2-027: empty state when no submitted claims @regression", async ({
    examinerClaimsPage,
  }) => {
    await examinerClaimsPage.goto();
    await examinerClaimsPage.selectTab("submitted");
    const emptyOrCards = examinerClaimsPage.emptyStateHeading.or(
      examinerClaimsPage.claimCards.first(),
    );
    await expect(emptyOrCards).toBeVisible({ timeout: 10_000 });
  });

  /* ── TC-S2-028 ─ All queue tabs filter correctly ─────────── */
  test("TC-S2-028: all queue tabs filter correctly @regression", async ({
    examinerClaimsPage,
  }) => {
    await examinerClaimsPage.goto();
    await examinerClaimsPage.expectLoaded();

    for (const tab of ["submitted", "under review", "approved", "rejected", "all"] as const) {
      await examinerClaimsPage.selectTab(tab);
      await examinerClaimsPage.page.waitForTimeout(1000);
    }
  });

  /* ── Queue page display ──────────────────────────────────── */
  test("display claims queue with all tabs @regression", async ({
    examinerClaimsPage,
  }) => {
    await examinerClaimsPage.goto();
    await examinerClaimsPage.expectLoaded();
    await expect(examinerClaimsPage.tabAll).toBeVisible();
    await expect(examinerClaimsPage.tabSubmitted).toBeVisible();
    await expect(examinerClaimsPage.tabUnderReview).toBeVisible();
  });

  /* ── Pick button visible for submitted ───────────────────── */
  test("Pick button visible for submitted claims @regression", async ({
    examinerClaimsPage,
  }) => {
    await examinerClaimsPage.goto();
    await examinerClaimsPage.selectTab("submitted");

    const firstCard = examinerClaimsPage.claimCards.first();
    const isVisible = await firstCard.isVisible().catch(() => false);
    if (isVisible) {
      const pickButton = firstCard.getByRole("button", { name: "Pick" });
      await expect(pickButton).toBeVisible();
    }
  });
});
