import { test, expect } from "../../fixtures/base.fixture";

/**
 * US-20 – Automatic AI Analysis Trigger
 *
 * As a Claims Examiner, I want the AI analysis to be automatically
 * triggered once I pick a claim, so that the analysis is ready
 * when I start reviewing.
 *
 * STATUS: ai_service.py and ai_analysis.py are TODO stubs.
 * These tests are designed for when AI integration is implemented.
 * They currently validate the pick flow and placeholder for AI state.
 */
test.describe("US-20: Automatic AI Analysis Trigger @sprint3 @examiner @claims @ai @trigger", () => {
  // test.use({ storageState: ".auth/examiner.json" });
  test.skip(true, "AI service not yet implemented — enable when ai_service.py is complete");

  /* ── TC-S3-010 ─ AI analysis triggered on pick ──────────── */
  test("TC-S3-010: AI analysis section visible after claim pick @smoke @release", async ({
    examinerClaimsPage,
    examinerClaimDetailPage,
  }) => {
    await examinerClaimsPage.goto();
    await examinerClaimsPage.selectTab("submitted");

    const firstCard = examinerClaimsPage.claimCards.first();
    const isVisible = await firstCard.isVisible().catch(() => false);
    test.skip(!isVisible, "No submitted claims available to pick");

    await test.step("Pick the claim", async () => {
      const pickButton = firstCard.getByRole("button", { name: "Pick" });
      await pickButton.click();
      await expect(examinerClaimsPage.page).toHaveURL(/\/examiner\/claims\/[^/]+$/);
    });

    await test.step("Verify claim is under review", async () => {
      await examinerClaimDetailPage.expectLoaded();
      await examinerClaimDetailPage.expectStatus("Under Review");
    });

    // TODO: Assert AI analysis section is loading or complete
    // await expect(page.locator('[data-testid="ai-analysis-section"]')).toBeVisible();
  });

  /* ── TC-S3-011 ─ No AI trigger for non-submitted claims ──── */
  test("TC-S3-011: AI not triggered for non-submitted claims @validation", async ({
    apiHelper,
  }) => {
    const health = await apiHelper.healthCheck();
    expect(health.status).toBe(200);
    // TODO: Verify via API that picking an already-picked claim doesn't re-trigger AI
  });

  /* ── TC-S3-012 ─ AI service failure is graceful ─────────── */
  test("TC-S3-012: AI service failure handled gracefully @resilience", async ({
    examinerClaimDetailPage,
  }) => {
    // When AI service is stubbed to return an error,
    // the claim should still be pickable and under review
    await examinerClaimDetailPage.goto("under-review-claim-id");
    await examinerClaimDetailPage.expectLoaded();
    await examinerClaimDetailPage.expectStatus("Under Review");
    // The page should not crash; decision panel should still work
    await examinerClaimDetailPage.expectDecisionPanelVisible();
  });
});
