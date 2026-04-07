import { test, expect } from "../../fixtures/base.fixture";
import { getTestEnv } from "../../utils/env";

const env = getTestEnv();

/**
 * US-7 – Admin Login
 *
 * As an Admin, I want to log in using my email address and password,
 * so that I can securely access the admin dashboard.
 */
test.describe("US-7: Admin Login @sprint1 @auth @admin @login", () => {
  test.beforeEach(async ({ adminLoginPage }) => {
    await adminLoginPage.goto();
  });

  /* ── TC-S1-029 ─ Happy path ──────────────────────────────── */
  test("TC-S1-029: admin logs in with email and password @smoke @release", async ({
    adminLoginPage,
  }) => {
    await test.step("Fill credentials and submit", async () => {
      await adminLoginPage.loginAndWaitForDashboard(
        env.ADMIN_EMAIL,
        env.ADMIN_PASSWORD,
      );
    });

    await test.step("Verify admin dashboard displayed", async () => {
      await expect(adminLoginPage.page).toHaveURL(/\/dashboard\/admin/);
      await expect(
        adminLoginPage.page.getByRole("heading", { name: /Welcome/i }),
      ).toBeVisible();
    });
  });

  /* ── TC-S1-030 ─ Wrong password ──────────────────────────── */
  test("TC-S1-030: login fails with wrong password @validation @regression", async ({
    adminLoginPage,
  }) => {
    await adminLoginPage.login(env.ADMIN_EMAIL, "WrongPassword!");
    await adminLoginPage.expectErrorVisible("Invalid email or password");
  });

  /* ── TC-S1-031 ─ Non-existent email ──────────────────────── */
  test("TC-S1-031: login fails with non-existent email @validation @regression", async ({
    adminLoginPage,
  }) => {
    await adminLoginPage.login("invalid@notexist.com", "WrongPass123");
    await adminLoginPage.expectErrorVisible();
  });

  /* ── TC-S1-032 ─ Navigate to claimant/examiner login ─────── */
  test("TC-S1-032: navigate to claimant/examiner login @navigation", async ({
    adminLoginPage,
  }) => {
    await adminLoginPage.claimantExaminerLink.click();
    await expect(adminLoginPage.page).toHaveURL(/\/login$/);
  });

  /* ── Admin form display ──────────────────────────────────── */
  test("display admin login form @regression", async ({ adminLoginPage }) => {
    await expect(adminLoginPage.heading).toBeVisible();
    await expect(adminLoginPage.emailInput).toBeVisible();
    await expect(adminLoginPage.passwordInput).toBeVisible();
    await expect(adminLoginPage.signInButton).toBeVisible();
  });

  /* ── Empty fields disable submit ─────────────────────────── */
  test("sign-in button disabled when fields empty @validation", async ({
    adminLoginPage,
  }) => {
    await expect(adminLoginPage.signInButton).toBeDisabled();
  });

  /* ── Empty email disables submit ─────────────────────────── */
  test("sign-in disabled when email empty @validation", async ({
    adminLoginPage,
  }) => {
    await adminLoginPage.passwordInput.fill("somepassword");
    await expect(adminLoginPage.signInButton).toBeDisabled();
  });

  /* ── Empty password disables submit ──────────────────────── */
  test("sign-in disabled when password empty @validation", async ({
    adminLoginPage,
  }) => {
    await adminLoginPage.emailInput.fill("admin@watheeq.ai");
    await expect(adminLoginPage.signInButton).toBeDisabled();
  });

  /* ── Loading state during submission ─────────────────────── */
  test("show loading state during submission @regression", async ({
    adminLoginPage,
  }) => {
    await adminLoginPage.emailInput.fill(env.ADMIN_EMAIL);
    await adminLoginPage.passwordInput.fill(env.ADMIN_PASSWORD);
    await adminLoginPage.signInButton.click();
    await expect(
      adminLoginPage.page.getByRole("button", { name: /Signing in/i }),
    ).toBeVisible();
  });
});
