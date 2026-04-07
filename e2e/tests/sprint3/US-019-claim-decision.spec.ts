import { test, expect } from "../../fixtures/base.fixture";

/**
 * US-19 – Claim Decision
 *
 * As a Claims Examiner, I want to approve or reject a claim,
 * so that the Claimant is informed of the final decision.
 */
test.describe("US-19: Claim Decision @sprint3 @examiner @claims @decision", () => {
  // test.use({ storageState: ".auth/examiner.json" });
  test.skip(true, "Requires examiner auth state and under-review claims");

  /* ── TC-S3-004 ─ Approve a claim ─────────────────────────── */
  test("TC-S3-004: examiner approves a claim @smoke @release", async ({
    examinerClaimDetailPage,
  }) => {
    await examinerClaimDetailPage.goto("under-review-claim-id");
    await examinerClaimDetailPage.expectLoaded();
    await examinerClaimDetailPage.expectDecisionPanelVisible();

    await test.step("Click Approve and confirm", async () => {
      await examinerClaimDetailPage.approveButton.click();
      await expect(examinerClaimDetailPage.approveConfirmHeading).toBeVisible();
      await examinerClaimDetailPage.yesApproveButton.click();
    });

    await test.step("Verify post-decision state", async () => {
      await expect(examinerClaimDetailPage.postDecisionBanner).toBeVisible({
        timeout: 15_000,
      });
      await examinerClaimDetailPage.expectStatus("Approved");
    });
  });

  /* ── TC-S3-005 ─ Reject a claim ──────────────────────────── */
  test("TC-S3-005: examiner rejects a claim @smoke @release", async ({
    examinerClaimDetailPage,
  }) => {
    await examinerClaimDetailPage.goto("under-review-claim-id");
    await examinerClaimDetailPage.expectLoaded();

    await test.step("Click Reject and confirm", async () => {
      await examinerClaimDetailPage.rejectButton.click();
      await expect(examinerClaimDetailPage.rejectConfirmHeading).toBeVisible();
      await examinerClaimDetailPage.yesRejectButton.click();
    });

    await test.step("Verify post-decision state", async () => {
      await expect(examinerClaimDetailPage.postDecisionBanner).toBeVisible({
        timeout: 15_000,
      });
      await examinerClaimDetailPage.expectStatus("Rejected");
    });
  });

  /* ── TC-S3-006 ─ Cancel approval confirmation ───────────── */
  test("TC-S3-006: cancel approval confirmation returns to detail @regression", async ({
    examinerClaimDetailPage,
  }) => {
    await examinerClaimDetailPage.goto("under-review-claim-id");
    await examinerClaimDetailPage.expectLoaded();

    await examinerClaimDetailPage.approveButton.click();
    await expect(examinerClaimDetailPage.approveConfirmHeading).toBeVisible();
    await examinerClaimDetailPage.cancelButton.click();
    await expect(examinerClaimDetailPage.approveConfirmHeading).not.toBeVisible();
    await examinerClaimDetailPage.expectDecisionPanelVisible();
  });

  /* ── TC-S3-007 ─ Cancel rejection confirmation ──────────── */
  test("TC-S3-007: cancel rejection confirmation returns to detail @regression", async ({
    examinerClaimDetailPage,
  }) => {
    await examinerClaimDetailPage.goto("under-review-claim-id");
    await examinerClaimDetailPage.expectLoaded();

    await examinerClaimDetailPage.rejectButton.click();
    await expect(examinerClaimDetailPage.rejectConfirmHeading).toBeVisible();
    await examinerClaimDetailPage.cancelButton.click();
    await expect(examinerClaimDetailPage.rejectConfirmHeading).not.toBeVisible();
    await examinerClaimDetailPage.expectDecisionPanelVisible();
  });

  /* ── TC-S3-008 ─ No re-decision on decided claim ────────── */
  test("TC-S3-008: decided claim hides decision panel @regression", async ({
    examinerClaimDetailPage,
  }) => {
    // Navigate to an already-decided claim
    await examinerClaimDetailPage.goto("approved-claim-id");
    await examinerClaimDetailPage.expectLoaded();
    await examinerClaimDetailPage.expectDecisionPanelNotVisible();
  });

  /* ── TC-S3-009 ─ Decision persists across reloads ────────── */
  test("TC-S3-009: decision persists across page reloads @regression", async ({
    examinerClaimDetailPage,
  }) => {
    await examinerClaimDetailPage.goto("approved-claim-id");
    await examinerClaimDetailPage.expectLoaded();
    await examinerClaimDetailPage.expectStatus("Approved");

    await examinerClaimDetailPage.page.reload();

    await examinerClaimDetailPage.expectLoaded();
    await examinerClaimDetailPage.expectStatus("Approved");
    await examinerClaimDetailPage.expectDecisionPanelNotVisible();
  });

  /* ── Claim detail display ────────────────────────────────── */
  test("claim detail shows patient info and documents @regression", async ({
    examinerClaimDetailPage,
  }) => {
    await examinerClaimDetailPage.goto("under-review-claim-id");
    await examinerClaimDetailPage.expectLoaded();

    await expect(examinerClaimDetailPage.patientName).toBeVisible();
    await expect(examinerClaimDetailPage.claimReference).toBeVisible();
    await expect(examinerClaimDetailPage.statusBadge).toBeVisible();
    await expect(examinerClaimDetailPage.viewReportLink).toBeVisible();
  });

  /* ── Back to queue navigation ────────────────────────────── */
  test("navigate back to claims queue @navigation", async ({
    examinerClaimDetailPage,
  }) => {
    await examinerClaimDetailPage.goto("under-review-claim-id");
    await examinerClaimDetailPage.expectLoaded();
    await examinerClaimDetailPage.backButton.click();
    await expect(examinerClaimDetailPage.page).toHaveURL(/\/examiner\/claims$/);
  });
});
