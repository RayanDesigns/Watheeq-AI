import { test, expect } from "../../fixtures/base.fixture";

/**
 * Claim detail page tests for the claimant view.
 *
 * Requires authenticated claimant session and at least one existing claim.
 */
test.describe("Claimant Claim Detail", () => {
  // test.use({ storageState: ".auth/claimant.json" });

  test.skip(true, "Requires claimant auth state — see docs/testing/e2e.md for setup");

  test("should display claim details", async ({ claimantClaimDetailPage }) => {
    // Use a known claim ID from test data
    await claimantClaimDetailPage.goto("test-claim-id");
    await claimantClaimDetailPage.expectLoaded();

    await expect(claimantClaimDetailPage.patientName).toBeVisible();
    await expect(claimantClaimDetailPage.claimReference).toBeVisible();
    await expect(claimantClaimDetailPage.statusBadge).toBeVisible();
  });

  test("should show cancel button for submitted claims", async ({ claimantClaimDetailPage }) => {
    await claimantClaimDetailPage.goto("submitted-claim-id");
    await claimantClaimDetailPage.expectLoaded();
    await claimantClaimDetailPage.expectStatus("Submitted");
    await expect(claimantClaimDetailPage.cancelClaimButton).toBeVisible();
  });

  test("should cancel a submitted claim", async ({ claimantClaimDetailPage }) => {
    await claimantClaimDetailPage.goto("submitted-claim-id");
    await claimantClaimDetailPage.expectLoaded();

    await test.step("Open cancel confirmation", async () => {
      await claimantClaimDetailPage.cancelClaimButton.click();
      await expect(claimantClaimDetailPage.cancelConfirmHeading).toBeVisible();
    });

    await test.step("Confirm cancellation", async () => {
      await claimantClaimDetailPage.yesCancelButton.click();
      await claimantClaimDetailPage.expectStatus("Cancelled");
    });
  });

  test("should not show cancel for non-submitted claims", async ({ claimantClaimDetailPage }) => {
    await claimantClaimDetailPage.goto("approved-claim-id");
    await claimantClaimDetailPage.expectLoaded();
    await claimantClaimDetailPage.expectCancelNotAvailable();
  });

  test("should dismiss cancel confirmation with Keep Claim", async ({ claimantClaimDetailPage }) => {
    await claimantClaimDetailPage.goto("submitted-claim-id");
    await claimantClaimDetailPage.expectLoaded();

    await claimantClaimDetailPage.cancelClaimButton.click();
    await expect(claimantClaimDetailPage.cancelConfirmHeading).toBeVisible();
    await claimantClaimDetailPage.keepClaimButton.click();
    await expect(claimantClaimDetailPage.cancelConfirmHeading).not.toBeVisible();
  });
});
