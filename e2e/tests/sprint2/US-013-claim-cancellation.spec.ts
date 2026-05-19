import { test, expect } from "../../fixtures/base.fixture";
import { storageStatePath } from "../../utils/env";

/**
 * US-13 – Claim Cancellation
 *
 * As a Claimant, I want to cancel a submitted claim,
 * so that I can withdraw claims that are no longer needed.
 */
test.describe("US-13: Claim Cancellation @sprint2 @claimant @claims @cancellation", () => {
  test.use({ storageState: storageStatePath("claimant") });

  /* ── TC-S2-019 ─ Cancel a submitted claim ────────────────── */
  test("TC-S2-019: claimant cancels a submitted claim @smoke @release", async ({
    claimantClaimDetailPage,
  }) => {
    await claimantClaimDetailPage.goto("submitted-claim-id");
    await claimantClaimDetailPage.expectLoaded();
    await claimantClaimDetailPage.expectStatus("Submitted");

    await test.step("Click cancel and confirm", async () => {
      await claimantClaimDetailPage.cancelClaimButton.click();
      await expect(claimantClaimDetailPage.cancelConfirmHeading).toBeVisible();
      await claimantClaimDetailPage.yesCancelButton.click();
    });

    await test.step("Verify cancelled status", async () => {
      await claimantClaimDetailPage.expectStatus("Cancelled");
    });
  });

  /* ── TC-S2-020 ─ Cannot cancel under-review claim ────────── */
  test("TC-S2-020: cancel button hidden for under-review claims @validation", async ({
    claimantClaimDetailPage,
  }) => {
    await claimantClaimDetailPage.goto("under-review-claim-id");
    await claimantClaimDetailPage.expectLoaded();
    await claimantClaimDetailPage.expectCancelNotAvailable();
  });

  /* ── TC-S2-021 ─ Cannot cancel approved/rejected claim ──── */
  test("TC-S2-021: cancel button hidden for decided claims @validation", async ({
    claimantClaimDetailPage,
  }) => {
    await claimantClaimDetailPage.goto("approved-claim-id");
    await claimantClaimDetailPage.expectLoaded();
    await claimantClaimDetailPage.expectCancelNotAvailable();
  });

  /* ── TC-S2-022 ─ Already cancelled stays cancelled ──────── */
  test("TC-S2-022: cancelled claim stays cancelled on reload @regression", async ({
    claimantClaimDetailPage,
  }) => {
    await claimantClaimDetailPage.goto("cancelled-claim-id");
    await claimantClaimDetailPage.expectLoaded();
    await claimantClaimDetailPage.expectStatus("Cancelled");
    await claimantClaimDetailPage.expectCancelNotAvailable();
  });

  /* ── TC-S2-DIS ─ Dismiss cancel confirmation ─────────────── */
  test("dismiss cancel confirmation with Keep Claim @regression", async ({
    claimantClaimDetailPage,
  }) => {
    // Uses a dedicated submitted-state claim so TC-S2-019 cancelling
    // `submitted-claim-id` in parallel cannot race this test.
    await claimantClaimDetailPage.goto("dismiss-cancel-claim-id");
    await claimantClaimDetailPage.expectLoaded();

    await claimantClaimDetailPage.cancelClaimButton.click();
    await expect(claimantClaimDetailPage.cancelConfirmHeading).toBeVisible();
    await claimantClaimDetailPage.keepClaimButton.click();
    await expect(claimantClaimDetailPage.cancelConfirmHeading).not.toBeVisible();
  });
});
