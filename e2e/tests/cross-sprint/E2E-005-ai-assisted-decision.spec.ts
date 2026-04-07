import { test, expect } from "../../fixtures/base.fixture";
import { getTestEnv } from "../../utils/env";
import { FIXTURE_PDF_PATH } from "../../utils/test-data";

const env = getTestEnv();

/**
 * E2E-005 — AI-Assisted Claim Decision (Full Pipeline)
 *
 * Submit Claim → Examiner Picks → AI Analyzes → Coverage View →
 * Draft Response → Edit Draft → Examiner Decides → Claimant Sees Status
 *
 * Participating stories: US-9, US-16, US-20, US-21, US-22, US-23, US-24, US-19
 *
 * STATUS: AI service not yet implemented. This test is a scaffold
 * for the full AI-assisted pipeline.
 *
 * Flake risks:
 * - AI service latency or timeout
 * - Non-deterministic AI output (use structural assertions)
 * - Race between AI completion and page render
 */
test.describe("E2E-005: AI-Assisted Claim Decision @cross-sprint @release", () => {
  test.skip(true, "AI service not yet implemented — enable when Sprint 3 AI stories complete");

  test("submit → pick → AI analysis → view coverage → edit draft → decide", async ({
    claimantNewClaimPage,
    examinerClaimsPage,
    examinerClaimDetailPage,
    claimantClaimDetailPage,
    page,
  }) => {
    let claimRef = "";

    await test.step("Claimant submits claim", async () => {
      await claimantNewClaimPage.goto();
      await claimantNewClaimPage.fillFullClaimForm({
        firstName: "AI-Test",
        lastName: "Patient",
        dob: "1990-05-15",
        policyName: "Gold Health Plan",
        treatmentType: "Diagnostic Imaging",
        medicalReportPath: FIXTURE_PDF_PATH,
      });
      await claimantNewClaimPage.submitClaim();
      await claimantNewClaimPage.expectConfirmationModal();
      claimRef = await claimantNewClaimPage.getClaimReferenceNumber();
    });

    await test.step("Examiner picks claim → AI analysis auto-triggers", async () => {
      await examinerClaimsPage.goto();
      await examinerClaimsPage.selectTab("submitted");
      // Pick the claim — this should trigger AI analysis
    });

    await test.step("Wait for AI analysis to complete", async () => {
      // Poll or wait for AI analysis section to show results
      // await expect(page.locator('[data-testid="ai-analysis-section"]')).toBeVisible({
      //   timeout: 60_000,
      // });
    });

    await test.step("View AI coverage decision and clauses", async () => {
      // await expect(page.locator('[data-testid="ai-coverage-decision"]')).toBeVisible();
      // const decision = await page.locator('[data-testid="ai-coverage-decision"]').textContent();
      // expect(decision).toMatch(/covered|not covered/i);
    });

    await test.step("View and edit AI draft response", async () => {
      // await expect(page.locator('[data-testid="ai-draft-response"]')).toBeVisible();
      // const draftEditor = page.locator('[data-testid="ai-draft-response-editor"]');
      // await draftEditor.fill("Reviewed and edited by examiner.");
    });

    await test.step("Examiner approves the claim", async () => {
      await examinerClaimDetailPage.expectDecisionPanelVisible();
      await examinerClaimDetailPage.approveClaim();
      await examinerClaimDetailPage.expectStatus("Approved");
    });

    await test.step("Claimant sees final Approved status", async () => {
      await claimantClaimDetailPage.goto(claimRef);
      await claimantClaimDetailPage.expectLoaded();
      await claimantClaimDetailPage.expectStatus("Approved");
    });
  });
});
