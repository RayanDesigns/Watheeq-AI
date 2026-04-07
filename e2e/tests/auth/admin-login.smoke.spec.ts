import { test, expect } from "../../fixtures/base.fixture";
import { getTestEnv } from "../../utils/env";

/**
 * Smoke test: verifies the most critical path — admin can log in.
 * Run with: npx playwright test --project=smoke
 */
test.describe("Smoke: Admin Login", () => {
  test("admin can log in and see dashboard", async ({ adminLoginPage }) => {
    const env = getTestEnv();
    await adminLoginPage.goto();

    await test.step("Enter credentials", async () => {
      await adminLoginPage.emailInput.fill(env.ADMIN_EMAIL);
      await adminLoginPage.passwordInput.fill(env.ADMIN_PASSWORD);
    });

    await test.step("Submit and verify redirect", async () => {
      await adminLoginPage.signInButton.click();
      await expect(adminLoginPage.page).toHaveURL(/\/dashboard\/admin/, {
        timeout: 30_000,
      });
    });

    await test.step("Verify dashboard content", async () => {
      await expect(
        adminLoginPage.page.getByRole("heading", { name: /Welcome/i }),
      ).toBeVisible();
    });
  });
});
