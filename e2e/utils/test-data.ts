import crypto from "crypto";

/**
 * Deterministic test data generators.
 * All functions produce unique-per-run values to avoid collisions in parallel tests.
 */

function uid(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(4).toString("hex")}`;
}

export function uniqueClaimData(overrides: Partial<ClaimSeed> = {}): ClaimSeed {
  const id = uid("claim");
  return {
    patientFName: overrides.patientFName ?? `TestFirst-${id.slice(-6)}`,
    patientLName: overrides.patientLName ?? `TestLast-${id.slice(-6)}`,
    patientDOB: overrides.patientDOB ?? "1990-01-15",
    policyName: overrides.policyName ?? "Gold Health Plan",
    treatmentType: overrides.treatmentType ?? "Diagnostic Imaging",
    medicalReport: overrides.medicalReport ?? "https://res.cloudinary.com/test/raw/upload/v1/test-report.pdf",
    supportingDocuments: overrides.supportingDocuments ?? null,
  };
}

export interface ClaimSeed {
  patientFName: string;
  patientLName: string;
  patientDOB: string;
  policyName: string;
  treatmentType: string;
  medicalReport: string;
  supportingDocuments: string | null;
}

export interface TestUser {
  role: "admin" | "claimant" | "examiner";
  email?: string;
  password?: string;
  phone?: string;
  fullName: string;
}

export const SEED_USERS: Record<string, TestUser> = {
  admin: {
    role: "admin",
    email: "admin@watheeq.ai",
    password: "Admin@1234",
    fullName: "Watheeq Admin",
  },
  claimant: {
    role: "claimant",
    phone: "+966500000001",
    fullName: "Test Claimant",
  },
  examiner: {
    role: "examiner",
    phone: "+966500000002",
    fullName: "Test Examiner",
  },
};

export const CLAIM_STATUSES = [
  "submitted",
  "under review",
  "approved",
  "rejected",
  "cancelled",
] as const;

export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

/**
 * PDF fixture path for upload tests.
 * Place a small valid PDF at e2e/data/fixtures/sample.pdf
 */
export const FIXTURE_PDF_PATH = "data/fixtures/sample.pdf";
export const FIXTURE_INVALID_FILE_PATH = "data/fixtures/invalid.txt";
