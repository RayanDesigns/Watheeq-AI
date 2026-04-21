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
    // Use a brand-new phone/email/NID so the backend's duplicate-guard doesn't
    // fire. All three OTP/signup endpoints are stubbed: send-otp → 200,
    // verify-otp → {is_new_user:true}, signup → {token, role:"claimant"}.
    // The token is a real Firebase custom token minted for the seeded
    // claimant UID, so `signInWithCustomToken` succeeds for real and the
    // app redirects to /claimant/claims.
    await registerPage.stubHappyClaimantSignup();
    await registerPage.selectRole("claimant");
    await expect(registerPage.hospitalNameInput).toBeVisible();
    await registerPage.fillClaimantDetails({
      fullName: "Test Claimant Happy",
      nationalId: "9000000001",
      email: "claimant-happy-e2e@example.com",
      hospitalName: "King Fahad Medical City",
      phone: "+966500000077",
    });
    await registerPage.continueButton.click();
    await expect(registerPage.otpInputs.first()).toBeVisible();
    await registerPage.fillOtp(env.TEST_OTP_CODE);
    await registerPage.createAccountButton.click();
    await registerPage.page.waitForURL(/\/claimant\/claims/, {
      timeout: 20_000,
    });
  });

  /* ── TC-S1-002 ─ Duplicate phone ─────────────────────────── */
  test("TC-S1-002: reject duplicate phone number @validation @regression", async ({
    registerPage,
  }) => {
    // Without seeded DB data the backend would treat this phone as new and
    // transition to the OTP screen. Stub the 409 response to exercise the
    // UI's duplicate-phone error handling deterministically.
    await registerPage.stubSendOtpError({
      status: 409,
      detail: "An account already exists for this number. Please login.",
    });
    await registerPage.fillClaimantDetails({
      fullName: "Duplicate Phone User",
      nationalId: "9999999999",
      email: "unique@example.com",
      hospitalName: "Test Hospital",
      phone: env.TEST_PHONE_CLAIMANT,
    });
    await registerPage.continueButton.click();
    await registerPage.expectErrorVisible(/already exists/i);
  });

  /* ── TC-S1-003 ─ Duplicate National ID ───────────────────── */
  test("TC-S1-003: reject duplicate National ID @validation @regression", async ({
    registerPage,
  }) => {
    await registerPage.stubSendOtpError({
      status: 409,
      detail: "This National ID or Iqama is already registered.",
    });
    await registerPage.fillClaimantDetails({
      fullName: "Duplicate NID User",
      nationalId: "1234567890",
      email: "newunique@example.com",
      hospitalName: "Test Hospital",
      phone: "+966599999999",
    });
    await registerPage.continueButton.click();
    await registerPage.expectErrorVisible(/National ID|Iqama/i);
  });

  /* ── TC-S1-004 ─ Duplicate email ─────────────────────────── */
  test("TC-S1-004: reject duplicate email @validation @regression", async ({
    registerPage,
  }) => {
    await registerPage.stubSendOtpError({
      status: 409,
      detail: "This email address is already registered.",
    });
    await registerPage.fillClaimantDetails({
      fullName: "Duplicate Email User",
      nationalId: "9876543210",
      email: "claimant-e2e@example.com",
      hospitalName: "Test Hospital",
      phone: "+966599999998",
    });
    await registerPage.continueButton.click();
    await registerPage.expectErrorVisible(/email/i);
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
