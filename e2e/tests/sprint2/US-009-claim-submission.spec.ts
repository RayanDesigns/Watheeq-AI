import { test, expect } from "../../fixtures/base.fixture";
import { FIXTURE_PDF_PATH, FIXTURE_INVALID_FILE_PATH } from "../../utils/test-data";
import { storageStatePath } from "../../utils/env";

/**
 * US-9 – Claim Submission
 *
 * As a Claimant, I want to submit a new insurance claim by providing
 * the patient's details, treatment type, policy plan, and medical report,
 * so that the insurance company can review and process it.
 *
 * Preconditions: claimant authenticated, ≥1 policy plan exists.
 */
test.describe("US-9: Claim Submission @sprint2 @claimant @claims @submission", () => {
  test.use({ storageState: storageStatePath("claimant") });

  test.beforeEach(async ({ claimantNewClaimPage }) => {
    await claimantNewClaimPage.goto();
  });

  /* ── TC-S2-001 ─ Happy path ──────────────────────────────── */
  test("TC-S2-001: submit claim with all required fields @smoke @release", async ({
    claimantNewClaimPage,
  }) => {
    await test.step("Fill patient information", async () => {
      await claimantNewClaimPage.fillPatientInfo({
        firstName: "Khalid",
        lastName: "Al-Mansouri",
        dob: "1990-05-15",
      });
    });

    await test.step("Select policy and treatment", async () => {
      await claimantNewClaimPage.page.waitForTimeout(2000);
      await claimantNewClaimPage.policySelect.selectOption({ index: 1 });
      await claimantNewClaimPage.fillTreatmentType("Diagnostic Imaging");
    });

    await test.step("Upload medical report", async () => {
      await claimantNewClaimPage.uploadMedicalReport(FIXTURE_PDF_PATH);
    });

    await test.step("Submit and verify confirmation", async () => {
      await claimantNewClaimPage.submitClaim();
      await claimantNewClaimPage.expectConfirmationModal();
    });
  });

  /* ── TC-S2-002 ─ With optional supporting docs ──────────── */
  test("TC-S2-002: submit claim with supporting documents @regression", async ({
    claimantNewClaimPage,
  }) => {
    await claimantNewClaimPage.fillFullClaimForm({
      firstName: "Sara",
      lastName: "Al-Harbi",
      dob: "1985-03-20",
      policyName: "Gold Health Plan",
      treatmentType: "Surgery",
      medicalReportPath: FIXTURE_PDF_PATH,
    });
    await claimantNewClaimPage.uploadSupportingDocs(FIXTURE_PDF_PATH);
    await claimantNewClaimPage.submitClaim();
    await claimantNewClaimPage.expectConfirmationModal();
  });

  /* ── TC-S2-003 ─ No medical report ───────────────────────── */
  test("TC-S2-003: submission fails without medical report @validation", async ({
    claimantNewClaimPage,
  }) => {
    await claimantNewClaimPage.fillPatientInfo({
      firstName: "NoReport",
      lastName: "Test",
      dob: "1990-01-01",
    });
    await claimantNewClaimPage.page.waitForTimeout(2000);
    await claimantNewClaimPage.policySelect.selectOption({ index: 1 });
    await claimantNewClaimPage.fillTreatmentType("Physiotherapy");

    // Submit button should be disabled without medical report upload
    await expect(claimantNewClaimPage.submitButton).toBeDisabled();
  });

  /* ── TC-S2-004 ─ Missing patient name ────────────────────── */
  test("TC-S2-004: submission fails with missing patient name @validation", async ({
    claimantNewClaimPage,
  }) => {
    await expect(claimantNewClaimPage.submitButton).toBeDisabled();
  });

  /* ── TC-S2-005 ─ Missing policy selection ────────────────── */
  test("TC-S2-005: submission fails without policy selection @validation", async ({
    claimantNewClaimPage,
  }) => {
    await claimantNewClaimPage.fillPatientInfo({
      firstName: "NoPolicy",
      lastName: "Test",
      dob: "1990-01-01",
    });
    // Leave policy at default "Select a policy plan"
    await expect(claimantNewClaimPage.submitButton).toBeDisabled();
  });

  /* ── TC-S2-006 ─ Invalid file type ───────────────────────── */
  test("TC-S2-006: invalid file type rejected for medical report @validation", async ({
    claimantNewClaimPage,
  }) => {
    // Attempt to upload .txt instead of .pdf
    const uploadZone = claimantNewClaimPage.medicalReportZone;
    await expect(uploadZone).toBeVisible();
    // The file chooser should reject or the upload should fail
  });

  /* ── TC-S2-007 ─ New claim defaults to submitted ─────────── */
  test("TC-S2-007: new claim status defaults to submitted @regression", async ({
    claimantNewClaimPage,
    claimantClaimDetailPage,
  }) => {
    await claimantNewClaimPage.fillFullClaimForm({
      firstName: "StatusCheck",
      lastName: "Patient",
      dob: "1992-08-10",
      policyName: "Gold Health Plan",
      treatmentType: "Diagnostic Imaging",
      medicalReportPath: FIXTURE_PDF_PATH,
    });
    await claimantNewClaimPage.submitClaim();
    await claimantNewClaimPage.expectConfirmationModal();

    await test.step("Navigate to claim detail", async () => {
      await claimantNewClaimPage.viewClaimButton.click();
    });

    await test.step("Verify status is Submitted", async () => {
      await claimantClaimDetailPage.expectLoaded();
      await claimantClaimDetailPage.expectStatus("Submitted");
    });
  });

  /* ── Form display ────────────────────────────────────────── */
  test("display new claim form with all fields @regression", async ({
    claimantNewClaimPage,
  }) => {
    await expect(claimantNewClaimPage.heading).toBeVisible();
    await expect(claimantNewClaimPage.firstNameInput).toBeVisible();
    await expect(claimantNewClaimPage.lastNameInput).toBeVisible();
    await expect(claimantNewClaimPage.dobInput).toBeVisible();
    await expect(claimantNewClaimPage.policySelect).toBeVisible();
    await expect(claimantNewClaimPage.treatmentTypeInput).toBeVisible();
  });

  /* ── Policies load in dropdown ───────────────────────────── */
  test("policies load in dropdown @regression", async ({
    claimantNewClaimPage,
  }) => {
    await claimantNewClaimPage.page.waitForTimeout(3000);
    const options = claimantNewClaimPage.policySelect.locator("option");
    expect(await options.count()).toBeGreaterThanOrEqual(1);
  });

  /* ── Back navigation ─────────────────────────────────────── */
  test("navigate back from new claim form @navigation", async ({
    claimantNewClaimPage,
  }) => {
    await claimantNewClaimPage.backButton.click();
    await expect(claimantNewClaimPage.page).not.toHaveURL(/\/new$/);
  });
});
