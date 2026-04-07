import { test, expect } from "../../fixtures/base.fixture";
import { getTestEnv } from "../../utils/env";

const env = getTestEnv();

/**
 * US-1 – Claimant Account Registration
 *
 * As a Claimant, I want to register using my personal details,
 * so that I can access the system and submit insurance claims.
 */
test.describe("US-1: Claimant Account Registration @sprint1 @auth @claimant @registration", () => {
  test.beforeEach(async ({ registerPage }) => {
    await registerPage.goto();
  });

  /* ── TC-S1-001 ─ Happy path ──────────────────────────────── */
  test("TC-S1-001: register with all valid fields @smoke @release", async ({
    registerPage,
  }) => {
    await test.step("Select claimant role", async () => {
      await registerPage.selectRole("claimant");
      await expect(registerPage.hospitalNameInput).toBeVisible();
    });

    await test.step("Fill personal details", async () => {
      await registerPage.fillClaimantDetails({
        fullName: "Test Claimant E2E",
        nationalId: "1234567890",
        email: "claimant-e2e@example.com",
        hospitalName: "King Fahad Medical City",
        phone: env.TEST_PHONE_CLAIMANT,
      });
    });

    await test.step("Submit and enter OTP", async () => {
      await registerPage.continueButton.click();
      await expect(registerPage.otpInputs.first()).toBeVisible();
      await registerPage.fillOtp(env.TEST_OTP_CODE);
      await registerPage.createAccountButton.click();
    });

    await test.step("Verify success", async () => {
      await expect(registerPage.successHeading).toBeVisible({ timeout: 15_000 });
    });
  });

  /* ── TC-S1-002 ─ Duplicate phone ─────────────────────────── */
  test("TC-S1-002: reject duplicate phone number @validation @regression", async ({
    registerPage,
  }) => {
    await registerPage.fillClaimantDetails({
      fullName: "Duplicate Phone User",
      nationalId: "9999999999",
      email: "unique@example.com",
      hospitalName: "Test Hospital",
      phone: env.TEST_PHONE_CLAIMANT,
    });
    await registerPage.continueButton.click();
    await registerPage.expectErrorVisible();
  });

  /* ── TC-S1-003 ─ Duplicate National ID ───────────────────── */
  test("TC-S1-003: reject duplicate National ID @validation @regression", async ({
    registerPage,
  }) => {
    await registerPage.fillClaimantDetails({
      fullName: "Duplicate NID User",
      nationalId: "1234567890",
      email: "newunique@example.com",
      hospitalName: "Test Hospital",
      phone: "+966599999999",
    });
    await registerPage.continueButton.click();
    await registerPage.expectErrorVisible();
  });

  /* ── TC-S1-004 ─ Duplicate email ─────────────────────────── */
  test("TC-S1-004: reject duplicate email @validation @regression", async ({
    registerPage,
  }) => {
    await registerPage.fillClaimantDetails({
      fullName: "Duplicate Email User",
      nationalId: "9876543210",
      email: "claimant-e2e@example.com",
      hospitalName: "Test Hospital",
      phone: "+966599999998",
    });
    await registerPage.continueButton.click();
    await registerPage.expectErrorVisible();
  });

  /* ── TC-S1-005 ─ Required fields validation ──────────────── */
  test("TC-S1-005: continue button disabled when required fields empty @validation", async ({
    registerPage,
  }) => {
    await expect(registerPage.continueButton).toBeDisabled();
  });

  /* ── TC-S1-006 ─ Invalid phone format ────────────────────── */
  test("TC-S1-006: reject invalid phone format @validation", async ({
    registerPage,
  }) => {
    await registerPage.fillClaimantDetails({
      fullName: "Bad Phone User",
      nationalId: "1111111111",
      email: "badphone@example.com",
      hospitalName: "Test Hospital",
      phone: "123",
    });
    await registerPage.continueButton.click();
    await registerPage.expectErrorVisible();
  });

  /* ── TC-S1-007 ─ Nav to login ────────────────────────────── */
  test("TC-S1-007: navigate from register to login @navigation", async ({
    registerPage,
  }) => {
    await registerPage.signInLink.click();
    await expect(registerPage.page).toHaveURL(/\/login$/);
  });

  /* ── TC-S1-ROL ─ Default role is claimant ────────────────── */
  test("default role is claimant with hospital field visible @regression", async ({
    registerPage,
  }) => {
    await expect(registerPage.hospitalNameInput).toBeVisible();
  });

  /* ── TC-S1-ENA ─ Continue enabled when form complete ─────── */
  test("continue enabled when all claimant fields filled @validation", async ({
    registerPage,
  }) => {
    await registerPage.fillClaimantDetails({
      fullName: "Complete User",
      nationalId: "1234567890",
      email: "complete@example.com",
      hospitalName: "Test Hospital",
      phone: "500000099",
    });
    await expect(registerPage.continueButton).toBeEnabled();
  });
});
