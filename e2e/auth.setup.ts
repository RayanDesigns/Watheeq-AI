import { test as setup, expect, Page } from "@playwright/test";
import fs from "fs";
import { getTestEnv, STORAGE_STATE_DIR, storageStatePath } from "./utils/env";
import {
  CLAIMANT_UID,
  EXAMINER_UID,
  ensureFixtureClaims,
  ensurePendingExaminerRequests,
  ensurePolicyPlan,
  ensureSubmittedClaim,
  ensureTestUsers,
  mintCustomToken,
} from "./utils/test-seed";

/**
 * Runs after webServer(s) are up. Seeds Firestore with stable test fixtures
 * and captures authenticated storage states for admin, claimant, and
 * examiner so downstream projects can skip login entirely.
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
    // Firebase Auth persists the signed-in user in IndexedDB. Since Playwright
    // 1.51, storageState() can capture IDB — essential for replaying the
    // session without rate-limiting Firebase in every admin test.
    await page.context().storageState({
      path: adminStatePath,
      indexedDB: true,
    });
  });

  setup("seed Firestore fixtures", async () => {
    // Seed user accounts + supporting entities the tests depend on.
    // Split from the storageState-capture steps so partial failures surface
    // clearly in Playwright's reporter.
    await ensureTestUsers();
    await ensurePolicyPlan();
    await ensurePendingExaminerRequests(6);
    await ensureSubmittedClaim();
    await ensureFixtureClaims();
  });

  setup("claimant storage state", async ({ page }) => {
    await signInWithCustomTokenAndSave(page, CLAIMANT_UID, "claimant");
  });

  setup("examiner storage state", async ({ page }) => {
    await signInWithCustomTokenAndSave(page, EXAMINER_UID, "examiner");
  });
});

/**
 * Shared helper: mints a Firebase custom token for the target uid, hands it
 * to the frontend's Firebase Web SDK (already loaded by the /login page),
 * and captures the resulting IndexedDB-backed auth state to disk.
 *
 * The approach mirrors how a real user would be signed in by the backend's
 * `verify-otp` endpoint — the only difference is the token source.
 */
async function signInWithCustomTokenAndSave(
  page: Page,
  uid: string,
  role: "claimant" | "examiner",
): Promise<void> {
  const env = getTestEnv();
  fs.mkdirSync(STORAGE_STATE_DIR, { recursive: true });

  const statePath = storageStatePath(role);
  const skipRefresh =
    fs.existsSync(statePath) &&
    Date.now() - fs.statSync(statePath).mtimeMs < 30 * 60 * 1000;
  if (skipRefresh) return;

  const token = await mintCustomToken(uid, { role });

  // Visit /login so the page has the Firebase JS SDK initialised. We
  // sign in via page.evaluate using the same modular SDK the app uses.
  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  await page.evaluate(
    async ({ token, apiKey, authDomain, projectId }) => {
      const [{ initializeApp, getApps }, { getAuth, signInWithCustomToken }] =
        await Promise.all([
          import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"),
          import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"),
        ]);

      const app = getApps().length
        ? getApps()[0]
        : initializeApp({ apiKey, authDomain, projectId });
      const auth = getAuth(app);
      await signInWithCustomToken(auth, token);
    },
    {
      token,
      apiKey: env.FIREBASE_API_KEY,
      authDomain: env.FIREBASE_AUTH_DOMAIN,
      projectId: env.FIREBASE_PROJECT_ID,
    },
  );

  // Confirm the session landed in IDB by reloading and waiting for the
  // role-appropriate dashboard to render without redirect.
  const expectedPath =
    role === "claimant" ? "/claimant/claims" : "/examiner/claims";
  await page.goto(expectedPath);
  await page.waitForURL(new RegExp(`${expectedPath}(\\?|$)`), {
    timeout: 30_000,
  });

  await page.context().storageState({ path: statePath, indexedDB: true });
}
