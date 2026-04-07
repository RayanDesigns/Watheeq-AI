import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Page object for /dashboard/admin/requests — examiner registration requests.
 */
export class AdminRequestsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly backLink: Locator;
  readonly requestCards: Locator;
  readonly emptyState: Locator;
  readonly loadingSpinner: Locator;
  readonly tabPending: Locator;
  readonly tabApproved: Locator;
  readonly tabRejected: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: /Examiner Requests|Registration Requests/i });
    this.backLink = page.getByRole("link", { name: /Dashboard/i });
    this.requestCards = page.locator("[data-testid='examiner-request-card']")
      .or(page.locator(".rounded-2xl.border").filter({ hasText: /pending|approved|rejected/i }));
    this.emptyState = page.getByText(/no.*requests/i);
    this.loadingSpinner = page.locator(".animate-spin");
    this.tabPending = page.getByRole("button", { name: "Pending" });
    this.tabApproved = page.getByRole("button", { name: "Approved" });
    this.tabRejected = page.getByRole("button", { name: "Rejected" });
  }

  async goto() {
    await this.page.goto("/dashboard/admin/requests");
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible({ timeout: 15_000 });
  }

  getApproveButton(requestId: string): Locator {
    return this.page.locator(`[data-testid="approve-${requestId}"]`)
      .or(this.page.getByRole("button", { name: "Approve" }));
  }

  getRejectButton(requestId: string): Locator {
    return this.page.locator(`[data-testid="reject-${requestId}"]`)
      .or(this.page.getByRole("button", { name: "Reject" }));
  }
}
