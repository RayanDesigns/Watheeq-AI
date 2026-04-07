import { test, expect } from "../../fixtures/base.fixture";

/**
 * Registration flow tests.
 *
 * Similar to phone login, full OTP-based registration requires Authentica sandbox.
 * These tests verify the form UI, validation, and role selection.
 */
test.describe("Registration", () => {
  test.beforeEach(async ({ registerPage }) => {
    await registerPage.goto();
  });

  test("should display registration form", async ({ registerPage }) => {
    await expect(registerPage.heading).toBeVisible();
    await expect(registerPage.claimantButton).toBeVisible();
    await expect(registerPage.examinerButton).toBeVisible();
    await expect(registerPage.fullNameInput).toBeVisible();
  });

  test("should default to claimant role", async ({ registerPage }) => {
    // Hospital name field is only visible for claimant role
    await expect(registerPage.hospitalNameInput).toBeVisible();
  });

  test("should toggle between claimant and examiner roles", async ({ registerPage }) => {
    await test.step("Switch to examiner", async () => {
      await registerPage.selectRole("examiner");
      await expect(registerPage.hospitalNameInput).not.toBeVisible();
    });

    await test.step("Switch back to claimant", async () => {
      await registerPage.selectRole("claimant");
      await expect(registerPage.hospitalNameInput).toBeVisible();
    });
  });

  test("should show examiner info banner when examiner selected", async ({ registerPage }) => {
    await registerPage.selectRole("examiner");
    await expect(
      registerPage.page.getByText("Your request will be reviewed by an admin"),
    ).toBeVisible();
  });

  test("should disable continue when required fields empty", async ({ registerPage }) => {
    await expect(registerPage.continueButton).toBeDisabled();
  });

  test("should enable continue when all claimant fields filled", async ({ registerPage }) => {
    await registerPage.fillClaimantDetails({
      fullName: "Test User",
      nationalId: "1234567890",
      email: "test@example.com",
      hospitalName: "Test Hospital",
      phone: "500000099",
    });
    await expect(registerPage.continueButton).toBeEnabled();
  });

  test("should enable continue when all examiner fields filled", async ({ registerPage }) => {
    await registerPage.fillExaminerDetails({
      fullName: "Test Examiner",
      nationalId: "1234567890",
      email: "examiner@example.com",
      phone: "500000098",
    });
    await expect(registerPage.continueButton).toBeEnabled();
  });

  test("should navigate to login page", async ({ registerPage }) => {
    await registerPage.signInLink.click();
    await expect(registerPage.page).toHaveURL(/\/login$/);
  });
});
