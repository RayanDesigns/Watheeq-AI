import { test, expect } from "../../fixtures/base.fixture";
import { storageStatePath } from "../../utils/env";
import { AI_COVERED_CLAIM_ID } from "../../utils/test-seed";

/**
 * US-21 – AI Claim Analysis
 *
 * As a Claims Examiner, I want the system to analyze the claim details
 * against the selected policy plan using an external AI service,
 * so that the coverage decision is based on the policy clauses.
 *
 * Backed by the seeded `AI_COVERED_CLAIM_ID` fixture so the tests run
 * deterministically and offline (the frontend short-circuits the live
 * Gemini stream when `claim.aiDecision` is already on the doc).
 *
 * Assertions target STRUCTURE, not exact wording — the analysis is
 * rendered as discrete sections (decision pill, reasoning paragraph,
 * editable draft textarea) rather than as raw text.
 */
test.describe("US-21: AI Claim Analysis @sprint3 @examiner @ai @analysis", () => {
  test.use({ storageState: storageStatePath("examiner") });

  /* ── TC-S3-013 ─ Structured analysis output ──────────────── */
  test("TC-S3-013: AI analysis produces structured output @smoke @release", async ({
    examinerClaimDetailPage,
  }) => {
    await examinerClaimDetailPage.goto(AI_COVERED_CLAIM_ID);
    await examinerClaimDetailPage.expectLoaded();
    await examinerClaimDetailPage.expectStatus("Under Review");

    const page = examinerClaimDetailPage.page;

    await test.step("AI section is rendered with a clear header", async () => {
      await expect(page.getByText("AI Analysis (Watheeq AI)")).toBeVisible();
    });

    await test.step("Coverage decision is rendered as a structured pill", async () => {
      const decisionPill = page
        .locator("span.uppercase")
        .filter({ hasText: /^(Covered|Not covered)$/ });
      await expect(decisionPill).toBeVisible();
      const decisionText = (await decisionPill.textContent())?.trim() ?? "";
      expect(decisionText).toMatch(/covered|not covered/i);
    });

    await test.step("Reasoning section renders as its own labeled paragraph", async () => {
      await expect(page.getByText(/AI Reasoning/i)).toBeVisible();
    });

    await test.step("Editable draft response is its own labeled textarea", async () => {
      await expect(page.getByText(/AI Draft Response/i)).toBeVisible();
      const draft = await page.getByRole("textbox").inputValue();
      expect(draft.length).toBeGreaterThan(0);
    });
  });

  /* ── TC-S3-014 ─ Analysis references correct policy ─────── */
  test("TC-S3-014: AI analysis references the claim's policy plan @regression", async ({
    examinerClaimDetailPage,
  }) => {
    await examinerClaimDetailPage.goto(AI_COVERED_CLAIM_ID);
    await examinerClaimDetailPage.expectLoaded();

    const page = examinerClaimDetailPage.page;

    // Both the claim's own policy field and the AI reasoning reference
    // the seeded "Gold Health Plan" policy — that proves the analysis was
    // anchored to the selected plan, not run against an unrelated one.
    await expect(page.getByText("Gold Health Plan").first()).toBeVisible();

    const policyMentionsInPage = page.getByText(/Gold Health Plan/);
    expect(await policyMentionsInPage.count()).toBeGreaterThanOrEqual(2);
  });
});
