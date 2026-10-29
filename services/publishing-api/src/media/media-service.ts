/**
 * @fileoverview Media Upload & Validation Pipeline
 * Validates and sanitizes media attachments against canonical constraints.
 * Treats SVGs as untrusted inputs and rejects active script injection.
 */

import crypto from 'node:crypto';
import path from 'node:path';
import type { AdvisoryMediaAsset } from '@ttcsirt/canonical-types';
import { MEDIA_CONSTRAINTS } from '@ttcsirt/canonical-types';
import type { StaffUser } from '../auth/auth-types.ts';

export class MediaService {
  private mediaRegistry: Map<string, AdvisoryMediaAsset> = new Map();

  /**
   * Sanitizes a user-provided filename to prevent path traversal and unsafe characters.
   */
  sanitizeFilename(fileName: string): string {
    const baseName = path.basename(fileName);
    const ext = path.extname(baseName);
    const stem = path.basename(baseName, ext);

    const safeStem = stem.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();

    return `${safeStem}${safeExt}`;
  }

  /**
   * Inspects and validates uploaded media buffer.
   */
  processUpload(params: {
    fileName: string;
    mimeType: string;
    buffer: Buffer;
    altText?: string;
    caption?: string;
    actor: StaffUser;
  }): AdvisoryMediaAsset {
    const { fileName, mimeType, buffer, altText, caption, actor } = params;

    // 1. Validate MIME type
    if (!MEDIA_CONSTRAINTS.ALLOWED_MIME_TYPES.includes(mimeType as any)) {
      throw new Error(
        `Disallowed MIME type "${mimeType}". Allowed types: ${MEDIA_CONSTRAINTS.ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    // 2. Size limits
    const sizeBytes = buffer.length;
    const isImage = mimeType.startsWith('image/');
    const maxSize = isImage
      ? MEDIA_CONSTRAINTS.MAX_IMAGE_SIZE_BYTES
      : MEDIA_CONSTRAINTS.MAX_DOCUMENT_SIZE_BYTES;

    if (sizeBytes > maxSize) {
      throw new Error(
        `File size (${(sizeBytes / 1024 / 1024).toFixed(2)} MB) exceeds limit of ${(maxSize / 1024 / 1024).toFixed(0)} MB.`,
      );
    }

    // 3. SVG Security Inspection
    if (mimeType === 'image/svg+xml') {
      const svgText = buffer.toString('utf-8');
      if (
        /<script\b/i.test(svgText) ||
        /\bon\w+\s*=/i.test(svgText) ||
        /<!ENTITY/i.test(svgText) ||
        /xlink:href=["']javascript:/i.test(svgText) ||
        /href=["']javascript:/i.test(svgText)
      ) {
        throw new Error(
          'Security violation: SVG file contains embedded scripts or active handlers and is rejected.',
        );
      }
    }

    // 4. Safe filename and hash
    const safeName = this.sanitizeFilename(fileName);
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const assetId = `med-${Date.now()}-${sha256.substring(0, 8)}`;

    const asset: AdvisoryMediaAsset = {
      assetId,
      storagePath: `/media/advisories/${sha256}/${safeName}`,
      publicUrl: `/media/advisories/${sha256}/${safeName}`,
      mimeType: mimeType as any,
      byteSize: sizeBytes,
      sha256,
      altText: altText || safeName,
      caption,
      isQuarantined: false,
    };

    this.mediaRegistry.set(assetId, asset);
    return asset;
  }

  getAsset(id: string): AdvisoryMediaAsset | null {
    return this.mediaRegistry.get(id) || null;
  }
}

export const mediaService = new MediaService();
