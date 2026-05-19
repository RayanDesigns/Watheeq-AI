import { test, expect } from "../../fixtures/base.fixture";
import { FIXTURE_PDF_PATH } from "../../utils/test-data";
import { storageStatePath } from "../../utils/env";

/**
 * US-10 – Claim Submission Confirmation
 *
 * As a Claimant, I want to receive a confirmation with a unique claim
 * reference number upon submission, so that I can track my claim.
 */
test.describe("US-10: Claim Submission Confirmation @sprint2 @claimant @claims @confirmation", () => {
  test.use({ storageState: storageStatePath("claimant") });

  /* ── TC-S2-008 ─ Confirmation shows reference ───────────── */
  test("TC-S2-008: confirmation modal shows unique claim reference @smoke @release", async ({
    claimantNewClaimPage,
  }) => {
    await claimantNewClaimPage.goto();
    await claimantNewClaimPage.fillFullClaimForm({
      firstName: "Confirm",
      lastName: "TestPatient",
      dob: "1990-05-15",
      policyName: "Gold Health Plan",
      treatmentType: "Diagnostic Imaging",
      medicalReportPath: FIXTURE_PDF_PATH,
    });
    await claimantNewClaimPage.submitClaim();

    await test.step("Verify confirmation modal", async () => {
      await claimantNewClaimPage.expectConfirmationModal();
    });

    await test.step("Verify reference number is non-empty", async () => {
      const ref = await claimantNewClaimPage.getClaimReferenceNumber();
      expect(ref.length).toBeGreaterThan(0);
    });
  });

  /* ── TC-S2-009 ─ View Claim navigates correctly ──────────── */
  test("TC-S2-009: View Claim navigates to correct detail @regression", async ({
    claimantNewClaimPage,
    claimantClaimDetailPage,
  }) => {
    await claimantNewClaimPage.goto();
    await claimantNewClaimPage.fillFullClaimForm({
      firstName: "ViewNav",
      lastName: "Patient",
      dob: "1988-12-01",
      policyName: "Gold Health Plan",
      treatmentType: "Surgery",
      medicalReportPath: FIXTURE_PDF_PATH,
    });
    await claimantNewClaimPage.submitClaim();
    await claimantNewClaimPage.expectConfirmationModal();

    const ref = await claimantNewClaimPage.getClaimReferenceNumber();

    await claimantNewClaimPage.viewClaimButton.click();
    await expect(claimantNewClaimPage.page).toHaveURL(/\/claimant\/claims\/[^/]+$/);

    await claimantClaimDetailPage.expectLoaded();
    await expect(claimantClaimDetailPage.claimReference).toContainText(ref);
  });

  /* ── TC-S2-010 ─ My Claims navigates to list ─────────────── */
  test("TC-S2-010: My Claims navigates to claims list @regression", async ({
    claimantNewClaimPage,
  }) => {
    await claimantNewClaimPage.goto();
    await claimantNewClaimPage.fillFullClaimForm({
      firstName: "ListNav",
      lastName: "Patient",
      dob: "1995-06-20",
      policyName: "Gold Health Plan",
      treatmentType: "Physiotherapy",
      medicalReportPath: FIXTURE_PDF_PATH,
    });
    await claimantNewClaimPage.submitClaim();
    await claimantNewClaimPage.expectConfirmationModal();

    await claimantNewClaimPage.myClaimsButton.click();
    await expect(claimantNewClaimPage.page).toHaveURL(/\/claimant\/claims$/);
  });

  /* ── TC-S2-011 ─ Consecutive claims get different refs ───── */
  test("TC-S2-011: two claims produce different reference numbers @regression", async ({
    claimantNewClaimPage,
  }) => {
    const refs: string[] = [];

    for (let i = 0; i < 2; i++) {
      await claimantNewClaimPage.goto();
      await claimantNewClaimPage.fillFullClaimForm({
        firstName: `Unique${i}`,
        lastName: "Patient",
        dob: "1990-01-01",
        policyName: "Gold Health Plan",
        treatmentType: "Diagnostic Imaging",
        medicalReportPath: FIXTURE_PDF_PATH,
      });
      await claimantNewClaimPage.submitClaim();
      await claimantNewClaimPage.expectConfirmationModal();
      refs.push(await claimantNewClaimPage.getClaimReferenceNumber());
    }

    expect(refs[0]).not.toBe(refs[1]);
  });
});
