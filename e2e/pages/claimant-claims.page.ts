import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Page object for /claimant/claims — claim listing for the claimant.
 */
export class ClaimantClaimsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly newClaimButton: Locator;
  readonly claimCards: Locator;
  readonly emptyStateHeading: Locator;
  readonly submitClaimButton: Locator;
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "My Claims" });
    this.newClaimButton = page.getByRole("link", { name: "New Claim" });
    // Scope to actual claim detail links. `/claimant/claims/new` (the sidebar
    // "Submit Claim" link) also starts with `/claimant/claims/` so we must
    // exclude it to avoid matching the nav item as a "card".
    this.claimCards = page.locator(
      "a[href^='/claimant/claims/']:not([href='/claimant/claims/new'])",
    );
    this.emptyStateHeading = page.getByRole("heading", { name: "No claims yet" });
    this.submitClaimButton = page.getByRole("link", { name: "Submit a Claim" });
    this.loadingSpinner = page.locator(".animate-spin");
    this.errorMessage = page.locator('[style*="color:#dc2626"], [style*="color: #dc2626"]').first();
  }

  async goto() {
    await this.page.goto("/claimant/claims");
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible();
  }

  async expectClaimsVisible() {
    await expect(this.claimCards.first()).toBeVisible({ timeout: 15_000 });
  }

  async expectEmptyState() {
    await expect(this.emptyStateHeading).toBeVisible();
  }

  async clickNewClaim() {
    await this.newClaimButton.click();
    await this.page.waitForURL("**/claimant/claims/new");
  }

  async clickClaim(claimId: string) {
    await this.page.getByRole("link", { name: new RegExp(claimId) }).click();
  }

  getClaimCardByPatientName(name: string): Locator {
    return this.claimCards.filter({ hasText: name });
  }

  getStatusBadge(status: string): Locator {
    return this.page.locator("span").filter({ hasText: new RegExp(`^${status}$`, "i") });
  }
}
