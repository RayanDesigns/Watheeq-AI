import { test, expect } from "../../fixtures/base.fixture";

/**
 * Examiner claim review and decision tests.
 *
 * Requires authenticated examiner session and a claim under review.
 */
test.describe("Examiner Claim Review", () => {
  // test.use({ storageState: ".auth/examiner.json" });

  test.skip(true, "Requires examiner auth state — see docs/testing/e2e.md for setup");

  test("should display claim details for review", async ({ examinerClaimDetailPage }) => {
    await examinerClaimDetailPage.goto("test-claim-id");
    await examinerClaimDetailPage.expectLoaded();

    await expect(examinerClaimDetailPage.patientName).toBeVisible();
    await expect(examinerClaimDetailPage.claimReference).toBeVisible();
    await expect(examinerClaimDetailPage.statusBadge).toBeVisible();
  });

  test("should show decision panel for own under-review claims", async ({
    examinerClaimDetailPage,
  }) => {
    await examinerClaimDetailPage.goto("under-review-claim-id");
    await examinerClaimDetailPage.expectLoaded();
    await examinerClaimDetailPage.expectDecisionPanelVisible();
  });

  test("should approve a claim", async ({ examinerClaimDetailPage }) => {
    await examinerClaimDetailPage.goto("under-review-claim-id");
    await examinerClaimDetailPage.expectLoaded();

    await test.step("Click approve and confirm", async () => {
      await examinerClaimDetailPage.approveButton.click();
      await expect(examinerClaimDetailPage.approveConfirmHeading).toBeVisible();
    });

    await test.step("Confirm approval", async () => {
      await examinerClaimDetailPage.yesApproveButton.click();
      await expect(examinerClaimDetailPage.postDecisionBanner).toBeVisible({
        timeout: 15_000,
      });
    });

    await test.step("Verify status changed", async () => {
      await examinerClaimDetailPage.expectStatus("Approved");
    });
  });

  test("should reject a claim", async ({ examinerClaimDetailPage }) => {
    await examinerClaimDetailPage.goto("under-review-claim-id");
    await examinerClaimDetailPage.expectLoaded();

    await test.step("Click reject and confirm", async () => {
      await examinerClaimDetailPage.rejectButton.click();
      await expect(examinerClaimDetailPage.rejectConfirmHeading).toBeVisible();
    });

    await test.step("Confirm rejection", async () => {
      await examinerClaimDetailPage.yesRejectButton.click();
      await expect(examinerClaimDetailPage.postDecisionBanner).toBeVisible({
        timeout: 15_000,
      });
    });

    await test.step("Verify status changed", async () => {
      await examinerClaimDetailPage.expectStatus("Rejected");
    });
  });

  test("should cancel decision confirmation dialog", async ({ examinerClaimDetailPage }) => {
    await examinerClaimDetailPage.goto("under-review-claim-id");
    await examinerClaimDetailPage.expectLoaded();

    await examinerClaimDetailPage.approveButton.click();
    await expect(examinerClaimDetailPage.approveConfirmHeading).toBeVisible();
    await examinerClaimDetailPage.cancelButton.click();
    await expect(examinerClaimDetailPage.approveConfirmHeading).not.toBeVisible();
  });

  test("should not show decision panel for others' claims", async ({
    examinerClaimDetailPage,
  }) => {
    await examinerClaimDetailPage.goto("other-examiner-claim-id");
    await examinerClaimDetailPage.expectLoaded();
    await examinerClaimDetailPage.expectDecisionPanelNotVisible();
  });

  test("should display document links", async ({ examinerClaimDetailPage }) => {
    await examinerClaimDetailPage.goto("under-review-claim-id");
    await examinerClaimDetailPage.expectLoaded();

    await expect(examinerClaimDetailPage.viewReportLink).toBeVisible();
  });

  test("should navigate back to claims queue", async ({ examinerClaimDetailPage }) => {
    await examinerClaimDetailPage.goto("under-review-claim-id");
    await examinerClaimDetailPage.expectLoaded();
    await examinerClaimDetailPage.backButton.click();
    await expect(examinerClaimDetailPage.page).toHaveURL(/\/examiner\/claims$/);
  });
});
