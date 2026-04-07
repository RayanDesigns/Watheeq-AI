import { test, expect } from "../../fixtures/base.fixture";

/**
 * US-11 – Claim History Overview
 *
 * As a Claimant, I want to view all my claims,
 * so that I have a complete overview of my claims history.
 */
test.describe("US-11: Claim History Overview @sprint2 @claimant @claims @list", () => {
  // test.use({ storageState: ".auth/claimant.json" });
  test.skip(true, "Requires claimant auth state");

  /* ── TC-S2-012 ─ All claims visible ──────────────────────── */
  test("TC-S2-012: claimant sees all their claims @smoke @release", async ({
    claimantClaimsPage,
  }) => {
    await claimantClaimsPage.goto();
    await claimantClaimsPage.expectLoaded();

    await test.step("Verify claims visible or empty state", async () => {
      const hasClaims = await claimantClaimsPage.claimCards
        .first()
        .isVisible()
        .catch(() => false);
      const hasEmpty = await claimantClaimsPage.emptyStateHeading
        .isVisible()
        .catch(() => false);
      expect(hasClaims || hasEmpty).toBeTruthy();
    });
  });

  /* ── TC-S2-013 ─ Empty state for new claimant ────────────── */
  test("TC-S2-013: empty state when no claims exist @regression", async ({
    claimantClaimsPage,
  }) => {
    await claimantClaimsPage.goto();
    // For a freshly registered claimant with no claims
    await claimantClaimsPage.expectEmptyState();
  });

  /* ── TC-S2-014 ─ Click navigates to detail ──────────────── */
  test("TC-S2-014: clicking a claim navigates to detail @regression", async ({
    claimantClaimsPage,
  }) => {
    await claimantClaimsPage.goto();
    await claimantClaimsPage.expectClaimsVisible();

    const firstCard = claimantClaimsPage.claimCards.first();
    await firstCard.click();
    await expect(claimantClaimsPage.page).toHaveURL(/\/claimant\/claims\/[^/]+$/);
  });

  /* ── Claim cards show policy and status ──────────────────── */
  test("claim cards show policy and status badges @regression", async ({
    claimantClaimsPage,
  }) => {
    await claimantClaimsPage.goto();
    await claimantClaimsPage.expectClaimsVisible();

    const firstCard = claimantClaimsPage.claimCards.first();
    await expect(firstCard).toContainText(/Policy:/);
    await expect(firstCard.locator("span.uppercase")).toBeVisible();
  });

  /* ── Navigate to new claim ───────────────────────────────── */
  test("navigate to new claim form @navigation", async ({
    claimantClaimsPage,
  }) => {
    await claimantClaimsPage.goto();
    await claimantClaimsPage.clickNewClaim();
    await expect(claimantClaimsPage.page).toHaveURL(/\/claimant\/claims\/new/);
  });
});
