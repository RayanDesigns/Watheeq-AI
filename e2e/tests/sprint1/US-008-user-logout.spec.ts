import { adminTest as test, expect } from "../../fixtures/base.fixture";

/**
 * US-8 – User Logout
 *
 * As a user, I want to log out of my account,
 * so that my session is ended securely.
 */
test.describe("US-8: User Logout @sprint1 @auth @logout", () => {
  /* ── TC-S1-033 ─ Admin logout ────────────────────────────── */
  test("TC-S1-033: admin logs out successfully @smoke @release @admin", async ({
    adminDashboardPage,
  }) => {
    await adminDashboardPage.goto();
    await adminDashboardPage.expectLoaded();

    await test.step("Click Sign Out", async () => {
      await adminDashboardPage.signOut();
    });

    await test.step("Verify redirect to login", async () => {
      await expect(adminDashboardPage.page).toHaveURL(/\/login/);
    });
  });

  /* ── TC-S1-034 ─ Session persists across reload ──────────── */
  test("session persists across page reload @regression @admin", async ({
    page,
  }) => {
    await page.goto("/dashboard/admin");
    await expect(
      page.getByRole("heading", { name: /Welcome/i }),
    ).toBeVisible({ timeout: 15_000 });

    await page.reload();

    await expect(
      page.getByRole("heading", { name: /Welcome/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  /* ── TC-S1-035 ─ Redirect unauthenticated ────────────────── */
  test("redirect unauthenticated users from protected routes @regression", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/dashboard/admin");
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

    await context.close();
  });

  /* ── TC-S1-036 ─ /dashboard redirects to /login ──────────── */
  test("bare /dashboard redirects to /login @regression", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);

    await context.close();
  });

  /* ── TC-S1-AUTH-GUARD ─ Protected routes redirect ────────── */
  test("all protected routes redirect when unauthenticated @authorization @regression", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const protectedPaths = [
      "/claimant/claims",
      "/examiner/claims",
      "/dashboard/admin",
      "/dashboard/admin/requests",
      "/dashboard/admin/policies",
      "/claimant/claims/new",
    ];

    for (const path of protectedPaths) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    }

    await context.close();
  });

  /* ── TC-S1-CROSS-ROLE ─ Admin cannot access claimant portal ─ */
  test("admin redirected away from claimant portal @authorization @regression", async ({
    page,
  }) => {
    await page.goto("/claimant/claims");
    await page.waitForTimeout(5000);
    expect(page.url()).not.toContain("/claimant/claims");
  });

  /* ── TC-S1-CROSS-ROLE ─ Admin cannot access examiner portal ─ */
  test("admin redirected away from examiner portal @authorization @regression", async ({
    page,
  }) => {
    await page.goto("/examiner/claims");
    await page.waitForTimeout(5000);
    expect(page.url()).not.toContain("/examiner/claims");
  });
});
