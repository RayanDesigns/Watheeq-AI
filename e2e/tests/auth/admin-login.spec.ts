import { test, expect } from "../../fixtures/base.fixture";
import { getTestEnv } from "../../utils/env";

test.describe("Admin Login", () => {
  const env = getTestEnv();

  test.beforeEach(async ({ adminLoginPage }) => {
    await adminLoginPage.goto();
  });

  test("should display admin login form", async ({ adminLoginPage }) => {
    await expect(adminLoginPage.heading).toBeVisible();
    await expect(adminLoginPage.emailInput).toBeVisible();
    await expect(adminLoginPage.passwordInput).toBeVisible();
    await expect(adminLoginPage.signInButton).toBeVisible();
  });

  test("should login with valid admin credentials", async ({ adminLoginPage }) => {
    await test.step("Fill credentials and submit", async () => {
      await adminLoginPage.loginAndWaitForDashboard(env.ADMIN_EMAIL, env.ADMIN_PASSWORD);
    });

    await test.step("Verify admin dashboard is displayed", async () => {
      await expect(adminLoginPage.page).toHaveURL(/\/dashboard\/admin/);
      await expect(adminLoginPage.page.getByRole("heading", { name: /Welcome/i })).toBeVisible();
    });
  });

  test("should show error for invalid email", async ({ adminLoginPage }) => {
    await adminLoginPage.login("invalid@notexist.com", "WrongPass123");
    await adminLoginPage.expectErrorVisible();
  });

  test("should show error for wrong password", async ({ adminLoginPage }) => {
    await adminLoginPage.login(env.ADMIN_EMAIL, "WrongPassword!");
    await adminLoginPage.expectErrorVisible("Invalid email or password");
  });

  test("should show error for empty fields", async ({ adminLoginPage }) => {
    await expect(adminLoginPage.signInButton).toBeDisabled();
  });

  test("should navigate to claimant/examiner login", async ({ adminLoginPage }) => {
    await adminLoginPage.claimantExaminerLink.click();
    await expect(adminLoginPage.page).toHaveURL(/\/login$/);
  });

  test("should show loading state during submission", async ({ adminLoginPage }) => {
    await adminLoginPage.emailInput.fill(env.ADMIN_EMAIL);
    await adminLoginPage.passwordInput.fill(env.ADMIN_PASSWORD);
    await adminLoginPage.signInButton.click();

    // The button text changes to "Signing in..." briefly
    await expect(
      adminLoginPage.page.getByRole("button", { name: /Signing in/i }),
    ).toBeVisible();
  });
});
