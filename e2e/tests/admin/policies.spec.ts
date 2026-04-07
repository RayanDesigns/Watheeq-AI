import { adminTest as test, expect } from "../../fixtures/base.fixture";

test.describe("Admin Policy Plans", () => {
  test("should display policies page", async ({ adminPoliciesPage }) => {
    await adminPoliciesPage.goto();
    await adminPoliciesPage.expectLoaded();
  });

  test("should show add policy button", async ({ adminPoliciesPage }) => {
    await adminPoliciesPage.goto();
    await adminPoliciesPage.expectLoaded();
    await expect(adminPoliciesPage.addPolicyButton).toBeVisible();
  });

  test("should open add policy modal", async ({ adminPoliciesPage }) => {
    await adminPoliciesPage.goto();
    await adminPoliciesPage.expectLoaded();
    await adminPoliciesPage.addPolicyButton.click();
    await expect(adminPoliciesPage.modalHeading).toBeVisible();
  });

  test("should close add policy modal on cancel", async ({ adminPoliciesPage }) => {
    await adminPoliciesPage.goto();
    await adminPoliciesPage.expectLoaded();
    await adminPoliciesPage.addPolicyButton.click();
    await expect(adminPoliciesPage.modalHeading).toBeVisible();

    await adminPoliciesPage.modalCancelButton.click();
    await expect(adminPoliciesPage.modalHeading).not.toBeVisible();
  });

  test("should show policies list or empty state", async ({ adminPoliciesPage }) => {
    await adminPoliciesPage.goto();
    await adminPoliciesPage.expectLoaded();

    await adminPoliciesPage.page.waitForTimeout(3000);

    const hasPolicies = await adminPoliciesPage.policyCards.first().isVisible().catch(() => false);
    const hasEmpty = await adminPoliciesPage.emptyState.isVisible().catch(() => false);

    expect(hasPolicies || hasEmpty).toBeTruthy();
  });

  test("should add a new policy plan", async ({ adminPoliciesPage }) => {
    test.skip(true, "Requires sample.pdf fixture and Cloudinary — run manually");

    await adminPoliciesPage.goto();
    await adminPoliciesPage.expectLoaded();

    const uniqueName = `E2E-Policy-${Date.now()}`;
    await adminPoliciesPage.addPolicy(uniqueName, "data/fixtures/sample.pdf");

    // Wait for the policy to appear in the list
    await expect(
      adminPoliciesPage.page.getByText(uniqueName),
    ).toBeVisible({ timeout: 30_000 });
  });
});
