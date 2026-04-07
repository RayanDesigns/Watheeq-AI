import { test, expect } from "../../fixtures/base.fixture";

/**
 * Phone/OTP login tests.
 *
 * NOTE: Full OTP verification requires a valid Authentica SMS sandbox.
 * These tests verify the UI flow up to OTP entry and handle error states.
 * For full end-to-end OTP flow, configure TEST_PHONE_CLAIMANT with a
 * sandbox number that has a known OTP (e.g., Authentica test mode).
 */
test.describe("Phone Login", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test("should display login form with phone input", async ({ loginPage }) => {
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.phoneInput).toBeVisible();
    await expect(loginPage.continueButton).toBeVisible();
  });

  test("should show OTP field after sending code", async ({ loginPage }) => {
    await test.step("Enter phone number and send OTP", async () => {
      await loginPage.sendOtp("500000001");
    });

    await test.step("Verify OTP input appears", async () => {
      await loginPage.expectOtpFieldVisible();
    });
  });

  test("should show error for invalid phone number", async ({ loginPage }) => {
    await loginPage.sendOtp("123");
    await loginPage.expectErrorVisible();
  });

  test("should allow editing phone after OTP sent", async ({ loginPage }) => {
    await loginPage.sendOtp("500000001");
    await loginPage.expectOtpFieldVisible();
    await loginPage.editPhoneButton.click();
    await expect(loginPage.phoneInput).toBeEditable();
  });

  test("should navigate to admin login", async ({ loginPage }) => {
    await loginPage.adminLoginLink.click();
    await expect(loginPage.page).toHaveURL(/\/admin-login$/);
  });

  test("should navigate to registration", async ({ loginPage }) => {
    await loginPage.createAccountLink.click();
    await expect(loginPage.page).toHaveURL(/\/register$/);
  });

  test("should disable continue button when phone is empty", async ({ loginPage }) => {
    await expect(loginPage.continueButton).toBeDisabled();
  });

  test("should handle OTP verification failure gracefully", async ({ loginPage }) => {
    await loginPage.sendOtp("500000001");
    await loginPage.expectOtpFieldVisible();
    await loginPage.verifyOtp("0000");
    // Should show error or remain on page
    await expect(loginPage.page).toHaveURL(/\/login/);
  });
});
