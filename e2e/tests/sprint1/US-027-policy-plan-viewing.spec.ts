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
 * Verifies that the policy endpoint is reachable and that protected
 * endpoints reject unauthenticated callers.
 *
 * Notes on status codes:
 *   - FastAPI's `Authorization` header dependency validates the header at the
 *     schema layer. When the header is missing, FastAPI returns HTTP 422
 *     (validation error) BEFORE our custom 401 handler runs. When the header
 *     is present but invalid, we return 401. Both responses correctly signal
 *     "you are not authenticated", so the assertions below accept either.
 *   - `/api/policies` is an authenticated endpoint; the original assertion
 *     that it was a public list was incorrect.
 */
baseTest.describe("US-27: Policy Plan Viewing (API) @sprint1 @policies @api", () => {
  // Raw `request` calls use the global actionTimeout (15s). When the backend
  // is under parallel load (many tests exercising the same API — especially
  // TC-S1-037's Firebase Storage uploads, which can queue requests on a
  // single uvicorn worker), lightweight auth-guard assertions can flake even
  // though the server itself is healthy. Give the per-call timeout plenty of
  // headroom so these trivial checks stay stable.
  const REQ_TIMEOUT = 60_000;

  /* ── TC-S1-045 ─ API rejects unauthenticated policy list ──── */
  test("TC-S1-045: policy list API requires authentication @regression", async ({
    request,
  }) => {
    const res = await request.get("http://localhost:8000/api/policies", {
      timeout: REQ_TIMEOUT,
    });
    expect([401, 422]).toContain(res.status());
  });

  /* ── API auth guard checks ───────────────────────────────── */
  test("API rejects unauthenticated claims requests @authorization", async ({
    request,
  }) => {
    const res = await request.get("http://localhost:8000/api/claims", {
      timeout: REQ_TIMEOUT,
    });
    expect([401, 422]).toContain(res.status());
  });

  test("API rejects unauthenticated admin requests @authorization", async ({
    request,
  }) => {
    const res = await request.get(
      "http://localhost:8000/api/admin/examiner-requests",
      { timeout: REQ_TIMEOUT },
    );
    expect([401, 422]).toContain(res.status());
  });

  test("API rejects unauthenticated examiner requests @authorization", async ({
    request,
  }) => {
    const res = await request.get("http://localhost:8000/api/examiner/claims", {
      timeout: REQ_TIMEOUT,
    });
    expect([401, 422]).toContain(res.status());
  });

  /* ── Health check ────────────────────────────────────────── */
  test("backend health check passes @smoke @release", async ({ request }) => {
    const res = await request.get("http://localhost:8000/", {
      timeout: REQ_TIMEOUT,
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.service).toBe("Watheeq AI API");
  });

  /* ── Unknown routes return 404 ───────────────────────────── */
  test("unknown API routes return 404/405 @resilience", async ({ request }) => {
    const res = await request.get("http://localhost:8000/api/nonexistent", {
      timeout: REQ_TIMEOUT,
    });
    expect([404, 405]).toContain(res.status());
  });

  /* ── Root redirects to login ─────────────────────────────── */
  test("root / redirects to /login @regression", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});
