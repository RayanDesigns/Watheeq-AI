import { test, expect, adminTest } from "../../fixtures/base.fixture";

test.describe("Login Validation", () => {
  test("should show error for empty phone on continue", async ({ loginPage }) => {
    await loginPage.goto();
    // Continue should be disabled when phone is empty
    await expect(loginPage.continueButton).toBeDisabled();
  });

  test("should handle rapid OTP resends gracefully", async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.sendOtp("500000001");
    await loginPage.expectOtpFieldVisible();

    // Click resend rapidly
    await loginPage.resendButton.click();
    // Should not crash — may show error or throttle
    await loginPage.page.waitForTimeout(1000);
    await expect(loginPage.page).toHaveURL(/\/login/);
  });
});

test.describe("Admin Login Validation", () => {
  test("should disable sign in when email is empty", async ({ adminLoginPage }) => {
    await adminLoginPage.goto();
    await adminLoginPage.passwordInput.fill("somepassword");
    await expect(adminLoginPage.signInButton).toBeDisabled();
  });

  test("should disable sign in when password is empty", async ({ adminLoginPage }) => {
    await adminLoginPage.goto();
    await adminLoginPage.emailInput.fill("admin@watheeq.ai");
    await expect(adminLoginPage.signInButton).toBeDisabled();
  });

  test("should show error for invalid credentials", async ({ adminLoginPage }) => {
    await adminLoginPage.goto();
    await adminLoginPage.login("bad@email.com", "badpassword");
    await adminLoginPage.expectErrorVisible();
  });
});

test.describe("Registration Validation", () => {
  test("should disable continue when required fields are empty", async ({ registerPage }) => {
    await registerPage.goto();
    await expect(registerPage.continueButton).toBeDisabled();
  });

  test("should disable continue for examiner with missing fields", async ({ registerPage }) => {
    await registerPage.goto();
    await registerPage.selectRole("examiner");
    await registerPage.fullNameInput.fill("Test Name");
    // Missing nationalId, email, phone
    await expect(registerPage.continueButton).toBeDisabled();
  });
});

adminTest.describe("Admin API Validation", () => {
  adminTest("should return error for malformed claim submission", async ({ request }) => {
    const res = await request.post("http://localhost:8000/api/claims", {
      data: {},
      headers: { "Content-Type": "application/json" },
    });
    // Should fail with 401 (no auth) or 422 (validation error)
    expect([401, 422]).toContain(res.status());
  });
});
