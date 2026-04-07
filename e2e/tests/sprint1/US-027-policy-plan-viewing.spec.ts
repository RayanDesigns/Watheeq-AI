import { adminTest as test, expect } from "../../fixtures/base.fixture";
import { test as baseTest } from "../../fixtures/base.fixture";

/**
 * US-27 – Policy Plan Viewing
 *
 * As a user, I want to view all available policy plans,
 * so that I can reference them when needed.
 */
test.describe("US-27: Policy Plan Viewing (Admin) @sprint1 @admin @policies @viewing", () => {
  /* ── TC-S1-043a ─ Admin views policies ───────────────────── */
  test("TC-S1-043a: admin views policy plans page @smoke @release", async ({
    adminDashboardPage,
    adminPoliciesPage,
  }) => {
    await test.step("Navigate from dashboard to policies", async () => {
      await adminDashboardPage.goto();
      await adminDashboardPage.expectLoaded();
      await adminDashboardPage.navigateToPolicyPlans();
    });

    await test.step("Verify policies page loaded", async () => {
      await adminPoliciesPage.expectLoaded();
    });
  });

  /* ── Admin dashboard navigation ──────────────────────────── */
  test("admin dashboard shows navigation cards @regression", async ({
    adminDashboardPage,
  }) => {
    await adminDashboardPage.goto();
    await adminDashboardPage.expectLoaded();
    await expect(adminDashboardPage.examinerRequestsCard).toBeVisible();
    await expect(adminDashboardPage.policyPlansCard).toBeVisible();
  });

  /* ── Admin welcome message ───────────────────────────────── */
  test("admin dashboard shows welcome message @regression", async ({
    adminDashboardPage,
  }) => {
    await adminDashboardPage.goto();
    await adminDashboardPage.expectLoaded();
    await expect(adminDashboardPage.welcomeHeading).toContainText("Welcome");
  });

  /* ── Navigate to examiner requests ───────────────────────── */
  test("navigate to examiner requests from dashboard @regression", async ({
    adminDashboardPage,
  }) => {
    await adminDashboardPage.goto();
    await adminDashboardPage.expectLoaded();
    await adminDashboardPage.navigateToExaminerRequests();
    await expect(adminDashboardPage.page).toHaveURL(/\/dashboard\/admin\/requests/);
  });

  /* ── Pending badge conditionally visible ─────────────────── */
  test("pending examiner requests badge conditional @regression", async ({
    adminDashboardPage,
  }) => {
    await adminDashboardPage.goto();
    await adminDashboardPage.expectLoaded();
    const badge = adminDashboardPage.pendingBadge;
    const isVisible = await badge.isVisible().catch(() => false);
    if (isVisible) {
      await expect(badge).toContainText(/\d+\s*pending/i);
    }
  });
});

/**
 * US-27: Policy Plan Viewing (API-level)
 *
 * Verifies the public policy endpoint works regardless of auth.
 */
baseTest.describe("US-27: Policy Plan Viewing (API) @sprint1 @policies @api", () => {
  /* ── TC-S1-045 ─ API returns policy list ─────────────────── */
  test("TC-S1-045: public policy list API returns successfully @regression", async ({
    request,
  }) => {
    const res = await request.get("http://localhost:8000/api/policies");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  /* ── API auth guard checks ───────────────────────────────── */
  test("API returns 401 for claims without token @authorization", async ({
    request,
  }) => {
    const res = await request.get("http://localhost:8000/api/claims");
    expect(res.status()).toBe(401);
  });

  test("API returns 401 for admin endpoints without token @authorization", async ({
    request,
  }) => {
    const res = await request.get(
      "http://localhost:8000/api/admin/examiner-requests",
    );
    expect(res.status()).toBe(401);
  });

  test("API returns 401 for examiner endpoints without token @authorization", async ({
    request,
  }) => {
    const res = await request.get("http://localhost:8000/api/examiner/claims");
    expect(res.status()).toBe(401);
  });

  /* ── Health check ────────────────────────────────────────── */
  test("backend health check passes @smoke @release", async ({ request }) => {
    const res = await request.get("http://localhost:8000/");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.service).toBe("Watheeq AI API");
  });

  /* ── Unknown routes return 404 ───────────────────────────── */
  test("unknown API routes return 404/405 @resilience", async ({ request }) => {
    const res = await request.get("http://localhost:8000/api/nonexistent");
    expect([404, 405]).toContain(res.status());
  });

  /* ── Root redirects to login ─────────────────────────────── */
  test("root / redirects to /login @regression", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});
