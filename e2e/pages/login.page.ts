import { type Page, type Locator, expect } from "@playwright/test";

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
    this.errorMessage = page.locator('[style*="color: #dc2626"]').first();
    this.adminLoginLink = page.getByRole("link", { name: "Admin login" });
    this.createAccountLink = page.getByRole("link", { name: "Create one" });
    this.editPhoneButton = page.getByRole("button", { name: "Edit" });
    this.resendButton = page.getByText("Resend");
    this.verificationCodeLabel = page.getByText("Verification code");
  }

  async goto() {
    await this.page.goto("/login");
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
