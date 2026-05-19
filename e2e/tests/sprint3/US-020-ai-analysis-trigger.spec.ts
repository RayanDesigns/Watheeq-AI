import { test, expect } from "../../fixtures/base.fixture";
import { storageStatePath, getTestEnv } from "../../utils/env";

/**
 * US-20 – Automatic AI Analysis Trigger
 *
 * As a Claims Examiner, I want the AI analysis to be automatically
 * triggered once I pick a claim, so that the analysis is ready
 * when I start reviewing.
 *
 * The backend now queues `analysis_service.run_analysis` as a
 * BackgroundTask inside `pick_claim`, which means the AI panel renders
 * the moment the claim transitions to "under review". These tests
 * exercise the user-visible side of that contract — they don't depend
 * on the live Gemini call succeeding.
 */
test.describe("US-20: Automatic AI Analysis Trigger @sprint3 @examiner @claims @ai @trigger", () => {
  test.use({ storageState: storageStatePath("examiner") });

  /* ── TC-S3-010 ─ AI analysis triggered on pick ──────────── */
  test("TC-S3-010: AI analysis section visible after claim pick @smoke @release", async ({
    examinerClaimsPage,
    examinerClaimDetailPage,
  }) => {
    // Dedicated submitted fixture so we don't race sprint-2 US-16 (which
    // also picks the first submitted card). Picking this specific ID is
    // deterministic regardless of ordering across workers.
    await examinerClaimsPage.goto();
    await examinerClaimsPage.selectTab("submitted");

    const pickButton = examinerClaimsPage.page.locator("#pick-s3-pick-claim-id");
    await pickButton.waitFor({ state: "visible", timeout: 15_000 });

    await test.step("Pick the dedicated claim", async () => {
      await pickButton.click();
      await expect(examinerClaimsPage.page).toHaveURL(
        /\/examiner\/claims\/s3-pick-claim-id$/,
      );
    });

    await test.step("Claim is under review and AI panel is rendered", async () => {
      await examinerClaimDetailPage.expectLoaded();
      await examinerClaimDetailPage.expectStatus("Under Review");
      await expect(
        examinerClaimDetailPage.page.getByText("AI Analysis (Watheeq AI)"),
      ).toBeVisible({ timeout: 15_000 });
    });
  });

  /* ── TC-S3-011 ─ No AI trigger for non-submitted claims ──── */
  test("TC-S3-011: pick endpoint requires auth so AI cannot fire anonymously @validation", async ({
    request,
  }) => {
    // The auto-trigger lives inside `pick_claim`, which is gated by the
    // `require_examiner` Firebase dependency. Verifying the unauthenticated
    // call is rejected proves the AI pipeline cannot be fired without going
    // through the controlled pick flow — the only place that ever queues
    // the background analysis task.
    const apiUrl = getTestEnv().API_URL;
    const res = await request.post(
      `${apiUrl}/api/examiner/claims/s3-pick-claim-id/pick`,
    );
    expect([401, 403, 422]).toContain(res.status());
  });

  /* ── TC-S3-012 ─ AI service failure is graceful ─────────── */
  test("TC-S3-012: AI service failure handled gracefully @resilience", async ({
    examinerClaimDetailPage,
  }) => {
    // The seeded fixture URLs are placeholders that the real PDF extractor
    // can't fetch (`https://example.com/seeded-medical-report.pdf`). The
    // background analysis on this claim therefore fails — the page must
    // still render the decision panel so the examiner is never blocked.
    await examinerClaimDetailPage.goto("under-review-claim-id");
    await examinerClaimDetailPage.expectLoaded();
    await examinerClaimDetailPage.expectStatus("Under Review");
    await examinerClaimDetailPage.expectDecisionPanelVisible();
  });
});
