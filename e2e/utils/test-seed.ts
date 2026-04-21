/**
 * Firebase-Admin-backed test seeding.
 *
 * Provides deterministic Firestore + Firebase Auth fixtures so that E2E
 * tests don't depend on live Authentica SMS or prior manual seeding.
 *
 * Exports:
 *   - ensureTestUsers()       → creates/refreshes claimant + examiner users
 *   - ensurePendingRequest()  → creates/refreshes a pending examiner request
 *   - ensureSubmittedClaim()  → creates/refreshes a submitted claim owned by
 *                               the seeded claimant
 *   - mintCustomToken(uid)    → returns a Firebase custom token for the uid
 *
 * Credentials: read from `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`,
 * `FIREBASE_PRIVATE_KEY` (in `e2e/.env.test`).
 */
import * as admin from "firebase-admin";
import { getTestEnv } from "./env";

export const CLAIMANT_UID = "phone_966500000001";
export const EXAMINER_UID = "phone_966500000002";
export const EXAMINER2_UID = "phone_966500000003";

export const SEEDED_CLAIMANT = {
  uid: CLAIMANT_UID,
  phone: "+966500000001",
  fullName: "E2E Claimant",
  nationalId: "1000000001",
  email: "claimant-e2e@example.com",
  hospitalName: "King Fahad Medical City",
  role: "claimant" as const,
  status: "active" as const,
};

export const SEEDED_EXAMINER = {
  uid: EXAMINER_UID,
  phone: "+966500000002",
  fullName: "E2E Examiner",
  nationalId: "2000000002",
  email: "examiner-e2e@example.com",
  role: "examiner" as const,
  status: "active" as const,
};

export const SEEDED_EXAMINER_2 = {
  uid: EXAMINER2_UID,
  phone: "+966500000003",
  fullName: "E2E Examiner 2",
  nationalId: "2000000003",
  email: "examiner2-e2e@example.com",
  role: "examiner" as const,
  status: "active" as const,
};

let adminApp: admin.app.App | null = null;

export function getAdminApp(): admin.app.App {
  if (adminApp) return adminApp;
  const env = getTestEnv();

  if (admin.apps.length > 0) {
    adminApp = admin.app();
    return adminApp;
  }

  const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
  adminApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
    projectId: env.FIREBASE_PROJECT_ID,
  });
  return adminApp;
}

/**
 * Ensures the two (or three) seeded test users exist in both Firebase Auth
 * and the Firestore `users` collection. Idempotent: safe to call many times.
 *
 * We keep the records stable so that any pre-existing test data (e.g., claims
 * owned by `CLAIMANT_UID`) is not orphaned by refreshing the user.
 */
export async function ensureTestUsers(): Promise<void> {
  const app = getAdminApp();
  const auth = app.auth();
  const db = app.firestore();

  for (const user of [SEEDED_CLAIMANT, SEEDED_EXAMINER, SEEDED_EXAMINER_2]) {
    // Firebase Auth — create or update the Auth user record so we can mint
    // custom tokens against it. `updateUser` lets us set the displayName /
    // email without requiring a password (phone users don't have one).
    try {
      await auth.getUser(user.uid);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/user-not-found") {
        try {
          await auth.createUser({
            uid: user.uid,
            displayName: user.fullName,
            email: user.email,
            phoneNumber: user.phone,
          });
        } catch (createErr: unknown) {
          const createCode = (createErr as { code?: string }).code;
          // Firebase's signInWithCustomToken (used by parallel setup steps)
          // can auto-create the Auth record between our getUser/createUser
          // calls. Treat "already exists" as success.
          if (createCode !== "auth/uid-already-exists") {
            throw createErr;
          }
        }
      } else {
        throw err;
      }
    }

    const profile: Record<string, unknown> = {
      uid: user.uid,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      nationalId: user.nationalId,
      email: user.email,
      createdAt: new Date().toISOString(),
    };
    if ("hospitalName" in user && user.hospitalName) {
      profile.hospitalName = user.hospitalName;
    }
    await db.collection("users").doc(user.uid).set(profile, { merge: true });
  }
}

/**
 * Ensures at least `count` pending examiner-registration requests exist so
 * approve/reject tests across multiple workers can each operate on a
 * distinct record without racing. Clears any previous test-seeded pending
 * records first (identified by their email suffix) to avoid accumulation.
 */
export async function ensurePendingExaminerRequests(
  count = 6,
): Promise<string[]> {
  const app = getAdminApp();
  const db = app.firestore();

  const prior = await db.collection("examiner_requests").get();
  for (const doc of prior.docs) {
    const email = doc.data()?.email ?? "";
    if (typeof email === "string" && email.endsWith("-e2e@example.com")) {
      await doc.ref.delete();
    }
  }

  const ids: string[] = [];
  const now = new Date().toISOString();
  for (let i = 0; i < count; i++) {
    const ref = db.collection("examiner_requests").doc();
    await ref.set({
      id: ref.id,
      phone: `+9665000999${String(i).padStart(2, "0")}`,
      full_name: `Pending Examiner E2E ${i + 1}`,
      national_id: `30000000${String(i).padStart(2, "0")}`,
      email: `pending-${i}-e2e@example.com`,
      status: "pending",
      submittedAt: now,
      submitted_at: now,
    });
    ids.push(ref.id);
  }
  return ids;
}

