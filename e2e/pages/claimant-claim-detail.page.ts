import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Page object for /claimant/claims/[id] — claim detail view for claimant.
 */
export class ClaimantClaimDetailPage {
  readonly page: Page;
  readonly backButton: Locator;
  readonly patientName: Locator;
  readonly claimReference: Locator;
  readonly statusBadge: Locator;
  readonly statusDescription: Locator;
  readonly cancelClaimButton: Locator;
  readonly downloadReportButton: Locator;

  // Cancel confirmation modal
  readonly cancelConfirmHeading: Locator;
  readonly yesCancelButton: Locator;
  readonly keepClaimButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backButton = page.getByRole("button", { name: "My Claims" });
    this.patientName = page.getByRole("heading").first();
    this.claimReference = page.locator(".font-mono").first();
    this.statusBadge = page.locator("span.uppercase").first();
    this.statusDescription = page.locator('p[style*="color"]').nth(1);
    this.cancelClaimButton = page.getByRole("button", { name: "Cancel Claim" });
    this.downloadReportButton = page.getByRole("button", { name: "Download Report" });

    this.cancelConfirmHeading = page.getByRole("heading", { name: "Cancel this claim?" });
    this.yesCancelButton = page.getByRole("button", { name: "Yes, Cancel" });
    this.keepClaimButton = page.getByRole("button", { name: "Keep Claim" });
  }

  async goto(claimId: string) {
    await this.page.goto(`/claimant/claims/${claimId}`);
  }

  async expectLoaded() {
    // Claim detail pages wait on both the user profile and the claim
    // document to resolve through Firebase. Under parallel test load the
    // combined tail latency can exceed the default 15 s, so we give the
    // heading a generous budget before asserting.
    await expect(this.patientName).toBeVisible({ timeout: 30_000 });
  }

  async expectStatus(status: string) {
    await expect(this.statusBadge).toContainText(status, { ignoreCase: true });
  }

  async cancelClaim() {
    await this.cancelClaimButton.click();
    await expect(this.cancelConfirmHeading).toBeVisible();
    await this.yesCancelButton.click();
  }

  async expectCancelNotAvailable() {
    await expect(this.cancelClaimButton).not.toBeVisible();
  }

  getFieldValue(label: string): Locator {
    return this.page.locator(`text=${label}`).locator("..").locator("p").last();
  }
}
