import { test, expect } from "../../fixtures/base.fixture";
import { storageStatePath } from "../../utils/env";
import { AI_COVERED_CLAIM_ID } from "../../utils/test-seed";

/**
 * US-22 – AI Coverage Decision View
 *
 * As a Claims Examiner, I want to view the AI coverage decision and
 * the applicable policy clauses, so that I can make an informed
 * decision on the claim.
 */
test.describe("US-22: AI Coverage Decision View @sprint3 @examiner @ai @coverage", () => {
  test.use({ storageState: storageStatePath("examiner") });

  /* ── TC-S3-015 ─ Coverage decision visible ──────────────── */
  test("TC-S3-015: AI coverage decision visible on claim detail @smoke @release", async ({
    examinerClaimDetailPage,
  }) => {
    await examinerClaimDetailPage.goto(AI_COVERED_CLAIM_ID);
    await examinerClaimDetailPage.expectLoaded();

    const page = examinerClaimDetailPage.page;

    await test.step("'AI Decision' label is rendered", async () => {
      await expect(page.getByText(/^AI Decision$/i)).toBeVisible();
    });

    await test.step("Decision pill states 'Covered'", async () => {
      await expect(
        page.locator("span.uppercase").filter({ hasText: /^Covered$/ }),
      ).toBeVisible();
    });

    await test.step("Reasoning is shown alongside the decision", async () => {
      await expect(page.getByText(/AI Reasoning/i)).toBeVisible();
    });
  });

  /* ── TC-S3-016 ─ Loading state while analysis runs ──────── */
  test("TC-S3-016: loading state shown while AI analysis runs @regression", async ({
    examinerClaimDetailPage,
  }) => {
    // Dedicated under-review claim with NO persisted AI fields. The
    // frontend's streaming useEffect therefore skips the doc-hydration
    // short-circuit, sets ai.status = "processing" and opens the SSE
    // stream — surfacing the live phase banner immediately.
    await examinerClaimDetailPage.goto("s3-loading-claim-id");
    await examinerClaimDetailPage.expectLoaded();
    await examinerClaimDetailPage.expectStatus("Under Review");

    const page = examinerClaimDetailPage.page;

    await test.step("Live streaming hint copy is rendered", async () => {
      await expect(
        page.getByText(/Live.*streaming from/i),
      ).toBeVisible({ timeout: 15_000 });
    });

    await test.step("Phase copy describes a real pipeline step", async () => {
      // Any of these phases is acceptable — the pipeline may have raced
      // through `started` → `pdf_medical` already by the time the page
      // hydrates, but it can't have completed (claim has no aiDecision).
      const banner = page.getByText(
        /Starting AI analysis|Reading the medical report|Reading the policy document|Analyzing the claim|Drafting the response|AI is reviewing/i,
      );
      await expect(banner.first()).toBeVisible({ timeout: 15_000 });
    });
  });
});
