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
    // Policies render as rows in a <table>; match tbody rows directly.
    this.policyCards = page.locator("[data-testid='policy-card']")
      .or(page.locator("table tbody tr"));
    this.emptyState = page.getByText(/no policies yet|no.*polic/i);
    this.loadingSpinner = page.locator(".animate-spin");

    this.modalHeading = page.getByRole("heading", { name: /Add Policy Plan|Add.*Policy|New.*Policy/i });
    // The actual placeholder is "e.g. Comprehensive Health Plan 2025".
    // Target the input via its label-association by using the sibling input
    // inside the modal's "Policy Name" label group.
    this.policyNameInput = page
      .getByPlaceholder(/policy name|plan name|Comprehensive Health|e\.g\./i)
      .first();
    this.policyFileInput = page.locator('input[type="file"]');
    // "Upload Policy" is the literal CTA in the modal; prefer an exact match.
    this.modalSubmitButton = page
      .getByRole("button", { name: /Upload Policy/i })
      .or(page.getByRole("button", { name: /Add|Create|Upload/i }).last());
    this.modalCancelButton = page.getByRole("button", { name: /Cancel/i });
    this.modalError = page
      .locator(
        '[class*="rounded-xl"][class*="gap-2.5"][class*="text-sm"]:has(svg)',
      )
      .or(
        page.locator('[style*="color:#dc2626"], [style*="color: #dc2626"]'),
      );

    this.deleteConfirmHeading = page.getByRole("heading", { name: /Delete Policy|Delete.*policy/i });
    // Each table row renders its own "Delete" button; the confirmation
    // modal *also* contains a red "Delete" button. Scope to the modal by
    // matching the sibling of the "Delete Policy" heading.
    const confirmModal = page
      .locator("div")
      .filter({ has: this.deleteConfirmHeading })
      .last();
    this.deleteConfirmButton = confirmModal.getByRole("button", {
      name: /^Delete$|Yes.*Delete|Confirm/,
    });
    this.deleteCancelButton = confirmModal.getByRole("button", {
      name: /^Cancel$|^No$/,
    });
  }

  async goto() {
    await this.page.goto("/dashboard/admin/policies");
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
  }

  async addPolicy(name: string, pdfPath: string) {
    // Only open the modal if it's not already open — some tests open the
    // modal first (to assert on the heading) and then call addPolicy(); a
    // second click on the underlying button would land on the overlay and
    // time out.
    const modalAlreadyOpen = await this.modalHeading
      .isVisible()
      .catch(() => false);
    if (!modalAlreadyOpen) {
      await this.addPolicyButton.click();
      await expect(this.modalHeading).toBeVisible();
    }
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
