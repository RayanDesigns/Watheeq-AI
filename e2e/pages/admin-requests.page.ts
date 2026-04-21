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
    // Rows live inside the requests table; the outer .rounded-2xl.border
    // wrapper also contains the empty-state, so matching the wrapper falsely
    // reports visible rows. Target tbody rows directly.
    this.requestCards = page.locator("[data-testid='examiner-request-card']")
      .or(page.locator("table tbody tr"));
    // The empty state renders two paragraphs ("No requests found" and a
    // status-specific sub-line). Using a non-strict first() prevents a
    // strict-mode violation when the matcher resolves to multiple nodes.
    this.emptyState = page
      .getByText(/no requests found|no pending requests/i)
      .first();
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
