import { test, expect } from "../../fixtures/base.fixture";

/**
 * Claimant claims list page tests.
 *
 * NOTE: These tests require an authenticated claimant session.
 * Without Authentica SMS sandbox, claimant auth state must be
 * created manually (see docs/testing/e2e.md).
 *
 * If claimant auth state exists at .auth/claimant.json, uncomment
 * the storageState line below.
 */
test.describe("Claimant Claims List", () => {
  // test.use({ storageState: ".auth/claimant.json" });

  test.skip(true, "Requires claimant auth state — see docs/testing/e2e.md for setup");

  test("should display claims list page", async ({ claimantClaimsPage }) => {
    await claimantClaimsPage.goto();
    await claimantClaimsPage.expectLoaded();
  });

  test("should show empty state when no claims exist", async ({ claimantClaimsPage }) => {
    await claimantClaimsPage.goto();
    await claimantClaimsPage.expectEmptyState();
  });

  test("should navigate to new claim form", async ({ claimantClaimsPage }) => {
    await claimantClaimsPage.goto();
    await claimantClaimsPage.clickNewClaim();
    await expect(claimantClaimsPage.page).toHaveURL(/\/claimant\/claims\/new/);
  });

  test("should display claim cards with status badges", async ({ claimantClaimsPage }) => {
    await claimantClaimsPage.goto();
    await claimantClaimsPage.expectClaimsVisible();

    const firstCard = claimantClaimsPage.claimCards.first();
    await expect(firstCard).toContainText(/Policy:/);
    await expect(firstCard.locator("span.uppercase")).toBeVisible();
  });

  test("should navigate to claim detail when clicking a card", async ({ claimantClaimsPage }) => {
    await claimantClaimsPage.goto();
    await claimantClaimsPage.expectClaimsVisible();

    const firstCard = claimantClaimsPage.claimCards.first();
    await firstCard.click();
    await expect(claimantClaimsPage.page).toHaveURL(/\/claimant\/claims\/[^/]+$/);
  });
});
