import { test, expect, adminTest } from "../../fixtures/base.fixture";

test.describe("Cross-role Authorization — Unauthenticated", () => {
  test("should redirect /claimant/claims to login when unauthenticated", async ({ page }) => {
    await page.goto("/claimant/claims");
    // The app uses client-side auth guards — either redirects or shows loading then redirect
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test("should redirect /examiner/claims to login when unauthenticated", async ({ page }) => {
    await page.goto("/examiner/claims");
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test("should redirect /dashboard/admin to login when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard/admin");
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test("should redirect /dashboard/admin/requests to login when unauthenticated", async ({
    page,
  }) => {
    await page.goto("/dashboard/admin/requests");
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test("should redirect /dashboard/admin/policies to login when unauthenticated", async ({
    page,
  }) => {
    await page.goto("/dashboard/admin/policies");
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test("should redirect /claimant/claims/new to login when unauthenticated", async ({
    page,
  }) => {
    await page.goto("/claimant/claims/new");
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });
});

adminTest.describe("Cross-role Authorization — Admin accessing other portals", () => {
  adminTest(
    "admin should be redirected away from claimant portal",
    async ({ page }) => {
      await page.goto("/claimant/claims");
      // Admin role should be redirected to their own dashboard
      await page.waitForTimeout(5000);
      const url = page.url();
      expect(url).not.toContain("/claimant/claims");
    },
  );

  adminTest(
    "admin should be redirected away from examiner portal",
    async ({ page }) => {
      await page.goto("/examiner/claims");
      await page.waitForTimeout(5000);
      const url = page.url();
      expect(url).not.toContain("/examiner/claims");
    },
  );
});

test.describe("API Authorization — Direct endpoint access", () => {
  test("should return 401 for claims API without token", async ({ request }) => {
    const res = await request.get("http://localhost:8000/api/claims");
    expect(res.status()).toBe(401);
  });

  test("should return 401 for admin API without token", async ({ request }) => {
    const res = await request.get("http://localhost:8000/api/admin/examiner-requests");
    expect(res.status()).toBe(401);
  });

  test("should return 401 for examiner API without token", async ({ request }) => {
    const res = await request.get("http://localhost:8000/api/examiner/claims");
    expect(res.status()).toBe(401);
  });

  test("should return 401 for auth/me without token", async ({ request }) => {
    const res = await request.get("http://localhost:8000/api/auth/me");
    // FastAPI returns 422 for missing header, or 401 depending on implementation
    expect([401, 422]).toContain(res.status());
  });
});
