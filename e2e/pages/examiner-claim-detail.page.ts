import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Page object for /examiner/claims/[id] — claim detail and decision for examiner.
 */
export class ExaminerClaimDetailPage {
  readonly page: Page;
  readonly backButton: Locator;
  readonly patientName: Locator;
  readonly claimReference: Locator;
  readonly statusBadge: Locator;
  readonly statusDescription: Locator;

  // Decision panel
  readonly makeDecisionHeading: Locator;
  readonly approveButton: Locator;
  readonly rejectButton: Locator;
  readonly submitDecisionButton: Locator;

  // Confirmation modal
  readonly approveConfirmHeading: Locator;
  readonly rejectConfirmHeading: Locator;
  readonly yesApproveButton: Locator;
  readonly yesRejectButton: Locator;
  readonly cancelButton: Locator;
  readonly decisionError: Locator;

  // Post-decision banner
  readonly postDecisionBanner: Locator;

  // Document links
  readonly viewReportLink: Locator;
  readonly viewDocumentsLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backButton = page.getByRole("button", { name: "Claims Queue" });
    this.patientName = page.getByRole("heading").first();
    this.claimReference = page.locator(".font-mono").first();
    this.statusBadge = page.locator("span.uppercase").first();
    this.statusDescription = page.locator("p").filter({ hasText: /claim|review|approved|rejected|cancelled/i }).first();

    this.makeDecisionHeading = page.getByText("Make a Decision");
    // The live UI renders the decision CTAs as buttons whose accessible
    // name begins with "Approve Claim"/"Reject Claim" (followed by a short
    // description). Match on that name, with a fallback to the original
    // `#btn-*` ids in case the component is refactored to add them back.
    this.approveButton = page
      .locator("#btn-approve")
      .or(page.getByRole("button", { name: /^Approve Claim/i }));
    this.rejectButton = page
      .locator("#btn-reject")
      .or(page.getByRole("button", { name: /^Reject Claim/i }));
    this.submitDecisionButton = page.getByRole("button", {
      name: /^Submit Decision$/i,
    });

    this.approveConfirmHeading = page.getByRole("heading", { name: "Approve this claim?" });
    this.rejectConfirmHeading = page.getByRole("heading", { name: "Reject this claim?" });
    this.yesApproveButton = page.getByRole("button", { name: "Yes, Approve" });
    this.yesRejectButton = page.getByRole("button", { name: "Yes, Reject" });
    this.cancelButton = page.getByRole("button", { name: "Cancel" });
    this.decisionError = page.locator('[style*="color:#dc2626"], [style*="color: #dc2626"]');

    this.postDecisionBanner = page.locator("p").filter({ hasText: /You (approved|rejected) this claim/i });

    this.viewReportLink = page.getByRole("link", { name: "View Report" });
    this.viewDocumentsLink = page.getByRole("link", { name: "View Documents" });
  }

  async goto(claimId: string) {
    await this.page.goto(`/examiner/claims/${claimId}`);
  }

  async expectLoaded() {
    await expect(this.patientName).toBeVisible({ timeout: 30_000 });
  }

  async expectStatus(status: string) {
    await expect(this.statusBadge).toContainText(status, { ignoreCase: true });
  }

  async approveClaim() {
    // The examiner UI is a two-step commit:
    //   1. Select a radio-style "Approve Claim" card.
    //   2. Click the "Submit Decision" CTA that appears once a card is
    //      selected, which opens the "Approve this claim?" confirmation.
    //   3. Confirm via "Yes, Approve".
    await this.approveButton.click();
    await this.submitDecisionButton.click();
    await expect(this.approveConfirmHeading).toBeVisible();
    await this.yesApproveButton.click();
    await expect(this.postDecisionBanner).toBeVisible({ timeout: 15_000 });
  }

  async rejectClaim() {
    await this.rejectButton.click();
    await this.submitDecisionButton.click();
    await expect(this.rejectConfirmHeading).toBeVisible();
    await this.yesRejectButton.click();
    await expect(this.postDecisionBanner).toBeVisible({ timeout: 15_000 });
  }

  async expectDecisionPanelVisible() {
    await expect(this.makeDecisionHeading).toBeVisible();
    await expect(this.approveButton).toBeVisible();
    await expect(this.rejectButton).toBeVisible();
  }

  async expectDecisionPanelNotVisible() {
    await expect(this.approveButton).not.toBeVisible();
    await expect(this.rejectButton).not.toBeVisible();
  }

  getFieldValue(label: string): Locator {
    return this.page.locator(`text=${label}`).locator("..").locator("p").last();
  }
}
