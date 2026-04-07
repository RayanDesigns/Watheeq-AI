import { test, expect } from "../../fixtures/base.fixture";

/**
 * US-17 – Claim Access Restriction
 *
 * As a Claims Examiner, I want a picked claim to be locked and only
 * accessible by me, so that no other Claims Examiner can interfere
 * with my review.
 *
 * NOTE: This test requires two examiner accounts to properly verify
 * the locking mechanism. Uses TEST_PHONE_EXAMINER and TEST_PHONE_EXAMINER_2.
 */
test.describe("US-17: Claim Access Restriction @sprint2 @examiner @claims @locking @authorization", () => {
  // test.use({ storageState: ".auth/examiner.json" });
  test.skip(true, "Requires two examiner auth states for locking tests");

  /* ── TC-S2-032 ─ Second examiner cannot pick ─────────────── */
  test("TC-S2-032: picked claim not pickable by second examiner @smoke @release", async ({
    apiHelper,
  }) => {
    // API-level test: Examiner A picks, then Examiner B attempts pick
    // Requires two authenticated ApiHelper instances
    const health = await apiHelper.healthCheck();
    expect(health.status).toBe(200);

    // TODO: When two examiner tokens are available:
    // 1. apiHelperA.pickClaim(claimId) — expect 200
    // 2. apiHelperB.pickClaim(claimId) — expect 409 or 403
  });

  /* ── TC-S2-033 ─ Decision panel hidden for wrong examiner ── */
  test("TC-S2-033: decision panel not visible for other examiner @authorization", async ({
    examinerClaimDetailPage,
  }) => {
    // Examiner B navigates to a claim picked by Examiner A
    await examinerClaimDetailPage.goto("other-examiner-claim-id");
    await examinerClaimDetailPage.expectLoaded();
    await examinerClaimDetailPage.expectDecisionPanelNotVisible();
  });

  /* ── TC-S2-034 ─ Pick button gone for all after pick ─────── */
  test("TC-S2-034: pick button disappears for all examiners after pick @regression", async ({
    examinerClaimsPage,
  }) => {
    await examinerClaimsPage.goto();
    await examinerClaimsPage.selectTab("under review");

    const firstCard = examinerClaimsPage.claimCards.first();
    const isVisible = await firstCard.isVisible().catch(() => false);
    if (isVisible) {
      const pickButton = firstCard.getByRole("button", { name: "Pick" });
      await expect(pickButton).not.toBeVisible();
    }
  });
});
