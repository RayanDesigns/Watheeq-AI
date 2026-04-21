import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Page object for /examiner/claims — examiner claims queue.
 */
export class ExaminerClaimsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly tabAll: Locator;
  readonly tabSubmitted: Locator;
  readonly tabUnderReview: Locator;
  readonly tabApproved: Locator;
  readonly tabRejected: Locator;
  readonly claimCards: Locator;
  readonly emptyStateHeading: Locator;
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;
  readonly pickErrorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Claims Queue" });
    this.tabAll = page.getByRole("button", { name: "All" });
    this.tabSubmitted = page.getByRole("button", { name: "Submitted" });
    this.tabUnderReview = page.getByRole("button", { name: "Under Review" });
    this.tabApproved = page.getByRole("button", { name: "Approved" });
    this.tabRejected = page.getByRole("button", { name: "Rejected" });
    this.claimCards = page.locator(".rounded-2xl.border.p-5");
    this.emptyStateHeading = page.getByRole("heading", { name: "No claims here" });
    this.loadingSpinner = page.locator(".animate-spin");
    this.errorMessage = page.locator('[style*="color:#dc2626"], [style*="color: #dc2626"]').first();
    this.pickErrorMessage = page.locator('[style*="color:#dc2626"], [style*="color: #dc2626"]').nth(1);
  }

  async goto() {
    await this.page.goto("/examiner/claims");
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible();
  }

  async selectTab(tab: "all" | "submitted" | "under review" | "approved" | "rejected") {
    const tabMap = {
      all: this.tabAll,
      submitted: this.tabSubmitted,
      "under review": this.tabUnderReview,
      approved: this.tabApproved,
      rejected: this.tabRejected,
    };
    await tabMap[tab].click();
  }

  async pickClaim(claimId: string) {
    await this.page.locator(`#pick-${claimId}`).click();
  }

  async viewClaim(claimId: string) {
    await this.page.locator(`#view-${claimId}`).click();
  }

  getClaimCardByPatientName(name: string): Locator {
    return this.claimCards.filter({ hasText: name });
  }

  getPickButton(claimId: string): Locator {
    return this.page.locator(`#pick-${claimId}`);
  }

  getViewButton(claimId: string): Locator {
    return this.page.locator(`#view-${claimId}`);
  }
}
