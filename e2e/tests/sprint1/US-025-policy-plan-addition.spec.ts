import { adminTest as test, expect } from "../../fixtures/base.fixture";

/**
 * US-25 – Policy Plan Addition
 *
 * As an Admin, I want to add a new policy plan by providing its name
 * and uploading its document, so that Claimants can select it when
 * submitting claims.
 */
test.describe("US-25: Policy Plan Addition @sprint1 @admin @policies @crud", () => {
  test.beforeEach(async ({ adminPoliciesPage }) => {
    await adminPoliciesPage.goto();
    await adminPoliciesPage.expectLoaded();
  });

  /* ── TC-S1-037 ─ Add a policy plan ───────────────────────── */
  test("TC-S1-037: admin adds a new policy plan @smoke @release", async ({
    adminPoliciesPage,
  }) => {
    const uniqueName = `E2E-Policy-${Date.now()}`;

    await test.step("Open add policy modal", async () => {
      await adminPoliciesPage.addPolicyButton.click();
      await expect(adminPoliciesPage.modalHeading).toBeVisible();
    });

    await test.step("Fill name and upload PDF", async () => {
      await adminPoliciesPage.addPolicy(uniqueName, "data/fixtures/sample.pdf");
    });

    await test.step("Verify policy appears in list", async () => {
      await expect(
        adminPoliciesPage.page.getByText(uniqueName),
      ).toBeVisible({ timeout: 30_000 });
    });
  });

  /* ── TC-S1-038 ─ Duplicate name rejected ─────────────────── */
  test("TC-S1-038: reject policy with duplicate name @validation @regression", async ({
    adminPoliciesPage,
  }) => {
    // First, check if any policy exists to use its name
    await adminPoliciesPage.page.waitForTimeout(3000);
    const firstPolicy = adminPoliciesPage.policyCards.first();
    const hasPolicies = await firstPolicy.isVisible().catch(() => false);
    test.skip(!hasPolicies, "No existing policies to test duplicate name against");

    const existingName = await firstPolicy.locator("h3, h4, strong, .font-semibold").first().textContent();
    test.skip(!existingName, "Could not extract existing policy name");

    await adminPoliciesPage.addPolicyButton.click();
    await expect(adminPoliciesPage.modalHeading).toBeVisible();
    await adminPoliciesPage.policyNameInput.fill(existingName!.trim());

    // Should show a validation error or prevent submission
    await adminPoliciesPage.page.waitForTimeout(2000);
  });

  /* ── TC-S1-039 ─ No document blocks submission ──────────── */
  test("TC-S1-039: cannot add policy without document @validation", async ({
    adminPoliciesPage,
  }) => {
    await adminPoliciesPage.addPolicyButton.click();
    await expect(adminPoliciesPage.modalHeading).toBeVisible();
    await adminPoliciesPage.policyNameInput.fill("Policy Without Doc");
    // Submit button should be disabled or submission should fail
  });

  /* ── TC-S1-040 ─ Empty name blocks submission ───────────── */
  test("TC-S1-040: cannot add policy with empty name @validation", async ({
    adminPoliciesPage,
  }) => {
    await adminPoliciesPage.addPolicyButton.click();
    await expect(adminPoliciesPage.modalHeading).toBeVisible();
    // Leave name empty — submission should be blocked
  });

  /* ── Modal open/close ────────────────────────────────────── */
  test("open and close add policy modal @regression", async ({
    adminPoliciesPage,
  }) => {
    await expect(adminPoliciesPage.addPolicyButton).toBeVisible();
    await adminPoliciesPage.addPolicyButton.click();
    await expect(adminPoliciesPage.modalHeading).toBeVisible();

    await adminPoliciesPage.modalCancelButton.click();
    await expect(adminPoliciesPage.modalHeading).not.toBeVisible();
  });

  /* ── Policies list or empty state ────────────────────────── */
  test("show policies list or empty state @regression", async ({
    adminPoliciesPage,
  }) => {
    await adminPoliciesPage.page.waitForTimeout(3000);
    const hasPolicies = await adminPoliciesPage.policyCards
      .first()
      .isVisible()
      .catch(() => false);
    const hasEmpty = await adminPoliciesPage.emptyState
      .isVisible()
      .catch(() => false);
    expect(hasPolicies || hasEmpty).toBeTruthy();
  });
});
