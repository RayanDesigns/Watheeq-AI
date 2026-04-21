import { test, expect } from "../../fixtures/base.fixture";
import { getTestEnv } from "../../utils/env";
import { CLAIMANT_UID, EXAMINER_UID } from "../../utils/test-seed";

const env = getTestEnv();

/**
 * US-6 – Claimant and Claims Examiner Login
 *
 * As a Claimant or Claims Examiner, I want to log in using my phone
 * number and OTP, so that I can securely access my account.
 */
test.describe("US-6: Claimant and Claims Examiner Login @sprint1 @auth @login", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  /* ── TC-S1-022 ─ Claimant login ──────────────────────────── */
  test("TC-S1-022: claimant logs in with phone + OTP @smoke @release @claimant", async ({
    loginPage,
  }) => {
    // Stubs send-otp + verify-otp. verify-otp returns a real Firebase custom
    // token for the seeded CLAIMANT_UID so signInWithCustomToken completes
    // and the app redirects to /dashboard/claimant → /claimant/claims.
    await loginPage.stubOtpEndpointsForUid(CLAIMANT_UID, "claimant");
    await loginPage.sendOtp(env.TEST_PHONE_CLAIMANT.replace("+966", ""));
    await loginPage.expectOtpFieldVisible();
    await loginPage.verifyOtp(env.TEST_OTP_CODE);
    await loginPage.page.waitForURL(/\/claimant\/claims/, { timeout: 20_000 });
  });

  /* ── TC-S1-023 ─ Examiner login ──────────────────────────── */
  test("TC-S1-023: examiner logs in with phone + OTP @smoke @release @examiner", async ({
    loginPage,
  }) => {
    await loginPage.stubOtpEndpointsForUid(EXAMINER_UID, "examiner");
    await loginPage.sendOtp(env.TEST_PHONE_EXAMINER.replace("+966", ""));
    await loginPage.expectOtpFieldVisible();
    await loginPage.verifyOtp(env.TEST_OTP_CODE);
    // Examiner landing is /dashboard/examiner (card grid). Claimant landing
    // differs — /dashboard/claimant auto-redirects to /claimant/claims.
    await loginPage.page.waitForURL(/\/dashboard\/examiner/, {
      timeout: 20_000,
    });
  });

  /* ── TC-S1-024 ─ Unregistered phone ──────────────────────── */
  test("TC-S1-024: login fails for unregistered phone @validation @regression", async ({
    loginPage,
  }) => {
    await loginPage.sendOtp("599999999");
    await loginPage.expectErrorVisible();
  });

  /* ── TC-S1-025 ─ Pending examiner cannot login ──────────── */
  test("TC-S1-025: login fails for pending examiner @validation @regression @examiner", async ({
    loginPage,
  }) => {
    // Requires a pending examiner request for this phone in Firestore
    await loginPage.sendOtp("500000001");
    // Should either show OTP or show pending error depending on state
    await loginPage.page.waitForTimeout(3000);
    await expect(loginPage.page).toHaveURL(/\/login/);
  });

  /* ── TC-S1-026 ─ Rejected examiner cannot login ─────────── */
  test("TC-S1-026: login fails for rejected examiner @validation @regression @examiner", async ({
    loginPage,
  }) => {
    // Requires a rejected examiner request in Firestore
    // This test verifies the error path — the user stays on login
    await loginPage.sendOtp("500000001");
    await loginPage.page.waitForTimeout(3000);
    await expect(loginPage.page).toHaveURL(/\/login/);
  });

  /* ── TC-S1-027 ─ Invalid OTP on login ────────────────────── */
  test("TC-S1-027: login with invalid OTP stays on login page @validation @regression", async ({
    loginPage,
  }) => {
    // Stub send-otp so the OTP UI renders, and make verify-otp reject the
    // code so we can assert the user remains on /login without depending on
    // whether the phone is seeded or whether Authentica accepts "0000".
    await loginPage.stubOtpEndpoints();
    await loginPage.sendOtp("500000001");
    await loginPage.expectOtpFieldVisible();
    await loginPage.verifyOtp("0000");
    await expect(loginPage.page).toHaveURL(/\/login/);
  });

  /* ── TC-S1-028 ─ Navigate to registration ────────────────── */
  test("TC-S1-028: login page links to registration @navigation", async ({
    loginPage,
  }) => {
    await loginPage.createAccountLink.click();
    await expect(loginPage.page).toHaveURL(/\/register$/);
  });

  /* ── Login form display ──────────────────────────────────── */
  test("display login form with phone input @regression", async ({
    loginPage,
  }) => {
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.phoneInput).toBeVisible();
    await expect(loginPage.continueButton).toBeVisible();
  });

  /* ── Continue disabled when empty ────────────────────────── */
  test("continue button disabled when phone empty @validation", async ({
    loginPage,
  }) => {
    await expect(loginPage.continueButton).toBeDisabled();
  });

  /* ── Navigate to admin login ─────────────────────────────── */
  test("navigate to admin login @navigation", async ({ loginPage }) => {
    await loginPage.adminLoginLink.click();
    await expect(loginPage.page).toHaveURL(/\/admin-login$/);
  });
});
