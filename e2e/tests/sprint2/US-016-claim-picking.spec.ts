import { test, expect } from "../../fixtures/base.fixture";

/**
 * US-16 – Claim Picking
 *
 * As a Claims Examiner, I want to pick a claim to review,
 * so that I can start processing it.
 */
test.describe("US-16: Claim Picking @sprint2 @examiner @claims @picking", () => {
  // test.use({ storageState: ".auth/examiner.json" });
  test.skip(true, "Requires examiner auth state");

  /* ── TC-S2-029 ─ Pick a submitted claim ──────────────────── */
  test("TC-S2-029: examiner picks a submitted claim @smoke @release", async ({
    examinerClaimsPage,
  }) => {
    await examinerClaimsPage.goto();
    await examinerClaimsPage.selectTab("submitted");

    const firstCard = examinerClaimsPage.claimCards.first();
    const isVisible = await firstCard.isVisible().catch(() => false);
    test.skip(!isVisible, "No submitted claims available to pick");

    await test.step("Click Pick on first submitted claim", async () => {
      const pickButton = firstCard.getByRole("button", { name: "Pick" });
      await pickButton.click();
    });

    await test.step("Verify navigation to claim detail", async () => {
      await expect(examinerClaimsPage.page).toHaveURL(
        /\/examiner\/claims\/[^/]+$/,
      );
    });
  });

  /* ── TC-S2-030 ─ After pick, view claim detail ──────────── */
  test("TC-S2-030: picked claim shows decision panel @regression", async ({
    examinerClaimDetailPage,
  }) => {
    await examinerClaimDetailPage.goto("under-review-claim-id");
    await examinerClaimDetailPage.expectLoaded();
    await examinerClaimDetailPage.expectStatus("Under Review");
    await examinerClaimDetailPage.expectDecisionPanelVisible();
  });

  /* ── TC-S2-031 ─ Cannot pick non-submitted claim ─────────── */
  test("TC-S2-031: cannot pick claim not in submitted status @validation", async ({
    examinerClaimsPage,
  }) => {
    await examinerClaimsPage.goto();
    await examinerClaimsPage.selectTab("approved");

    const firstCard = examinerClaimsPage.claimCards.first();
    const isVisible = await firstCard.isVisible().catch(() => false);
    if (isVisible) {
      const pickButton = firstCard.getByRole("button", { name: "Pick" });
      await expect(pickButton).not.toBeVisible();
    }
  });
});
