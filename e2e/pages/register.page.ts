import { type Page, type Locator, expect } from "@playwright/test";

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
    this.hospitalNameInput = page.getByPlaceholder("e.g. King Fahad Medical City");
    this.phoneInput = page.getByPlaceholder("5XXXXXXXX");
    this.continueButton = page.getByRole("button", { name: "Continue" });
    this.otpInputs = page.locator('input[inputmode="numeric"]');
    this.createAccountButton = page.getByRole("button", { name: "Create Account" });
    this.submitRequestButton = page.getByRole("button", { name: "Submit Request" });
    this.errorMessage = page.locator('[style*="color: #dc2626"]').first();
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
    await this.hospitalNameInput.fill(data.hospitalName);
    const normalized = data.phone.replace(/^\+966/, "");
    await this.phoneInput.fill(normalized);
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

  async expectErrorVisible(text?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (text) {
      await expect(this.errorMessage).toContainText(text);
    }
  }
}