/**
 * Ensures at least one submitted, unassigned claim exists so examiner-side
 * tests (US-15/US-16/US-17) have something to pick. The claim is owned by
 * the seeded claimant so claimant-side list tests also see it.
 */
export async function ensureSubmittedClaim(): Promise<string> {
  const app = getAdminApp();
  const db = app.firestore();

  const existing = await db
    .collection("claims")
    .where("claimantID", "==", CLAIMANT_UID)
    .where("status", "==", "submitted")
    .where("examinerID", "==", "")
    .limit(1)
    .get();
  if (!existing.empty) {
    return existing.docs[0].id;
  }

  const ref = db.collection("claims").doc();
  await ref.set({
    claimId: ref.id,
    claimantID: CLAIMANT_UID,
    examinerID: "",
    patientFName: "Seeded",
    patientLName: "Patient",
    patientDOB: "1990-01-01",
    policyName: "Gold Health Plan",
    treatmentType: "Diagnostic Imaging",
    medicalReport: "https://example.com/seeded-medical-report.pdf",
    supportingDocuments: "",
    examinerResponse: "",
    status: "submitted",
    submittingTime: new Date(),
  });
  return ref.id;
}

const FIXED_CLAIM_BASE = {
  patientFName: "Seeded",
  patientLName: "Patient",
  patientDOB: "1990-01-01",
  policyName: "Gold Health Plan",
  treatmentType: "Diagnostic Imaging",
  medicalReport: "https://example.com/seeded-medical-report.pdf",
  supportingDocuments: "",
  examinerResponse: "",
};

/**
 * Upserts claims with fixed document IDs that Sprint-2 tests reference
 * directly (e.g. `submitted-claim-id`, `under-review-claim-id`). Each claim
 * is (re)set to a well-defined state on every setup so tests that mutate
 * state (cancel, pick, decide) can run deterministically every time.
 */
export async function ensureFixtureClaims(): Promise<void> {
  const app = getAdminApp();
  const db = app.firestore();

  const now = new Date();
  const claims = [
    {
      id: "submitted-claim-id",
      status: "submitted",
      claimantID: CLAIMANT_UID,
      examinerID: "",
    },
    {
      id: "under-review-claim-id",
      status: "under review",
      claimantID: CLAIMANT_UID,
      examinerID: EXAMINER_UID,
    },
    {
      id: "approved-claim-id",
      status: "approved",
      claimantID: CLAIMANT_UID,
      examinerID: EXAMINER_UID,
      examinerResponse: "Approved — documentation complete.",
    },
    {
      id: "rejected-claim-id",
      status: "rejected",
      claimantID: CLAIMANT_UID,
      examinerID: EXAMINER_UID,
      examinerResponse: "Rejected — insufficient documentation.",
    },
    {
      id: "cancelled-claim-id",
      status: "cancelled",
      claimantID: CLAIMANT_UID,
      examinerID: "",
    },
    {
      id: "test-claim-id",
      status: "submitted",
      claimantID: CLAIMANT_UID,
      examinerID: "",
    },
    {
      id: "other-examiner-claim-id",
      status: "under review",
      claimantID: CLAIMANT_UID,
      // Picked by examiner-2 so examiner-1's US-17 tests can verify they're
      // locked out.
      examinerID: EXAMINER2_UID,
    },
    {
      id: "decide-approve-claim-id",
      status: "under review",
      claimantID: CLAIMANT_UID,
      examinerID: EXAMINER_UID,
    },
    {
      id: "decide-reject-claim-id",
      status: "under review",
      claimantID: CLAIMANT_UID,
      examinerID: EXAMINER_UID,
    },
    {
      id: "dismiss-cancel-claim-id",
      status: "submitted",
      claimantID: CLAIMANT_UID,
      examinerID: "",
    },
  ];

  for (const c of claims) {
    await db
      .collection("claims")
      .doc(c.id)
      .set({
        ...FIXED_CLAIM_BASE,
        claimId: c.id,
        claimantID: c.claimantID,
        examinerID: c.examinerID,
        status: c.status,
        examinerResponse:
          "examinerResponse" in c && c.examinerResponse
            ? c.examinerResponse
            : "",
        submittingTime: now,
      });
  }
}

/**
 * Ensures at least one policy plan exists (needed for the claim-submission
 * form's dropdown). Idempotent.
 */
export async function ensurePolicyPlan(): Promise<string> {
  const app = getAdminApp();
  const db = app.firestore();

  // Look for the *specific* seeded policy name rather than "any policy" —
  // TC-S1-037 creates timestamped "E2E-Policy-<ts>" entries that should not
  // be reused as the dropdown fixture for claim-submission tests.
  const existing = await db
    .collection("policies")
    .where("policy_name", "==", "Gold Health Plan")
    .limit(1)
    .get();
  if (!existing.empty) return existing.docs[0].id;

  const ref = db.collection("policies").doc();
  await ref.set({
    id: ref.id,
    policy_name: "Gold Health Plan",
    file_url: "https://example.com/seeded-policy.pdf",
    uploadedAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function mintCustomToken(
  uid: string,
  claims: Record<string, unknown> = {},
): Promise<string> {
  const app = getAdminApp();
  return app.auth().createCustomToken(uid, claims);
}
