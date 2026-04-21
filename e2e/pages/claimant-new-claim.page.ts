import { type Page, type Locator, expect } from "@playwright/test";
import path from "path";

/**
 * Page object for /claimant/claims/new — new claim submission form.
 */
export class ClaimantNewClaimPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly backButton: Locator;

  // Patient info
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly dobInput: Locator;

  // Claim details
  readonly policySelect: Locator;
  readonly treatmentTypeInput: Locator;

  // Upload zones
  readonly medicalReportZone: Locator;
  readonly supportingDocsZone: Locator;

  // Submit
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  // Confirmation modal
  readonly confirmationHeading: Locator;
  readonly claimReferenceNumber: Locator;
  readonly viewClaimButton: Locator;
  readonly myClaimsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Submit New Claim" });
    this.backButton = page.getByRole("button", { name: "Back" });

    this.firstNameInput = page.getByPlaceholder("e.g. Khalid");
    this.lastNameInput = page.getByPlaceholder("e.g. Al-Mansouri");
    this.dobInput = page.locator('input[type="date"]');

    this.policySelect = page.locator("select");
    this.treatmentTypeInput = page.getByPlaceholder(/physiotherapy|surgery|diagnostic/i);

    this.medicalReportZone = page.locator('[data-testid="upload-medical-report"]');
    this.supportingDocsZone = page.locator('[data-testid="upload-supporting-docs"]');

    this.submitButton = page.getByRole("button", { name: "Submit Claim" });
    this.errorMessage = page.locator('[style*="color:#dc2626"], [style*="color: #dc2626"]').first();

    this.confirmationHeading = page.getByRole("heading", { name: "Claim Submitted!" });
    this.claimReferenceNumber = page.locator(".font-mono.font-bold");
    this.viewClaimButton = page.getByRole("button", { name: "View Claim" });
    this.myClaimsButton = page.getByRole("button", { name: "My Claims" });
  }

  async goto() {
    await this.page.goto("/claimant/claims/new");
  }

  async fillPatientInfo(data: {
    firstName: string;
    lastName: string;
    dob: string;
  }) {
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.dobInput.fill(data.dob);
  }

  async selectPolicy(policyName: string) {
    // Policies load asynchronously via /api/policies once the Firebase auth
    // state resolves. The <select> is rendered with `disabled={loadingPolicies}`
    // while the fetch is in flight, so we must wait for it to become enabled
    // *and* for the target option to render before attempting a selection.
    await expect(this.policySelect).toBeEnabled({ timeout: 30_000 });
    const option = this.policySelect.locator("option", { hasText: policyName });
    await expect(option).toHaveCount(1, { timeout: 15_000 });
    await this.policySelect.selectOption({ label: policyName });
  }

  async fillTreatmentType(type: string) {
    await this.treatmentTypeInput.fill(type);
  }

  /**
   * Upload a PDF file using the file chooser triggered by clicking the upload zone.
   * Falls back to locating by text if data-testid is not present.
   */
  async uploadMedicalReport(filePath: string) {
    await this._uploadToZone(filePath, "upload-medical-report");
  }

  async uploadSupportingDocs(filePath: string) {
    await this._uploadToZone(filePath, "upload-supporting-docs");
  }

  /**
   * Shared upload helper. Scoped strictly to the matching testid so the
   * "Click to select PDF" text isn't matched across both zones (strict-mode
   * violation) when only one is being targeted.
   */
  private async _uploadToZone(filePath: string, testId: string) {
    const absolutePath = path.resolve(__dirname, "..", filePath);
    const uploadZone = this.page.locator(`[data-testid="${testId}"]`);
    const clickTarget = uploadZone.getByText("Click to select PDF");

    const [fileChooser] = await Promise.all([
      this.page.waitForEvent("filechooser"),
      clickTarget.click(),
    ]);
    await fileChooser.setFiles(absolutePath);

    const uploadButton = uploadZone.getByRole("button", { name: "Upload" });
    await uploadButton.click();

    // Firebase Storage upload can take > 30 s under parallel load — give it
    // enough headroom to stay stable on heavier test runs.
    await expect(uploadZone.getByText("Uploaded successfully")).toBeVisible({
      timeout: 60_000,
    });
  }

  async submitClaim() {
    await this.submitButton.click();
  }

  async expectConfirmationModal() {
    await expect(this.confirmationHeading).toBeVisible({ timeout: 15_000 });
    await expect(this.claimReferenceNumber).toBeVisible();
  }

  async getClaimReferenceNumber(): Promise<string> {
    return (await this.claimReferenceNumber.textContent()) ?? "";
  }

  async fillFullClaimForm(data: {
    firstName: string;
    lastName: string;
    dob: string;
    policyName: string;
    treatmentType: string;
    medicalReportPath: string;
  }) {
    await this.fillPatientInfo({
      firstName: data.firstName,
      lastName: data.lastName,
      dob: data.dob,
    });
    await this.selectPolicy(data.policyName);
    await this.fillTreatmentType(data.treatmentType);
    await this.uploadMedicalReport(data.medicalReportPath);
  }
}
