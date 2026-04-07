import { test, expect } from "../../fixtures/base.fixture";

/**
 * Examiner claims queue tests.
 *
 * Requires authenticated examiner session.
 */
test.describe("Examiner Claims Queue", () => {
  // test.use({ storageState: ".auth/examiner.json" });

  test.skip(true, "Requires examiner auth state — see docs/testing/e2e.md for setup");

  test("should display claims queue page", async ({ examinerClaimsPage }) => {
    await examinerClaimsPage.goto();
    await examinerClaimsPage.expectLoaded();
    await expect(examinerClaimsPage.tabAll).toBeVisible();
    await expect(examinerClaimsPage.tabSubmitted).toBeVisible();
    await expect(examinerClaimsPage.tabUnderReview).toBeVisible();
  });

  test("should filter claims by tab", async ({ examinerClaimsPage }) => {
    await examinerClaimsPage.goto();
    await examinerClaimsPage.expectLoaded();

    await test.step("Click Submitted tab", async () => {
      await examinerClaimsPage.selectTab("submitted");
    });

    await test.step("Click Under Review tab", async () => {
      await examinerClaimsPage.selectTab("under review");
    });

    await test.step("Click All tab", async () => {
      await examinerClaimsPage.selectTab("all");
    });
  });

  test("should show empty state for empty tab", async ({ examinerClaimsPage }) => {
    await examinerClaimsPage.goto();
    await examinerClaimsPage.selectTab("rejected");
    // May show empty state depending on data
    const emptyOrCards = examinerClaimsPage.emptyStateHeading.or(examinerClaimsPage.claimCards.first());
    await expect(emptyOrCards).toBeVisible({ timeout: 10_000 });
  });

  test("should show Pick button for submitted claims", async ({ examinerClaimsPage }) => {
    await examinerClaimsPage.goto();
    await examinerClaimsPage.selectTab("submitted");

    const firstCard = examinerClaimsPage.claimCards.first();
    const isVisible = await firstCard.isVisible().catch(() => false);
    if (isVisible) {
      const pickButton = firstCard.getByRole("button", { name: "Pick" });
      await expect(pickButton).toBeVisible();
    }
  });

  test("should pick a submitted claim and navigate to detail", async ({ examinerClaimsPage }) => {
    await examinerClaimsPage.goto();
    await examinerClaimsPage.selectTab("submitted");

    const firstCard = examinerClaimsPage.claimCards.first();
    const isVisible = await firstCard.isVisible().catch(() => false);
    test.skip(!isVisible, "No submitted claims available to pick");

    const pickButton = firstCard.getByRole("button", { name: "Pick" });
    await pickButton.click();
    await expect(examinerClaimsPage.page).toHaveURL(/\/examiner\/claims\/[^/]+$/);
  });
});
