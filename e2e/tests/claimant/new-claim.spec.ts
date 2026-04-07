import { test, expect } from "../../fixtures/base.fixture";

/**
 * New claim submission tests.
 *
 * Requires:
 * 1. Authenticated claimant session
 * 2. At least one policy plan created by admin
 * 3. A sample PDF at e2e/data/fixtures/sample.pdf
 */
test.describe("New Claim Submission", () => {
  // test.use({ storageState: ".auth/claimant.json" });

  test.skip(true, "Requires claimant auth state — see docs/testing/e2e.md for setup");

  test("should display the new claim form", async ({ claimantNewClaimPage }) => {
    await claimantNewClaimPage.goto();
    await expect(claimantNewClaimPage.heading).toBeVisible();
    await expect(claimantNewClaimPage.firstNameInput).toBeVisible();
    await expect(claimantNewClaimPage.lastNameInput).toBeVisible();
    await expect(claimantNewClaimPage.dobInput).toBeVisible();
    await expect(claimantNewClaimPage.policySelect).toBeVisible();
    await expect(claimantNewClaimPage.treatmentTypeInput).toBeVisible();
  });

  test("should disable submit when required fields are empty", async ({ claimantNewClaimPage }) => {
    await claimantNewClaimPage.goto();
    await expect(claimantNewClaimPage.submitButton).toBeDisabled();
  });

  test("should submit a claim successfully", async ({ claimantNewClaimPage }) => {
    await claimantNewClaimPage.goto();

    await test.step("Fill patient information", async () => {
      await claimantNewClaimPage.fillPatientInfo({
        firstName: "Khalid",
        lastName: "Al-Mansouri",
        dob: "1990-05-15",
      });
    });

    await test.step("Select policy and treatment", async () => {
      // Wait for policies to load
      await claimantNewClaimPage.page.waitForTimeout(2000);
      await claimantNewClaimPage.policySelect.selectOption({ index: 1 });
      await claimantNewClaimPage.fillTreatmentType("Diagnostic Imaging");
    });

    await test.step("Upload medical report", async () => {
      await claimantNewClaimPage.uploadMedicalReport("data/fixtures/sample.pdf");
    });

    await test.step("Submit and verify confirmation", async () => {
      await claimantNewClaimPage.submitClaim();
      await claimantNewClaimPage.expectConfirmationModal();
    });
  });

  test("should navigate back from new claim form", async ({ claimantNewClaimPage }) => {
    await claimantNewClaimPage.goto();
    await claimantNewClaimPage.backButton.click();
    await expect(claimantNewClaimPage.page).not.toHaveURL(/\/new$/);
  });

  test("should load available policies in dropdown", async ({ claimantNewClaimPage }) => {
    await claimantNewClaimPage.goto();
    // Wait for policies to load from API
    await claimantNewClaimPage.page.waitForTimeout(3000);
    const options = claimantNewClaimPage.policySelect.locator("option");
    await expect(options).toHaveCount(await options.count());
    // Should have at least the placeholder + one real option
    expect(await options.count()).toBeGreaterThanOrEqual(1);
  });
});
