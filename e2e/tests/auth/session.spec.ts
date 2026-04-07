import { adminTest as test, expect } from "../../fixtures/base.fixture";

/**
 * Session persistence and logout tests.
 * Uses admin auth state since it's the only role with non-OTP login.
 */
test.describe("Session Management", () => {
  test("should persist admin session across page reload", async ({ page }) => {
    await page.goto("/dashboard/admin");
    await expect(page.getByRole("heading", { name: /Welcome/i })).toBeVisible({
      timeout: 15_000,
    });

    await page.reload();

    await expect(page.getByRole("heading", { name: /Welcome/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("should redirect to login after admin logout", async ({
    adminDashboardPage,
  }) => {
    await adminDashboardPage.goto();
    await adminDashboardPage.expectLoaded();

    await adminDashboardPage.signOut();

    await expect(adminDashboardPage.page).toHaveURL(/\/login/);
  });

  test("should redirect unauthenticated users from protected routes", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/dashboard/admin");
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

    await context.close();
  });

  test("should redirect /dashboard to /login", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);

    await context.close();
  });
});
