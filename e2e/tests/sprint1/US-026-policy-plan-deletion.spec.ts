import { adminTest as test, expect } from "../../fixtures/base.fixture";

/**
 * US-26 – Policy Plan Deletion
 *
 * As an Admin, I want to delete a policy plan, so that outdated or
 * incorrect policy plans are removed from the system.
 */
test.describe("US-26: Policy Plan Deletion @sprint1 @admin @policies @deletion", () => {
  test.beforeEach(async ({ adminPoliciesPage }) => {
    await adminPoliciesPage.goto();
    await adminPoliciesPage.expectLoaded();
  });

  /* ── TC-S1-041 ─ Delete a policy plan ────────────────────── */
  test("TC-S1-041: admin deletes a policy plan @release @regression", async ({
    adminPoliciesPage,
  }) => {
    await adminPoliciesPage.page.waitForTimeout(3000);

    const firstPolicy = adminPoliciesPage.policyCards.first();
    const hasPolicies = await firstPolicy.isVisible().catch(() => false);
    test.skip(!hasPolicies, "No policies available to delete");

    const policyName = await firstPolicy
      .locator("h3, h4, strong, .font-semibold")
      .first()
      .textContent();

    await test.step("Click delete and confirm", async () => {
      await adminPoliciesPage.deletePolicy(policyName!.trim());
    });

    await test.step("Verify policy removed from list", async () => {
      await adminPoliciesPage.page.waitForTimeout(3000);
      if (policyName) {
        const stillVisible = await adminPoliciesPage.page
          .getByText(policyName.trim())
          .isVisible()
          .catch(() => false);
        expect(stillVisible).toBeFalsy();
      }
    });
  });

  /* ── TC-S1-042 ─ Cancel deletion ─────────────────────────── */
  test("TC-S1-042: admin cancels policy deletion @regression", async ({
    adminPoliciesPage,
  }) => {
    await adminPoliciesPage.page.waitForTimeout(3000);

    const firstPolicy = adminPoliciesPage.policyCards.first();
    const hasPolicies = await firstPolicy.isVisible().catch(() => false);
    test.skip(!hasPolicies, "No policies available to test cancel-delete");

    const deleteBtn = firstPolicy.getByRole("button", { name: /Delete|Remove/i });
    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click();
      await expect(adminPoliciesPage.deleteConfirmHeading).toBeVisible();
      await adminPoliciesPage.deleteCancelButton.click();
      await expect(adminPoliciesPage.deleteConfirmHeading).not.toBeVisible();
    }
  });
});
