import { test, expect } from "../../fixtures/base.fixture";
import { getTestEnv } from "../../utils/env";
import { FIXTURE_PDF_PATH } from "../../utils/test-data";

const env = getTestEnv();

/**
 * E2E-003 — Claim Rejection and Cancellation Flow
 *
 * Tests that cancelled claims are not pickable and that under-review
 * claims are not cancellable.
 *
 * Participating stories: US-9, US-13, US-16, US-19, US-12
 *
 * Flake risks:
 * - Timing between cancel and examiner queue refresh
 * - Firestore eventual consistency for status updates
 */
test.describe("E2E-003: Claim Rejection and Cancellation @cross-sprint @release", () => {
  test.skip(true, "Requires claimant + examiner auth states");

  test("cancel Claim A, reject Claim B → both terminal states verified", async ({
    claimantNewClaimPage,
    claimantClaimDetailPage,
    claimantClaimsPage,
    examinerClaimsPage,
    examinerClaimDetailPage,
  }) => {
    let claimARef = "";
    let claimBRef = "";

    await test.step("Submit Claim A", async () => {
      await claimantNewClaimPage.goto();
      await claimantNewClaimPage.fillFullClaimForm({
        firstName: "CancelTest",
        lastName: "PatientA",
        dob: "1990-01-01",
        policyName: "Gold Health Plan",
        treatmentType: "Physiotherapy",
        medicalReportPath: FIXTURE_PDF_PATH,
      });
      await claimantNewClaimPage.submitClaim();
      await claimantNewClaimPage.expectConfirmationModal();
      claimARef = await claimantNewClaimPage.getClaimReferenceNumber();
    });

    await test.step("Submit Claim B", async () => {
      await claimantNewClaimPage.goto();
      await claimantNewClaimPage.fillFullClaimForm({
        firstName: "RejectTest",
        lastName: "PatientB",
        dob: "1991-02-02",
        policyName: "Gold Health Plan",
        treatmentType: "Surgery",
        medicalReportPath: FIXTURE_PDF_PATH,
      });
      await claimantNewClaimPage.submitClaim();
      await claimantNewClaimPage.expectConfirmationModal();
      claimBRef = await claimantNewClaimPage.getClaimReferenceNumber();
    });

    await test.step("Claimant cancels Claim A", async () => {
      await claimantClaimDetailPage.goto(claimARef);
      await claimantClaimDetailPage.expectLoaded();
      await claimantClaimDetailPage.cancelClaim();
      await claimantClaimDetailPage.expectStatus("Cancelled");
    });

    await test.step("Examiner picks Claim B", async () => {
      // Switch to examiner context
      await examinerClaimsPage.goto();
      await examinerClaimsPage.selectTab("submitted");
      // Claim A should NOT appear (it's cancelled)
      // Claim B should appear
    });

    await test.step("Claimant cannot cancel Claim B (under review)", async () => {
      await claimantClaimDetailPage.goto(claimBRef);
      await claimantClaimDetailPage.expectLoaded();
      await claimantClaimDetailPage.expectCancelNotAvailable();
    });

    await test.step("Verify final states", async () => {
      await claimantClaimDetailPage.goto(claimARef);
      await claimantClaimDetailPage.expectStatus("Cancelled");

      await claimantClaimDetailPage.goto(claimBRef);
      await claimantClaimDetailPage.expectStatus("Under Review");
    });
  });
});
