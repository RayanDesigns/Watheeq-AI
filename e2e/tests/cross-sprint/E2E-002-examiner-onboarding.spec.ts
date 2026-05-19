import { test, expect, adminTest } from "../../fixtures/base.fixture";
import { getTestEnv } from "../../utils/env";

const env = getTestEnv();

/**
 * E2E-002 — Examiner Onboarding
 *
 * Registration Request → Admin Approval → Examiner Login → Claim Review
 *
 * Participating stories: US-2, US-3, US-4, US-5, US-6, US-16, US-19
 *
 * Flake risks:
 * - OTP timing for both registration and login
 * - Admin storage state expiration (cached for 30 min)
 * - Race between Firestore user creation and login attempt
 */
test.describe("E2E-002: Examiner Onboarding @cross-sprint @release", () => {
  test.skip(true, "Requires OTP bypass + admin auth state");

  test("examiner registers → admin approves → examiner logs in → reviews claim", async ({
    page,
    registerPage,
    loginPage,
    examinerClaimDetailPage,
  }) => {
    const uniquePhone = `+9665${Date.now().toString().slice(-8)}`;

    await test.step("Examiner submits registration request", async () => {
      await registerPage.goto();
      await registerPage.fillExaminerDetails({
        fullName: "E2E Onboarding Examiner",
        nationalId: `${Date.now().toString().slice(-10)}`,
        email: `e2e-onboard-${Date.now()}@example.com`,
        phone: uniquePhone,
      });
      await registerPage.continueButton.click();
      await registerPage.fillOtp(env.TEST_OTP_CODE);
      await registerPage.submitRequestButton.click();
      await expect(registerPage.successHeading).toBeVisible({ timeout: 15_000 });
    });

    // Admin approval would happen in a separate admin-authenticated context
    // TODO: Implement admin approval step when multi-context test is supported

    await test.step("Examiner logs in after approval", async () => {
      await loginPage.goto();
      await loginPage.sendOtp(uniquePhone.replace("+966", ""));
      await loginPage.expectOtpFieldVisible();
      await loginPage.verifyOtp(env.TEST_OTP_CODE);
      await expect(loginPage.page).toHaveURL(/\/examiner\/claims/, {
        timeout: 15_000,
      });
    });
  });
});
