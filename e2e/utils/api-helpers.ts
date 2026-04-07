import { APIRequestContext, expect } from "@playwright/test";
import { getTestEnv } from "./env";

/**
 * Lightweight wrapper for FastAPI backend calls during test setup/teardown.
 * Uses Playwright's built-in APIRequestContext for connection pooling.
 */
export class ApiHelper {
  constructor(
    private request: APIRequestContext,
    private token: string,
  ) {}

  private get baseUrl(): string {
    return getTestEnv().API_URL;
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };
  }

  async getMe() {
    const res = await this.request.get(`${this.baseUrl}/api/auth/me`, {
      headers: this.headers(),
    });
    expect(res.ok()).toBeTruthy();
    return res.json();
  }

  async listClaims() {
    const res = await this.request.get(`${this.baseUrl}/api/claims`, {
      headers: this.headers(),
    });
    expect(res.ok()).toBeTruthy();
    return res.json();
  }

  async getClaim(claimId: string) {
    const res = await this.request.get(`${this.baseUrl}/api/claims/${claimId}`, {
      headers: this.headers(),
    });
    return { status: res.status(), data: await res.json() };
  }

  async submitClaim(payload: {
    patientFName: string;
    patientLName: string;
    patientDOB: string;
    policyName: string;
    treatmentType: string;
    medicalReport: string;
    supportingDocuments?: string | null;
  }) {
    const res = await this.request.post(`${this.baseUrl}/api/claims`, {
      headers: this.headers(),
      data: payload,
    });
    expect(res.ok()).toBeTruthy();
    return res.json();
  }

  async cancelClaim(claimId: string) {
    const res = await this.request.patch(`${this.baseUrl}/api/claims/${claimId}/cancel`, {
      headers: this.headers(),
    });
    return { status: res.status(), data: await res.json() };
  }

  async listExaminerClaims() {
    const res = await this.request.get(`${this.baseUrl}/api/examiner/claims`, {
      headers: this.headers(),
    });
    expect(res.ok()).toBeTruthy();
    return res.json();
  }

  async pickClaim(claimId: string) {
    const res = await this.request.post(`${this.baseUrl}/api/examiner/claims/${claimId}/pick`, {
      headers: this.headers(),
    });
    return { status: res.status(), data: await res.json() };
  }

  async decideClaim(claimId: string, decision: "approved" | "rejected") {
    const res = await this.request.patch(`${this.baseUrl}/api/examiner/claims/${claimId}/decide`, {
      headers: this.headers(),
      data: { decision },
    });
    return { status: res.status(), data: await res.json() };
  }

  async listPolicies() {
    const res = await this.request.get(`${this.baseUrl}/api/policies`, {
      headers: this.headers(),
    });
    expect(res.ok()).toBeTruthy();
    return res.json();
  }

  async listExaminerRequests(status?: string) {
    const qs = status ? `?status=${status}` : "";
    const res = await this.request.get(`${this.baseUrl}/api/admin/examiner-requests${qs}`, {
      headers: this.headers(),
    });
    expect(res.ok()).toBeTruthy();
    return res.json();
  }

  async approveExaminerRequest(requestId: string) {
    const res = await this.request.post(`${this.baseUrl}/api/admin/examiner-requests/${requestId}/approve`, {
      headers: this.headers(),
    });
    return { status: res.status(), data: await res.json() };
  }

  async rejectExaminerRequest(requestId: string) {
    const res = await this.request.post(`${this.baseUrl}/api/admin/examiner-requests/${requestId}/reject`, {
      headers: this.headers(),
    });
    return { status: res.status(), data: await res.json() };
  }

  async healthCheck() {
    const res = await this.request.get(`${this.baseUrl}/`);
    return { status: res.status(), data: await res.json() };
  }
}
