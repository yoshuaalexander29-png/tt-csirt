/**
 * @fileoverview Publishing Control Plane Client API
 * Encapsulates network operations, error handling, and session authentication.
 */

import type {
  AdvisoryDocument,
  PublishedAdvisoryDocument,
  ValidationResult,
  AdvisoryVersion,
  AdvisoryAuditEvent,
  AdvisoryMediaAsset,
} from '@ttcsirt/canonical-types';
import type { StaffUser, StaffRole } from '@ttcsirt/publishing-api';

export interface DevIdentityOption {
  key: string;
  id: string;
  displayName: string;
  email: string;
  roles: StaffRole[];
  department: string;
}

export class PublishingApiClient {
  private static getHeaders(user?: StaffUser | null): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (user) {
      headers['X-Dev-User'] = user.id;
    }
    return headers;
  }

  // --- Authentication Operations ---

  static async getAuthStatus(): Promise<{ devAuthEnabled: boolean; isAuthenticated: boolean; user: StaffUser | null; environment: string }> {
    const res = await fetch('/api/publishing/auth/status', { credentials: 'same-origin' });
    if (!res.ok) {
      return { devAuthEnabled: false, isAuthenticated: false, user: null, environment: 'production-restricted' };
    }
    return res.json();
  }

  static async getDevIdentities(): Promise<DevIdentityOption[]> {
    const res = await fetch('/api/publishing/auth/dev-identities', { credentials: 'same-origin' });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return data.identities || [];
  }

  static async devLogin(identityKey: string): Promise<{ success: boolean; user: StaffUser; token?: string }> {
    const res = await fetch('/api/publishing/auth/dev-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ identityKey }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Staff sign-in failed (${res.status})`);
    }
    return data;
  }

  static async logout(): Promise<void> {
    await fetch('/api/publishing/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
    });
  }

  static async getMe(user?: StaffUser | null): Promise<{ user: StaffUser; isDevMode: boolean; devAuthEnabled: boolean }> {
    const res = await fetch('/api/publishing/auth/me', {
      headers: this.getHeaders(user),
      credentials: 'same-origin',
    });
    if (!res.ok) {
      throw new Error(`Authentication check failed (${res.status})`);
    }
    return res.json();
  }

  // --- Editorial & Workflow Operations ---

  static async listAdvisories(status?: string, user?: StaffUser | null): Promise<AdvisoryDocument[]> {
    const url = status && status !== 'all' ? `/api/publishing/advisories?status=${status}` : '/api/publishing/advisories';
    const res = await fetch(url, { headers: this.getHeaders(user), credentials: 'same-origin' });
    if (!res.ok) throw new Error(`Failed to load advisories (${res.status})`);
    const data = await res.json();
    return data.advisories || [];
  }

  static async getAdvisory(id: string, user?: StaffUser | null): Promise<AdvisoryDocument> {
    const res = await fetch(`/api/publishing/advisories/${id}`, { headers: this.getHeaders(user), credentials: 'same-origin' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to fetch advisory ${id}`);
    }
    const data = await res.json();
    return data.advisory;
  }

  static async createDraft(payload: Partial<AdvisoryDocument>, user?: StaffUser | null): Promise<AdvisoryDocument> {
    const res = await fetch('/api/publishing/advisories', {
      method: 'POST',
      headers: this.getHeaders(user),
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create draft');
    return data.advisory;
  }

  static async loadTestSample(user?: StaffUser | null): Promise<AdvisoryDocument> {
    const res = await fetch('/api/publishing/test-fixtures/sample-advisory', {
      method: 'POST',
      headers: this.getHeaders(user),
      credentials: 'same-origin',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Could not open the prepared advisory.');
    return data.advisory;
  }

  static async deleteAdvisory(id: string, user?: StaffUser | null): Promise<void> {
    const res = await fetch(`/api/publishing/advisories/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(user),
      credentials: 'same-origin',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Could not delete advisory');
  }

  static async updateDraft(
    id: string,
    updates: Partial<AdvisoryDocument>,
    expectedVersion: number,
    user?: StaffUser | null,
  ): Promise<AdvisoryDocument> {
    const res = await fetch(`/api/publishing/advisories/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(user),
      credentials: 'same-origin',
      body: JSON.stringify({ ...updates, expectedVersion }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update draft');
    return data.advisory;
  }

  static async validateAdvisory(
    id: string,
    payload?: Partial<AdvisoryDocument>,
    user?: StaffUser | null,
  ): Promise<ValidationResult> {
    const res = await fetch(`/api/publishing/advisories/${id}/validate`, {
      method: 'POST',
      headers: this.getHeaders(user),
      credentials: 'same-origin',
      body: JSON.stringify(payload || {}),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to validate advisory');
    return data.validation;
  }

  static async submitForReview(id: string, user?: StaffUser | null): Promise<AdvisoryDocument> {
    const res = await fetch(`/api/publishing/advisories/${id}/submit-review`, {
      method: 'POST',
      headers: this.getHeaders(user),
      credentials: 'same-origin',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to submit advisory for review');
    return data.advisory;
  }

  static async requestChanges(id: string, notes: string, user?: StaffUser | null): Promise<AdvisoryDocument> {
    const res = await fetch(`/api/publishing/advisories/${id}/request-changes`, {
      method: 'POST',
      headers: this.getHeaders(user),
      credentials: 'same-origin',
      body: JSON.stringify({ notes }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to request changes');
    return data.advisory;
  }

  static async approve(id: string, user?: StaffUser | null): Promise<AdvisoryDocument> {
    const res = await fetch(`/api/publishing/advisories/${id}/approve`, {
      method: 'POST',
      headers: this.getHeaders(user),
      credentials: 'same-origin',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Approval failed');
    return data.advisory;
  }

  static async publish(
    id: string,
    options?: { readingTimeMinutes?: number; idempotencyKey?: string },
    user?: StaffUser | null,
  ): Promise<{ advisory: AdvisoryDocument; publishedAdvisory: PublishedAdvisoryDocument; isPubliclyAvailable: boolean }> {
    const res = await fetch(`/api/publishing/advisories/${id}/publish`, {
      method: 'POST',
      headers: this.getHeaders(user),
      credentials: 'same-origin',
      body: JSON.stringify(options || {}),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Publication failed');
    return data;
  }

  static async withdraw(id: string, withdrawalNotice: string, user?: StaffUser | null): Promise<AdvisoryDocument> {
    const res = await fetch(`/api/publishing/advisories/${id}/withdraw`, {
      method: 'POST',
      headers: this.getHeaders(user),
      credentials: 'same-origin',
      body: JSON.stringify({ withdrawalNotice }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Withdrawal failed');
    return data.advisory;
  }

  static async supersede(id: string, supersededBy: string, user?: StaffUser | null): Promise<AdvisoryDocument> {
    const res = await fetch(`/api/publishing/advisories/${id}/supersede`, {
      method: 'POST',
      headers: this.getHeaders(user),
      credentials: 'same-origin',
      body: JSON.stringify({ supersededBy }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Supersession failed');
    return data.advisory;
  }

  static async createRevision(id: string, user?: StaffUser | null): Promise<AdvisoryDocument> {
    const res = await fetch(`/api/publishing/advisories/${id}/create-revision`, {
      method: 'POST',
      headers: this.getHeaders(user),
      credentials: 'same-origin',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Create revision failed');
    return data.advisory;
  }

  static async getVersions(id: string, user?: StaffUser | null): Promise<AdvisoryVersion[]> {
    const res = await fetch(`/api/publishing/advisories/${id}/versions`, {
      headers: this.getHeaders(user),
      credentials: 'same-origin',
    });
    const data = await res.json();
    return data.versions || [];
  }

  static async getAuditEvents(id: string, user?: StaffUser | null): Promise<AdvisoryAuditEvent[]> {
    const res = await fetch(`/api/publishing/advisories/${id}/audit`, {
      headers: this.getHeaders(user),
      credentials: 'same-origin',
    });
    const data = await res.json();
    return data.events || [];
  }

  static async getAllAuditEvents(user?: StaffUser | null): Promise<AdvisoryAuditEvent[]> {
    const res = await fetch('/api/publishing/audit', {
      headers: this.getHeaders(user),
      credentials: 'same-origin',
    });
    const data = await res.json();
    return data.events || [];
  }

  static async createPreviewToken(id: string, user?: StaffUser | null): Promise<{ token: string; advisoryId: string }> {
    const res = await fetch(`/api/publishing/advisories/${id}/preview-token`, {
      method: 'POST',
      headers: this.getHeaders(user),
      credentials: 'same-origin',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to issue preview token');
    return data;
  }

  static async getPreviewData(token: string): Promise<{ advisory: AdvisoryDocument; expiresAt: number }> {
    const res = await fetch(`/api/publishing/preview/${token}`, { credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch preview');
    return data;
  }

  static async rollback(
    id: string,
    targetVersionNumber: number,
    rollbackReason: string,
    user?: StaffUser | null,
  ): Promise<AdvisoryDocument> {
    const res = await fetch(`/api/publishing/advisories/${id}/rollback`, {
      method: 'POST',
      headers: this.getHeaders(user),
      credentials: 'same-origin',
      body: JSON.stringify({ targetVersionNumber, rollbackReason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Rollback failed');
    return data.advisory;
  }

  static async uploadMedia(
    params: {
      fileName: string;
      mimeType: string;
      base64Data: string;
      altText: string;
      caption?: string;
    },
    user?: StaffUser | null,
  ): Promise<AdvisoryMediaAsset> {
    const res = await fetch('/api/publishing/media/upload', {
      method: 'POST',
      headers: this.getHeaders(user),
      credentials: 'same-origin',
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Media upload failed');
    return data.asset;
  }
}
