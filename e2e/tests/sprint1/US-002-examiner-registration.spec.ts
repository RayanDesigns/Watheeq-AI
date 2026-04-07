import { test, expect } from "../../fixtures/base.fixture";
import { getTestEnv } from "../../utils/env";

const env = getTestEnv();

/**
 * US-2 – Claims Examiner Registration Request
 *
 * As a Claims Examiner, I want to submit a registration request,
 * so that I can gain access to the system upon Admin approval.
 */
test.describe("US-2: Claims Examiner Registration Request @sprint1 @auth @examiner @registration", () => {
  test.beforeEach(async ({ registerPage }) => {
    await registerPage.goto();
  });

  /* ── TC-S1-008 ─ Happy path ──────────────────────────────── */
  test("TC-S1-008: submit examiner registration request @smoke @release", async ({
    registerPage,
  }) => {
    await test.step("Select examiner role", async () => {
      await registerPage.selectRole("examiner");
      await expect(registerPage.hospitalNameInput).not.toBeVisible();
    });

    await test.step("Fill examiner details", async () => {
      await registerPage.fillExaminerDetails({
        fullName: "Test Examiner E2E",
        nationalId: "2222222222",
        email: "examiner-e2e@example.com",
        phone: env.TEST_PHONE_EXAMINER,
      });
    });

    await test.step("Submit and enter OTP", async () => {
      await registerPage.continueButton.click();
      await expect(registerPage.otpInputs.first()).toBeVisible();
      await registerPage.fillOtp(env.TEST_OTP_CODE);
      await registerPage.submitRequestButton.click();
    });

    await test.step("Verify pending approval message", async () => {
      await expect(registerPage.successHeading).toBeVisible({ timeout: 15_000 });
    });
  });

  /* ── TC-S1-009 ─ Duplicate pending request ───────────────── */
  test("TC-S1-009: reject duplicate pending examiner request @validation @regression", async ({
    registerPage,
  }) => {
    await registerPage.fillExaminerDetails({
      fullName: "Duplicate Examiner",
      nationalId: "3333333333",
      email: "dup-examiner@example.com",
      phone: env.TEST_PHONE_EXAMINER,
    });
    await registerPage.continueButton.click();
    await registerPage.expectErrorVisible();
  });

  /* ── TC-S1-010 ─ Duplicate NID across requests ──────────── */
  test("TC-S1-010: reject duplicate NID across users and requests @validation", async ({
    registerPage,
  }) => {
    await registerPage.fillExaminerDetails({
      fullName: "Dup NID Examiner",
      nationalId: "2222222222",
      email: "nid-dup@example.com",
      phone: "+966599999997",
    });
    await registerPage.continueButton.click();
    await registerPage.expectErrorVisible();
  });

  /* ── TC-S1-011 ─ Duplicate email across requests ─────────── */
  test("TC-S1-011: reject duplicate email across users and requests @validation", async ({
    registerPage,
  }) => {
    await registerPage.fillExaminerDetails({
      fullName: "Dup Email Examiner",
      nationalId: "4444444444",
      email: "examiner-e2e@example.com",
      phone: "+966599999996",
    });
    await registerPage.continueButton.click();
    await registerPage.expectErrorVisible();
  });

  /* ── TC-S1-BNR ─ Examiner info banner ────────────────────── */
  test("show admin-review banner when examiner role selected @regression", async ({
    registerPage,
  }) => {
    await registerPage.selectRole("examiner");
    await expect(
      registerPage.page.getByText("Your request will be reviewed by an admin"),
    ).toBeVisible();
  });

  /* ── TC-S1-TOG ─ Role toggle ─────────────────────────────── */
  test("toggle between claimant and examiner roles @regression", async ({
    registerPage,
  }) => {
    await registerPage.selectRole("examiner");
    await expect(registerPage.hospitalNameInput).not.toBeVisible();

    await registerPage.selectRole("claimant");
    await expect(registerPage.hospitalNameInput).toBeVisible();
  });

  /* ── TC-S1-ENA ─ Continue enabled for examiner ──────────── */
  test("continue enabled when all examiner fields filled @validation", async ({
    registerPage,
  }) => {
    await registerPage.fillExaminerDetails({
      fullName: "Complete Examiner",
      nationalId: "5555555555",
      email: "complete-exam@example.com",
      phone: "500000098",
    });
    await expect(registerPage.continueButton).toBeEnabled();
  });
});
