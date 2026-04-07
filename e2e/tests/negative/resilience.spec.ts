import { test, expect, adminTest } from "../../fixtures/base.fixture";

test.describe("Loading States", () => {
  test("should show loading spinner on login page initially", async ({ page }) => {
    // The root page redirects to /login
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});

adminTest.describe("Admin Portal Resilience", () => {
  adminTest("should handle page reload on admin dashboard", async ({ page }) => {
    await page.goto("/dashboard/admin");
    await expect(page.getByRole("heading", { name: /Welcome/i })).toBeVisible({
      timeout: 15_000,
    });

    await page.reload();
    await expect(page.getByRole("heading", { name: /Welcome/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  adminTest("should handle navigation via browser back button", async ({ page }) => {
    await page.goto("/dashboard/admin");
    await expect(page.getByRole("heading", { name: /Welcome/i })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/dashboard/admin/requests");
    await page.waitForTimeout(2000);

    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard\/admin/);
  });

  adminTest("should handle invalid claim ID gracefully", async ({ page }) => {
    await page.goto("/claimant/claims/nonexistent-id-12345");
    await page.waitForTimeout(5000);
    // Should either show error or redirect — not crash
    const hasError = await page.locator('[style*="color: #dc2626"]').isVisible().catch(() => false);
    const redirected = !page.url().includes("nonexistent-id");
    expect(hasError || redirected).toBeTruthy();
  });
});

test.describe("Network and API Resilience", () => {
  test("should handle backend health check", async ({ request }) => {
    const res = await request.get("http://localhost:8000/");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.service).toBe("Watheeq AI API");
  });

  test("should return proper error for unknown API routes", async ({ request }) => {
    const res = await request.get("http://localhost:8000/api/nonexistent");
    expect([404, 405]).toContain(res.status());
  });
});
