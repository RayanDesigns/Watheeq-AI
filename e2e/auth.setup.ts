import { test as setup, expect } from "@playwright/test";
import fs from "fs";
import { getTestEnv, STORAGE_STATE_DIR, storageStatePath } from "./utils/env";

/**
 * Runs after webServer(s) are up. Creates `.auth/admin.json` for admin tests.
 */
setup.describe("Auth setup", () => {
  setup("admin storage state", async ({ page, request }) => {
    const env = getTestEnv();
    fs.mkdirSync(STORAGE_STATE_DIR, { recursive: true });

    const health = await request.get(`${env.API_URL}/`);
    expect(health.ok(), `Backend not ready at ${env.API_URL}`).toBeTruthy();

    const adminStatePath = storageStatePath("admin");
    const skipRefresh =
      fs.existsSync(adminStatePath) &&
      Date.now() - fs.statSync(adminStatePath).mtimeMs < 30 * 60 * 1000;

    if (skipRefresh) {
      return;
    }

    await page.goto("/admin-login");
    await page.getByPlaceholder("admin@watheeq.ai").fill(env.ADMIN_EMAIL);
    await page.getByPlaceholder("Enter password").fill(env.ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/dashboard/admin**", { timeout: 30_000 });
    await page.context().storageState({ path: adminStatePath });
  });
});
