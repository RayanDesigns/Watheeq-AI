import { defineConfig, devices } from "@playwright/test";
import path from "path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const API_URL = process.env.API_URL ?? "http://localhost:8000";
const CI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",

  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 2 : undefined,

  timeout: 60_000,
  expect: { timeout: 10_000 },

  reporter: CI
    ? [
        ["github"],
        ["html", { open: "never", outputFolder: "./playwright-report" }],
        ["json", { outputFile: "./test-results/results.json" }],
      ]
    : [["html", { open: "on-failure", outputFolder: "./playwright-report" }]],

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    locale: "en-US",
    timezoneId: "Asia/Riyadh",
  },

  globalTeardown: path.resolve(__dirname, "global-teardown.ts"),

  projects: [
    /* ── Setup ────────────────────────────────────────────────── */
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },

    /* ── Sprint-scoped projects ───────────────────────────────── */
    {
      name: "sprint1",
      testDir: "./tests/sprint1",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
    {
      name: "sprint2",
      testDir: "./tests/sprint2",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
    {
      name: "sprint3",
      testDir: "./tests/sprint3",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
    {
      name: "sprint4",
      testDir: "./tests/sprint4",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
    {
      name: "cross-sprint",
      testDir: "./tests/cross-sprint",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },

    /* ── Browser matrix (full regression) ─────────────────────── */
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      dependencies: ["setup"],
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
      dependencies: ["setup"],
    },

    /* ── Tier-scoped projects ─────────────────────────────────── */
    {
      name: "smoke",
      grep: /@smoke/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
    {
      name: "release",
      grep: /@release/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],

  webServer: [
    {
      command: "npm run dev",
      cwd: path.resolve(__dirname, "../frontend"),
      url: BASE_URL,
      reuseExistingServer: !CI,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_API_URL: API_URL,
      },
    },
    {
      command:
        "uvicorn app.main:app --host 0.0.0.0 --port 8000",
      cwd: path.resolve(__dirname, "../backend"),
      url: `${API_URL}/`,
      reuseExistingServer: !CI,
      timeout: 60_000,
    },
  ],
});
