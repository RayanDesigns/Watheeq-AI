import path from "path";
import fs from "fs";

export interface TestEnv {
  BASE_URL: string;
  API_URL: string;
  FIREBASE_API_KEY: string;
  FIREBASE_AUTH_DOMAIN: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_PRIVATE_KEY: string;
  FIREBASE_CLIENT_EMAIL: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
  TEST_PHONE_CLAIMANT: string;
  TEST_PHONE_EXAMINER: string;
  TEST_PHONE_EXAMINER_2: string;
  TEST_OTP_CODE: string;
}

let cachedEnv: TestEnv | null = null;

export function getTestEnv(): TestEnv {
  if (cachedEnv) return cachedEnv;

  const envPath = path.resolve(__dirname, "../.env.test");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }

  cachedEnv = {
    BASE_URL: process.env.BASE_URL ?? "http://localhost:3000",
    API_URL: process.env.API_URL ?? "http://localhost:8000",
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY ?? "",
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN ?? "",
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ?? "",
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ?? "",
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ?? "",
    ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? "admin@watheeq.ai",
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? "Admin@1234",
    TEST_PHONE_CLAIMANT: process.env.TEST_PHONE_CLAIMANT ?? "+966500000001",
    TEST_PHONE_EXAMINER: process.env.TEST_PHONE_EXAMINER ?? "+966500000002",
    TEST_PHONE_EXAMINER_2: process.env.TEST_PHONE_EXAMINER_2 ?? "+966500000003",
    TEST_OTP_CODE: process.env.TEST_OTP_CODE ?? "1234",
  };

  return cachedEnv;
}

export const STORAGE_STATE_DIR = path.resolve(__dirname, "../.auth");

export function storageStatePath(role: "admin" | "claimant" | "examiner"): string {
  return path.join(STORAGE_STATE_DIR, `${role}.json`);
}
