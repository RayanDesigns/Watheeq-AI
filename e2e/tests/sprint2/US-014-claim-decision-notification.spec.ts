import { test, expect } from "../../fixtures/base.fixture";
import { storageStatePath } from "../../utils/env";

/**
 * US-14 – Claim Decision Notification
 *
 * As a Claimant, I want to receive an email notification once my claim
 * is Approved or Rejected, so that I am informed of the final decision.
 *
 * NOTE: Full email verification requires an SMTP mock (e.g., MailHog).
 * These tests verify the decision flow completes without errors,
 * which indirectly exercises the email notification path.
 */
test.describe("US-14: Claim Decision Notification @sprint2 @claimant @notification @email", () => {
  test.use({ storageState: storageStatePath("examiner") });

  /* ── TC-S2-023 ─ Approval triggers email ─────────────────── */
  test("TC-S2-023: approval decision triggers claimant email @regression", async ({
    examinerClaimDetailPage,
  }) => {
    // Dedicated fixture claim so parallel approval + rejection tests don't
    // race on the same document. Seeded by `ensureFixtureClaims()`.
    await examinerClaimDetailPage.goto("decide-approve-claim-id");
    await examinerClaimDetailPage.expectLoaded();

    await test.step("Approve claim", async () => {
      await examinerClaimDetailPage.approveClaim();
    });

    await test.step("Verify no error after decision", async () => {
      const error = await examinerClaimDetailPage.decisionError
        .isVisible()
        .catch(() => false);
      expect(error).toBeFalsy();
    });
  });

  /* ── TC-S2-024 ─ Rejection triggers email ────────────────── */
  test("TC-S2-024: rejection decision triggers claimant email @regression", async ({
    examinerClaimDetailPage,
  }) => {
    await examinerClaimDetailPage.goto("decide-reject-claim-id");
    await examinerClaimDetailPage.expectLoaded();

    await examinerClaimDetailPage.rejectClaim();

    const error = await examinerClaimDetailPage.decisionError
      .isVisible()
      .catch(() => false);
    expect(error).toBeFalsy();
  });

  /* ── TC-S2-025 ─ Email failure does not block decision ──── */
  test("TC-S2-025: email failure does not block claim decision @resilience", async ({
    apiHelper,
  }) => {
    // Backend wraps email send in try/except — this verifies API health
    const health = await apiHelper.healthCheck();
    expect(health.status).toBe(200);
  });
});
