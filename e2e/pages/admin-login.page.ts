import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Page object for /admin-login — email/password login for admin users.
 */
export class AdminLoginPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly errorMessage: Locator;
  readonly claimantExaminerLink: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Admin Portal" });
    this.emailInput = page.getByPlaceholder("admin@watheeq.ai");
    this.passwordInput = page.getByPlaceholder("Enter password");
    this.signInButton = page.getByRole("button", { name: "Sign in" });
    // The error banner is a framer-motion <motion.div> with the distinctive
    // className combo "rounded-xl text-sm gap-2.5" and an inner warning SVG.
    // framer-motion rewrites the `style` attribute on mount, so matching by
    // inline-style colour is unreliable; the className combination is stable.
    this.errorMessage = page
      .locator(
        '[class*="rounded-xl"][class*="gap-2.5"][class*="text-sm"]:has(svg)',
      )
      .or(
        page.locator('[style*="color:#dc2626"], [style*="color: #dc2626"]'),
      )
      .first();
    this.claimantExaminerLink = page.getByRole("link", { name: "Claimant / Examiner login" });
    this.loadingSpinner = page.getByRole("button", { name: "Signing in..." });
  }

  async goto() {
    await this.page.goto("/admin-login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async loginAndWaitForDashboard(email: string, password: string) {
    await this.login(email, password);
    await this.page.waitForURL("**/dashboard/admin**", { timeout: 30_000 });
  }

  async expectErrorVisible(text?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (text) {
      await expect(this.errorMessage).toContainText(text);
    }
  }
}
