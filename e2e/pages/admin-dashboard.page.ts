import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Page object for /dashboard/admin — admin main dashboard.
 */
export class AdminDashboardPage {
  readonly page: Page;
  readonly welcomeHeading: Locator;
  readonly examinerRequestsCard: Locator;
  readonly policyPlansCard: Locator;
  readonly pendingBadge: Locator;
  readonly signOutButton: Locator;
  readonly sidebarExaminerRequests: Locator;
  readonly sidebarPolicyPlans: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeHeading = page.getByRole("heading", { name: /Welcome/i });
    this.examinerRequestsCard = page.getByRole("link", { name: /Examiner Requests/i }).first();
    this.policyPlansCard = page.getByRole("link", { name: /Policy Plans/i }).first();
    this.pendingBadge = page.getByText(/pending/i);
    this.signOutButton = page.getByRole("button", { name: "Sign Out" }).first();
    this.sidebarExaminerRequests = page.getByRole("link", { name: "Examiner Requests" });
    this.sidebarPolicyPlans = page.getByRole("link", { name: "Policy Plans" });
  }

  async goto() {
    await this.page.goto("/dashboard/admin");
  }

  async expectLoaded() {
    await expect(this.welcomeHeading).toBeVisible({ timeout: 15_000 });
  }

  async navigateToExaminerRequests() {
    await this.examinerRequestsCard.click();
    await this.page.waitForURL("**/dashboard/admin/requests");
  }

  async navigateToPolicyPlans() {
    await this.policyPlansCard.click();
    await this.page.waitForURL("**/dashboard/admin/policies");
  }

  async signOut() {
    await this.signOutButton.click();
    await this.page.waitForURL("**/login");
  }
}
