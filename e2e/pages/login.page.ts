import { type Page, type Locator, expect } from "@playwright/test";
import { mintCustomToken } from "../utils/test-seed";

/**
 * Page object for /login — phone + OTP login for claimants and examiners.
 */
export class LoginPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly phoneInput: Locator;
  readonly continueButton: Locator;
  readonly otpInputs: Locator;
  readonly signInButton: Locator;
  readonly errorMessage: Locator;
  readonly adminLoginLink: Locator;
  readonly createAccountLink: Locator;
  readonly editPhoneButton: Locator;
  readonly resendButton: Locator;
  readonly verificationCodeLabel: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Sign in" });
    this.phoneInput = page.getByPlaceholder("5XXXXXXXX");
    this.continueButton = page.getByRole("button", { name: "Continue" });
    this.otpInputs = page.locator('input[inputmode="numeric"]');
    this.signInButton = page.getByRole("button", { name: "Sign in" });
    // The error banner is a framer-motion <motion.div> with the distinctive
    // className combo "rounded-xl text-sm gap-2.5" and an inner warning SVG.
    // framer-motion rewrites the `style` attribute on mount, so matching by
    // inline-style colour is unreliable; the className combination is stable.
    // We fall back to the style-based match for non-motion error surfaces.
    this.errorMessage = page
      .locator(
        '[class*="rounded-xl"][class*="gap-2.5"][class*="text-sm"]:has(svg)',
      )
      .or(
        page.locator('[style*="color:#dc2626"], [style*="color: #dc2626"]'),
      )
      .first();
    this.adminLoginLink = page.getByRole("link", { name: "Admin login" });
    this.createAccountLink = page.getByRole("link", { name: "Create one" });
    this.editPhoneButton = page.getByRole("button", { name: "Edit" });
    this.resendButton = page.getByText("Resend");
    this.verificationCodeLabel = page.getByText("Verification code");
  }

  async goto() {
    await this.page.goto("/login");
  }

  /**
   * Stubs the backend OTP endpoints at the network layer so front-end flows
   * that only need the OTP UI to appear can run without a real user seeded in
   * Firestore or a live Authentica SMS API.
   *
   * - `send-otp` returns 200 so the `otpSent` state flips and the OTP inputs
   *   render.
   * - `verify-otp` returns 400 by default so "invalid OTP" assertions work
   *   without depending on backend behaviour.
   *
   * Tests that need the real backend (e.g. "unregistered phone shows error")
   * should NOT call this helper.
   */
  async stubOtpEndpoints(
    opts: { verifyShouldSucceed?: boolean } = {},
  ): Promise<void> {
    await this.page.route("**/api/auth/send-otp", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, message: "OTP sent (stub)" }),
      });
    });

    if (opts.verifyShouldSucceed) {
      await this.page.route("**/api/auth/verify-otp", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ token: "stub-token", uid: "stub-uid" }),
        });
      });
    } else {
      await this.page.route("**/api/auth/verify-otp", async (route) => {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Invalid OTP (stub)" }),
        });
      });
    }
  }

  /**
   * Full happy-path stub for phone+OTP login. send-otp returns success and
   * verify-otp returns a freshly minted Firebase custom token for `uid`, so
   * the client's `signInWithCustomToken` handshake succeeds for real.
   *
   * Use this when you need the authenticated redirect to complete (e.g.
   * TC-S1-022 / TC-S1-023) without depending on a live Authentica SMS
   * round-trip or a backend OTP bypass.
   */
  async stubOtpEndpointsForUid(
    uid: string,
    role: "claimant" | "examiner" = "claimant",
  ): Promise<void> {
    const token = await mintCustomToken(uid, { role });
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
        body: JSON.stringify({ verified: true, token, role, uid }),
      });
    });
  }

  async fillPhone(phone: string) {
    const normalized = phone.replace(/^\+966/, "");
    await this.phoneInput.fill(normalized);
  }

  async sendOtp(phone: string) {
    await this.fillPhone(phone);
    await this.continueButton.click();
  }

  async fillOtp(code: string) {
    for (let i = 0; i < code.length && i < 4; i++) {
      await this.otpInputs.nth(i).fill(code[i]);
    }
  }

  async verifyOtp(code: string) {
    await this.fillOtp(code);
    await this.signInButton.click();
  }

  async expectOtpFieldVisible() {
    await expect(this.verificationCodeLabel).toBeVisible();
    await expect(this.otpInputs.first()).toBeVisible();
  }

  async expectErrorVisible(text?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (text) {
      await expect(this.errorMessage).toContainText(text);
    }
  }
}
