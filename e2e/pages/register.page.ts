import { type Page, type Locator, expect } from "@playwright/test";
import { CLAIMANT_UID, mintCustomToken } from "../utils/test-seed";

/**
 * Page object for /register — claimant/examiner registration.
 */
export class RegisterPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly claimantButton: Locator;
  readonly examinerButton: Locator;
  readonly fullNameInput: Locator;
  readonly nationalIdInput: Locator;
  readonly emailInput: Locator;
  readonly hospitalNameInput: Locator;
  readonly hospitalOtherInput: Locator;
  readonly phoneInput: Locator;
  readonly continueButton: Locator;
  readonly otpInputs: Locator;
  readonly createAccountButton: Locator;
  readonly submitRequestButton: Locator;
  readonly errorMessage: Locator;
  readonly signInLink: Locator;
  readonly successHeading: Locator;
  readonly goToSignInLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Create account" });
    this.claimantButton = page.getByRole("button", { name: "Claimant" });
    this.examinerButton = page.getByRole("button", { name: "Claims Examiner" });
    this.fullNameInput = page.getByPlaceholder("e.g. Mohammed Al-Qahtani");
    this.nationalIdInput = page.getByPlaceholder("10-digit National ID or Iqama");
    this.emailInput = page.getByPlaceholder("you@example.com");
    // Hospital field is a <select> with a "Select a hospital" placeholder option.
    // We locate the <select> tied to the "Hospital name" label via role/name.
    this.hospitalNameInput = page.locator("select").filter({ hasText: /Select a hospital/i });
    this.hospitalOtherInput = page.getByPlaceholder("Enter hospital name");
    this.phoneInput = page.getByPlaceholder("5XXXXXXXX");
    this.continueButton = page.getByRole("button", { name: "Continue" });
    this.otpInputs = page.locator('input[inputmode="numeric"]');
    this.createAccountButton = page.getByRole("button", { name: "Create Account" });
    this.submitRequestButton = page.getByRole("button", { name: "Submit Request" });
    // The error banner is a framer-motion <motion.div> with the distinctive
    // className combo "rounded-xl text-sm gap-2.5" and an inner warning SVG.
    // framer-motion rewrites the `style` attribute on mount, so matching by
    // inline-style colour is unreliable; the className combination is stable.
    this.errorMessage = page
      .locator(
        '[class*="rounded-xl"][class*="gap-2.5"][class*="text-sm"]:has(svg)',
      )
      .or(
        page.locator('[style*="color:#dc2626"], [style*="color: #dc2626"]'),
      )
      .first();
    this.signInLink = page.getByRole("link", { name: "Sign in" });
    this.successHeading = page.getByRole("heading", { name: /submitted|all set/i });
    this.goToSignInLink = page.getByRole("link", { name: "Go to Sign In" });
  }

  async goto() {
    await this.page.goto("/register");
  }

  async selectRole(role: "claimant" | "examiner") {
    if (role === "claimant") {
      await this.claimantButton.click();
    } else {
      await this.examinerButton.click();
    }
  }

  async fillClaimantDetails(data: {
    fullName: string;
    nationalId: string;
    email: string;
    hospitalName: string;
    phone: string;
  }) {
    await this.fullNameInput.fill(data.fullName);
    await this.nationalIdInput.fill(data.nationalId);
    await this.emailInput.fill(data.email);
    await this.selectHospital(data.hospitalName);
    const normalized = data.phone.replace(/^\+966/, "");
    await this.phoneInput.fill(normalized);
  }

  /**
   * Picks a hospital from the `<select>` dropdown. If the requested value is
   * not in the predefined list, falls back to "__other__" and types the name
   * into the custom-hospital input.
   */
  async selectHospital(hospitalName: string) {
    const options = await this.hospitalNameInput.locator("option").allTextContents();
    const match = options.find((o) => o.trim() === hospitalName.trim());
    if (match) {
      await this.hospitalNameInput.selectOption({ label: hospitalName });
    } else {
      await this.hospitalNameInput.selectOption("__other__");
      await this.hospitalOtherInput.fill(hospitalName);
    }
  }

  async fillExaminerDetails(data: {
    fullName: string;
    nationalId: string;
    email: string;
    phone: string;
  }) {
    await this.selectRole("examiner");
    await this.fullNameInput.fill(data.fullName);
    await this.nationalIdInput.fill(data.nationalId);
    await this.emailInput.fill(data.email);
    const normalized = data.phone.replace(/^\+966/, "");
    await this.phoneInput.fill(normalized);
  }

  async fillOtp(code: string) {
    for (let i = 0; i < code.length && i < 4; i++) {
      await this.otpInputs.nth(i).fill(code[i]);
    }
  }

  async expectErrorVisible(text?: string | RegExp) {
    await expect(this.errorMessage).toBeVisible();
    if (text) {
      await expect(this.errorMessage).toContainText(text);
    }
  }

  /**
   * Stubs the backend `/api/auth/send-otp` endpoint so that registration
   * attempts return a well-defined HTTP error without depending on real
   * Firestore seed data or the Authentica SMS round-trip.
   *
   * Use this in duplicate-detection tests to drive a deterministic 409.
   */
  async stubSendOtpError(opts: { status?: number; detail?: string } = {}) {
    const status = opts.status ?? 409;
    const detail =
      opts.detail ?? "An account already exists for this number. Please login.";
    await this.page.route("**/api/auth/send-otp", async (route) => {
      await route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify({ detail }),
      });
    });
  }

  /**
   * Full happy-path stub for the claimant registration flow. All three
   * backend endpoints (`send-otp`, `verify-otp`, `signup`) return 200 with
   * well-formed bodies. The signup response carries a real Firebase custom
   * token minted for the seeded claimant uid, so `signInWithCustomToken`
   * succeeds and the app routes to /dashboard/claimant → /claimant/claims.
   */
  async stubHappyClaimantSignup(): Promise<void> {
    const token = await mintCustomToken(CLAIMANT_UID, { role: "claimant" });
    await this.page.route("**/api/auth/send-otp", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, message: "OTP sent (stub)" }),
      });
    });
    await this.page.route("**/api/auth/verify-otp", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ verified: true, is_new_user: true }),
      });
    });
    await this.page.route("**/api/auth/signup", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          token,
          role: "claimant",
          uid: CLAIMANT_UID,
        }),
      });
    });
  }

  /**
   * Happy-path stub for the examiner registration request flow. No token is
   * returned — the UI renders the "Request submitted" success screen after
   * the `/api/auth/examiner/register` call resolves.
   */
  async stubHappyExaminerRegister(): Promise<void> {
    await this.page.route("**/api/auth/send-otp", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, message: "OTP sent (stub)" }),
      });
    });
    await this.page.route("**/api/auth/verify-otp", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ verified: true, is_new_user: true }),
      });
    });
    await this.page.route("**/api/auth/examiner/register", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message:
            "Registration request submitted. You will receive an email once reviewed.",
        }),
      });
    });
  }
}
