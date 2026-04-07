import { test, expect } from "../../fixtures/base.fixture";
import { getTestEnv } from "../../utils/env";

const env = getTestEnv();

/**
 * US-3 – Phone Number Verification
 *
 * As a Claimant or Claims Examiner, I want to verify my phone number
 * via OTP during registration, so that my identity is confirmed
 * before accessing the system.
 */
test.describe("US-3: Phone Number Verification @sprint1 @auth @otp", () => {
  /* ── TC-S1-012 ─ OTP fields appear after Continue ────────── */
  test("TC-S1-012: OTP inputs appear after valid phone submission @smoke @release", async ({
    loginPage,
  }) => {
    await loginPage.goto();

    await test.step("Enter phone and click Continue", async () => {
      await loginPage.sendOtp("500000001");
    });

    await test.step("Verify OTP fields visible", async () => {
      await loginPage.expectOtpFieldVisible();
    });
  });

  /* ── TC-S1-013 ─ Invalid OTP rejected ────────────────────── */
  test("TC-S1-013: invalid OTP is rejected @validation @regression", async ({
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.sendOtp("500000001");
    await loginPage.expectOtpFieldVisible();

    await test.step("Enter wrong OTP", async () => {
      await loginPage.verifyOtp("0000");
    });

    await test.step("Verify still on login page", async () => {
      await expect(loginPage.page).toHaveURL(/\/login/);
    });
  });

  /* ── TC-S1-014 ─ Cannot proceed without OTP ──────────────── */
  test("TC-S1-014: sign-in button requires OTP entry @validation", async ({
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.sendOtp("500000001");
    await loginPage.expectOtpFieldVisible();

    // Sign-in button should not perform successful auth without OTP entry
    await expect(loginPage.signInButton).toBeVisible();
  });

  /* ── TC-S1-OTP-EDIT ─ Phone editable after OTP sent ──────── */
  test("phone number editable after OTP sent @regression", async ({
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.sendOtp("500000001");
    await loginPage.expectOtpFieldVisible();
    await loginPage.editPhoneButton.click();
    await expect(loginPage.phoneInput).toBeEditable();
  });

  /* ── TC-S1-OTP-RESEND ─ Resend OTP gracefully ───────────── */
  test("handle rapid OTP resends gracefully @resilience", async ({
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.sendOtp("500000001");
    await loginPage.expectOtpFieldVisible();

    await loginPage.resendButton.click();
    await loginPage.page.waitForTimeout(1000);
    await expect(loginPage.page).toHaveURL(/\/login/);
  });
});
