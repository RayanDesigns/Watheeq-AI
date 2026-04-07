import { type Page, type Locator, expect } from "@playwright/test";
import path from "path";

/**
 * Page object for /dashboard/admin/policies — policy plan management.
 */
export class AdminPoliciesPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly backLink: Locator;
  readonly addPolicyButton: Locator;
  readonly policyCards: Locator;
  readonly emptyState: Locator;
  readonly loadingSpinner: Locator;

  // Add policy modal
  readonly modalHeading: Locator;
  readonly policyNameInput: Locator;
  readonly policyFileInput: Locator;
  readonly modalSubmitButton: Locator;
  readonly modalCancelButton: Locator;
  readonly modalError: Locator;

  // Delete confirmation
  readonly deleteConfirmHeading: Locator;
  readonly deleteConfirmButton: Locator;
  readonly deleteCancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: /Policy Plans/i });
    this.backLink = page.getByRole("link", { name: /Dashboard/i });
    this.addPolicyButton = page.getByRole("button", { name: /Add Policy|New Policy/i });
    this.policyCards = page.locator("[data-testid='policy-card']")
      .or(page.locator(".rounded-2xl.border").filter({ hasText: /\.pdf/i }));
    this.emptyState = page.getByText(/no.*polic/i);
    this.loadingSpinner = page.locator(".animate-spin");

    this.modalHeading = page.getByRole("heading", { name: /Add.*Policy|New.*Policy/i });
    this.policyNameInput = page.getByPlaceholder(/policy name|plan name/i);
    this.policyFileInput = page.locator('input[type="file"]');
    this.modalSubmitButton = page.getByRole("button", { name: /Add|Create|Upload/i }).last();
    this.modalCancelButton = page.getByRole("button", { name: /Cancel/i });
    this.modalError = page.locator('[style*="color: #dc2626"]');

    this.deleteConfirmHeading = page.getByRole("heading", { name: /Delete.*policy/i });
    this.deleteConfirmButton = page.getByRole("button", { name: /Yes.*Delete|Confirm/i });
    this.deleteCancelButton = page.getByRole("button", { name: /Cancel|No/i });
  }

  async goto() {
    await this.page.goto("/dashboard/admin/policies");
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
  }

  async addPolicy(name: string, pdfPath: string) {
    await this.addPolicyButton.click();
    await expect(this.modalHeading).toBeVisible();
    await this.policyNameInput.fill(name);

    const absolutePath = path.resolve(__dirname, "..", pdfPath);
    await this.policyFileInput.setInputFiles(absolutePath);

    await this.modalSubmitButton.click();
  }

  getDeleteButtonForPolicy(policyName: string): Locator {
    return this.page.locator(`[data-testid="delete-policy"]`)
      .or(
        this.policyCards
          .filter({ hasText: policyName })
          .getByRole("button", { name: /Delete|Remove/i }),
      );
  }

  async deletePolicy(policyName: string) {
    const deleteBtn = this.getDeleteButtonForPolicy(policyName);
    await deleteBtn.click();
    await expect(this.deleteConfirmHeading).toBeVisible();
    await this.deleteConfirmButton.click();
  }
}
