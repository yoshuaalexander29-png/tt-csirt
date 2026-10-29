/**
 * @fileoverview Secure Preview Token Service
 * Issues and validates signed preview tokens with strict TTL expiration.
 * Prevents unauthorized or unexpired public indexing of draft content.
 */

import crypto from 'node:crypto';
import type { StaffUser } from '../auth/auth-types.ts';

const PREVIEW_SECRET = process.env.PUBLISHING_PREVIEW_SECRET || 'dev-preview-secret-key-do-not-use-in-prod-780225';
const PREVIEW_TTL_MS = 15 * 60 * 1000; // 15 minutes

export interface PreviewTokenPayload {
  advisoryId: string;
  version: number;
  issuedAt: number;
  expiresAt: number;
  issuedToUserId: string;
}

export class PreviewService {
  /**
   * Generates a signed preview token for an authorized staff member.
   */
  generatePreviewToken(advisoryId: string, version: number, actor: StaffUser): string {
    const issuedAt = Date.now();
    const expiresAt = issuedAt + PREVIEW_TTL_MS;

    const payload: PreviewTokenPayload = {
      advisoryId,
      version,
      issuedAt,
      expiresAt,
      issuedToUserId: actor.id,
    };

    const serializedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', PREVIEW_SECRET)
      .update(serializedPayload)
      .digest('base64url');

    return `${serializedPayload}.${signature}`;
  }

  /**
   * Validates a preview token.
   * Returns parsed payload if valid and unexpired; throws Error otherwise.
   */
  verifyPreviewToken(token: string): PreviewTokenPayload {
    if (!token || typeof token !== 'string') {
      throw new Error('Preview token is required.');
    }

    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new Error('Malformed preview token.');
    }

    const [serializedPayload, signature] = parts;

    // Verify HMAC signature
    const expectedSignature = crypto
      .createHmac('sha256', PREVIEW_SECRET)
      .update(serializedPayload)
      .digest('base64url');

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      throw new Error('Invalid preview token signature.');
    }

    // Parse and verify expiration
    let payload: PreviewTokenPayload;
    try {
      payload = JSON.parse(Buffer.from(serializedPayload, 'base64url').toString('utf-8'));
    } catch {
      throw new Error('Invalid preview token payload encoding.');
    }

    if (Date.now() > payload.expiresAt) {
      throw new Error('Preview token has expired.');
    }

    return payload;
  }
}

export const previewService = new PreviewService();
