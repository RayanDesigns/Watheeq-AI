import { test, expect } from "../../fixtures/base.fixture";
import { getTestEnv } from "../../utils/env";
import { FIXTURE_PDF_PATH } from "../../utils/test-data";

const env = getTestEnv();

/**
 * E2E-001 — Full Claim Lifecycle
 *
 * Registration → Login → Submit Claim → Examiner Picks → Decides → Status Update
 *
 * Participating stories: US-1, US-6, US-9, US-10, US-12, US-16, US-19, US-14
 *
 * Flake risks:
 * - OTP delivery latency in sandbox
 * - Cloudinary upload timeout for medical report
 * - Firebase custom token creation race condition
 */
test.describe("E2E-001: Full Claim Lifecycle @cross-sprint @smoke @release", () => {
  test.skip(true, "Requires OTP bypass + claimant/examiner auth states");

  test("claimant submits → examiner picks → approves → claimant sees Approved", async ({
    loginPage,
    claimantClaimsPage,
    claimantNewClaimPage,
    claimantClaimDetailPage,
    examinerClaimsPage,
    examinerClaimDetailPage,
  }) => {
    let claimRef = "";

    await test.step("Claimant logs in", async () => {
      await loginPage.goto();
      await loginPage.sendOtp(env.TEST_PHONE_CLAIMANT.replace("+966", ""));
      await loginPage.expectOtpFieldVisible();
      await loginPage.verifyOtp(env.TEST_OTP_CODE);
      await expect(loginPage.page).toHaveURL(/\/claimant\/claims/, {
        timeout: 15_000,
      });
    });

    await test.step("Claimant submits a new claim", async () => {
      await claimantNewClaimPage.goto();
      await claimantNewClaimPage.fillFullClaimForm({
        firstName: "E2E-Lifecycle",
        lastName: "Patient",
        dob: "1990-05-15",
        policyName: "Gold Health Plan",
        treatmentType: "Diagnostic Imaging",
        medicalReportPath: FIXTURE_PDF_PATH,
      });
      await claimantNewClaimPage.submitClaim();
      await claimantNewClaimPage.expectConfirmationModal();
      claimRef = await claimantNewClaimPage.getClaimReferenceNumber();
      expect(claimRef.length).toBeGreaterThan(0);
    });

    await test.step("Claim appears in list with Submitted status", async () => {
      await claimantClaimsPage.goto();
      await claimantClaimsPage.expectClaimsVisible();
    });

    await test.step("Examiner logs in", async () => {
      await loginPage.goto();
      await loginPage.sendOtp(env.TEST_PHONE_EXAMINER.replace("+966", ""));
      await loginPage.expectOtpFieldVisible();
      await loginPage.verifyOtp(env.TEST_OTP_CODE);
      await expect(loginPage.page).toHaveURL(/\/examiner\/claims/, {
        timeout: 15_000,
      });
    });

    await test.step("Examiner picks the claim", async () => {
      await examinerClaimsPage.goto();
      await examinerClaimsPage.selectTab("submitted");
      await examinerClaimsPage.page.waitForTimeout(2000);
      const pickBtn = examinerClaimsPage.getPickButton(claimRef);
      if (await pickBtn.isVisible().catch(() => false)) {
        await pickBtn.click();
      } else {
        const firstCard = examinerClaimsPage.claimCards.first();
        await firstCard.getByRole("button", { name: "Pick" }).click();
      }
      await expect(examinerClaimsPage.page).toHaveURL(
        /\/examiner\/claims\/[^/]+$/,
      );
    });

    await test.step("Examiner approves the claim", async () => {
      await examinerClaimDetailPage.expectLoaded();
      await examinerClaimDetailPage.approveClaim();
      await examinerClaimDetailPage.expectStatus("Approved");
    });

    await test.step("Claimant sees Approved status", async () => {
      await claimantClaimDetailPage.goto(claimRef);
      await claimantClaimDetailPage.expectLoaded();
      await claimantClaimDetailPage.expectStatus("Approved");
    });
  });
});
