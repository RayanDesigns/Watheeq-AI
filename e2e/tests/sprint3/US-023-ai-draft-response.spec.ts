import { test, expect } from "../../fixtures/base.fixture";
import { storageStatePath } from "../../utils/env";
import {
  AI_COVERED_CLAIM_ID,
  AI_NOT_COVERED_CLAIM_ID,
} from "../../utils/test-seed";

/**
 * US-23 – AI Draft Response Generation
 *
 * As a Claims Examiner, I want the system to generate an AI draft
 * response message based on the analysis outcome, so that I have
 * a ready response to send to the Claimant.
 *
 * The backend pipeline now persists the AI result on the claim doc
 * (`aiDecision`, `aiMessage`, `aiDraft`, `aiDraftOriginal`) and the
 * examiner detail page hydrates the draft into the editable textarea.
 * To keep these checks deterministic and offline, the test fixtures
 * pre-populate two claims (covered + not_covered) so the page short-
 * circuits the Gemini stream and renders straight from Firestore.
 *
 * Assert on structure (non-empty, contains key fields), not exact wording.
 */
test.describe("US-23: AI Draft Response Generation @sprint3 @examiner @ai @draft", () => {
  test.use({ storageState: storageStatePath("examiner") });

  /* ── TC-S3-017 ─ Draft response generated ───────────────── */
  test("TC-S3-017: AI generates draft response after analysis @smoke @release", async ({
    examinerClaimDetailPage,
  }) => {
    await examinerClaimDetailPage.goto(AI_COVERED_CLAIM_ID);
    await examinerClaimDetailPage.expectLoaded();
    await examinerClaimDetailPage.expectStatus("Under Review");

    await test.step("AI Analysis panel is rendered", async () => {
      await expect(
        examinerClaimDetailPage.page.getByText("AI Analysis (Watheeq AI)"),
      ).toBeVisible();
    });

    const draftTextbox = examinerClaimDetailPage.page.getByRole("textbox");

    await test.step("Editable draft textarea is visible", async () => {
      await expect(draftTextbox).toBeVisible();
      await expect(
        examinerClaimDetailPage.page.getByText(/AI Draft Response/i),
      ).toBeVisible();
    });

    await test.step("Draft text is non-empty and meaningfully sized", async () => {
      const draft = (await draftTextbox.inputValue()) ?? "";
      expect(draft.length).toBeGreaterThan(50);
    });
  });

  /* ── TC-S3-018 ─ Draft aligns with covered decision ─────── */
  test("TC-S3-018: covered decision yields approval-language draft @regression", async ({
    examinerClaimDetailPage,
  }) => {
    await examinerClaimDetailPage.goto(AI_COVERED_CLAIM_ID);
    await examinerClaimDetailPage.expectLoaded();

    await test.step("AI decision pill reads 'Covered'", async () => {
      await expect(
        examinerClaimDetailPage.page
          .locator("span.uppercase")
          .filter({ hasText: /^Covered$/ }),
      ).toBeVisible();
    });

    await test.step("Draft contains approval-aligned wording", async () => {
      const draft = await examinerClaimDetailPage.page
        .getByRole("textbox")
        .inputValue();
      expect(draft).toMatch(/approved|covered|eligible/i);
    });
  });

  /* ── TC-S3-018b ─ Draft aligns with not-covered decision ─ */
  test("TC-S3-018b: not-covered decision yields denial-language draft @regression", async ({
    examinerClaimDetailPage,
  }) => {
    await examinerClaimDetailPage.goto(AI_NOT_COVERED_CLAIM_ID);
    await examinerClaimDetailPage.expectLoaded();

    await test.step("AI decision pill reads 'Not covered'", async () => {
      await expect(
        examinerClaimDetailPage.page
          .locator("span.uppercase")
          .filter({ hasText: /^Not covered$/ }),
      ).toBeVisible();
    });

    await test.step("Draft contains denial-aligned wording", async () => {
      const draft = await examinerClaimDetailPage.page
        .getByRole("textbox")
        .inputValue();
      expect(draft).toMatch(/not covered|denied|reject|not eligible|outside/i);
    });
  });
});
