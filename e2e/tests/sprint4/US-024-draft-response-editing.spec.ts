import { test, expect } from "../../fixtures/base.fixture";

/**
 * US-24 – Draft Response Editing
 *
 * As a Claims Examiner, I want to edit the AI draft response before
 * sending it, so that I can ensure the response is accurate before
 * replying to the Claimant.
 *
 * STATUS: Not yet implemented — no draft editing UI or endpoint exists.
 * These tests are designed for when US-24 is built.
 */
test.describe("US-24: Draft Response Editing @sprint4 @examiner @ai @draft @editing", () => {
  test.skip(true, "Draft editing UI/endpoint not yet implemented");

  /* ── TC-S4-001 ─ Edit draft response text ────────────────── */
  test("TC-S4-001: examiner edits the draft response text @smoke @release", async ({
    page,
  }) => {
    // Navigate to claim with AI draft
    // Click edit or modify the draft textarea
    // Change wording
    // Save

    // const draftArea = page.locator('[data-testid="ai-draft-response-editor"]');
    // await draftArea.fill("Edited response text for the claimant.");
    // await page.getByRole("button", { name: /Save/i }).click();
    // await expect(page.getByText("Edited response text")).toBeVisible();
    expect(true).toBeTruthy(); // Placeholder
  });

  /* ── TC-S4-002 ─ Edited draft persists ──────────────────── */
  test("TC-S4-002: edited draft persists across page reloads @regression", async ({
    page,
  }) => {
    // Edit draft → save → reload → verify edited text still shown
    // await page.reload();
    // await expect(page.locator('[data-testid="ai-draft-response-editor"]'))
    //   .toContainText("Edited response text");
    expect(true).toBeTruthy(); // Placeholder
  });

  /* ── TC-S4-003 ─ Empty draft blocked ─────────────────────── */
  test("TC-S4-003: draft cannot be submitted if empty @validation", async ({
    page,
  }) => {
    // Clear draft text → try to submit → validation error
    // const draftArea = page.locator('[data-testid="ai-draft-response-editor"]');
    // await draftArea.fill("");
    // await page.getByRole("button", { name: /Send|Submit/i }).click();
    // await expect(page.locator('[style*="color: #dc2626"]')).toBeVisible();
    expect(true).toBeTruthy(); // Placeholder
  });
});
