import { adminTest as test, expect } from "../../fixtures/base.fixture";
import { FIXTURE_PDF_PATH } from "../../utils/test-data";

/**
 * E2E-004 — Policy Lifecycle
 *
 * Create → Use in Claim → Delete → Verify Data Integrity
 *
 * Participating stories: US-25, US-26, US-27, US-9
 *
 * Flake risks:
 * - Cloudinary upload/delete latency
 * - Policy dropdown not refreshing after admin creates policy
 */
test.describe("E2E-004: Policy Lifecycle @cross-sprint @release", () => {
  test("admin creates policy → visible in lists → admin deletes → gone from lists", async ({
    adminPoliciesPage,
  }) => {
    const policyName = `E2E-Lifecycle-Policy-${Date.now()}`;

    await test.step("Admin creates a new policy plan", async () => {
      await adminPoliciesPage.goto();
      await adminPoliciesPage.expectLoaded();
      await adminPoliciesPage.addPolicy(policyName, FIXTURE_PDF_PATH);
      await expect(
        adminPoliciesPage.page.getByText(policyName),
      ).toBeVisible({ timeout: 30_000 });
    });

    await test.step("Policy visible in admin list", async () => {
      await adminPoliciesPage.goto();
      await adminPoliciesPage.expectLoaded();
      await adminPoliciesPage.page.waitForTimeout(3000);
      await expect(
        adminPoliciesPage.page.getByText(policyName),
      ).toBeVisible();
    });

    await test.step("Admin deletes the policy", async () => {
      await adminPoliciesPage.deletePolicy(policyName);
      await adminPoliciesPage.page.waitForTimeout(3000);
    });

    await test.step("Policy no longer visible", async () => {
      const stillVisible = await adminPoliciesPage.page
        .getByText(policyName)
        .isVisible()
        .catch(() => false);
      expect(stillVisible).toBeFalsy();
    });
  });
});
