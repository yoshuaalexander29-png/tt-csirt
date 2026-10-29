/**
 * @fileoverview Advisory Versioning Service
 * Manages immutable version snapshots, cryptographic integrity digests, and version history.
 */

import crypto from 'node:crypto';
import type { AdvisoryDocument, AdvisoryVersion } from '@ttcsirt/canonical-types';
import type { StaffUser } from '../auth/auth-types.ts';
import { readJsonArray, writeJsonArray } from '../storage/json-file.ts';

export class VersionService {
  // Map of advisoryId -> AdvisoryVersion[] (sorted by version ascending)
  private versionStore: Map<string, AdvisoryVersion[]> = new Map();
  private readonly persistencePath?: string;

  constructor(persistencePath = process.env.TTCSIRT_PUBLISHING_STORE_PATH
    ? `${process.env.TTCSIRT_PUBLISHING_STORE_PATH}.versions.json`
    : undefined) {
    this.persistencePath = persistencePath;
    if (!persistencePath) return;
    try {
      for (const version of readJsonArray<AdvisoryVersion>(persistencePath)) {
        const history = this.versionStore.get(version.advisoryId) || [];
        history.push(Object.freeze(version));
        this.versionStore.set(version.advisoryId, history);
      }
    } catch (error) {
      console.error('Could not load persisted publishing versions:', error);
    }
  }

  /**
   * Computes a SHA-256 integrity digest for an advisory payload.
   */
  computeDigest(payload: AdvisoryDocument): string {
    const canonicalJson = JSON.stringify(payload, Object.keys(payload).sort());
    return crypto.createHash('sha256').update(canonicalJson).digest('hex');
  }

  /**
   * Creates and records an immutable snapshot of an advisory release.
   */
  createVersionSnapshot(params: {
    advisory: AdvisoryDocument;
    actor: StaffUser;
    changeDescription?: string;
    isMajorVersion?: boolean;
  }): AdvisoryVersion {
    const { advisory, actor, changeDescription, isMajorVersion } = params;
    const history = this.versionStore.get(advisory.id) || [];

    const versionNumber = advisory.publication.version;
    const payloadDigest = this.computeDigest(advisory);
    const createdAt = new Date().toISOString();

    const snapshot: AdvisoryVersion = {
      versionId: `ver-${advisory.id}-${versionNumber}-${Date.now()}`,
      versionNumber,
      advisoryId: advisory.id,
      referenceNumber: advisory.referenceNumber,
      publishedAt: createdAt,
      approvedByUserId: advisory.editorial.approverId || actor.id,
      publishedByUserId: actor.id,
      releaseNotes: changeDescription || `Release of version ${versionNumber}`,
      contentDigest: {
        algorithm: 'SHA-256',
        hexDigest: payloadDigest,
      },
      documentPayload: JSON.parse(JSON.stringify(advisory)), // Deep clone snapshot
    };

    // Deep freeze snapshot to enforce immutability
    Object.freeze(snapshot);
    Object.freeze(snapshot.documentPayload);

    history.push(snapshot);
    this.versionStore.set(advisory.id, history);
    try {
      if (this.persistencePath) {
        writeJsonArray(this.persistencePath, Array.from(this.versionStore.values()).flat());
      }
    } catch (error) {
      history.pop();
      if (history.length === 0) this.versionStore.delete(advisory.id);
      throw error;
    }

    return snapshot;
  }

  /**
   * Retrieves full version history for an advisory.
   */
  getVersionHistory(advisoryId: string): AdvisoryVersion[] {
    return this.versionStore.get(advisoryId) || [];
  }

  /**
   * Retrieves a specific version snapshot.
   */
  getVersion(advisoryId: string, versionNumber: number): AdvisoryVersion | null {
    const history = this.versionStore.get(advisoryId) || [];
    return history.find((v) => v.versionNumber === versionNumber) || null;
  }
}

export const versionService = new VersionService();
