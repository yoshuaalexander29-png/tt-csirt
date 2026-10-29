/**
 * @fileoverview Audit Ledger Service for Advisory Publishing System
 * Implements an append-only non-repudiation audit trail for all editorial actions.
 */

import crypto from 'node:crypto';
import type { AdvisoryAuditEvent } from '@ttcsirt/canonical-types';
import type { StaffUser } from '../auth/auth-types.ts';
import { writeJsonArray, readJsonArray } from '../storage/json-file.ts';

export class AuditService {
  private events: AdvisoryAuditEvent[] = [];
  private readonly persistencePath?: string;

  constructor(persistencePath = process.env.TTCSIRT_PUBLISHING_STORE_PATH
    ? `${process.env.TTCSIRT_PUBLISHING_STORE_PATH}.audit.json`
    : undefined) {
    this.persistencePath = persistencePath;
    if (!persistencePath) return;
    try {
      this.events = readJsonArray<AdvisoryAuditEvent>(persistencePath).map((event) => Object.freeze(event));
    } catch (error) {
      console.error('Could not load persisted publishing audit events:', error);
    }
  }

  /**
   * Appends an immutable audit event to the ledger.
   */
  recordEvent(params: {
    action: AdvisoryAuditEvent['action'];
    advisoryId: string;
    advisoryReference: string;
    version: number;
    actor: StaffUser;
    previousState?: any;
    newState?: any;
    reason?: string;
    payloadToDigest?: any;
    diffSummary?: any;
  }): AdvisoryAuditEvent {
    const timestamp = new Date().toISOString();
    const eventId = `audit-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    // Compute SHA-256 payload digest if payload provided
    let payloadDigest: { algorithm: 'SHA-256'; hexDigest: string } | undefined;
    if (params.payloadToDigest) {
      payloadDigest = {
        algorithm: 'SHA-256',
        hexDigest: crypto
          .createHash('sha256')
          .update(JSON.stringify(params.payloadToDigest))
          .digest('hex'),
      };
    }

    const mapRole = (r?: string): "AUTHOR" | "REVIEWER" | "APPROVER" | "ADMINISTRATOR" | "SYSTEM" => {
      if (r === 'approver') return 'APPROVER';
      if (r === 'reviewer') return 'REVIEWER';
      if (r === 'admin') return 'ADMINISTRATOR';
      return 'AUTHOR';
    };

    const event: AdvisoryAuditEvent = {
      eventId,
      timestamp,
      action: params.action,
      advisoryId: params.advisoryId,
      referenceNumber: params.advisoryReference,
      version: params.version,
      actor: {
        userId: params.actor.id,
        email: params.actor.email,
        role: mapRole(params.actor.roles[0]),
        ipAddress: '127.0.0.1',
        userAgent: 'Internal-Publishing-Portal/1.0',
      },
      previousStatus: params.previousState,
      resultingStatus: params.newState || 'draft',
      comment: params.reason,
      payloadDigest,
      diffSummary: params.diffSummary,
    };

    // Freeze event to protect against runtime tampering
    Object.freeze(event);
    this.events.push(event);
    try {
      if (this.persistencePath) writeJsonArray(this.persistencePath, this.events);
    } catch (error) {
      this.events.pop();
      throw error;
    }

    return event;
  }

  /**
   * Retrieves all audit events for a specific advisory in chronological order.
   */
  getEventsForAdvisory(advisoryId: string): AdvisoryAuditEvent[] {
    return this.events.filter((e) => e.advisoryId === advisoryId);
  }

  /**
   * Retrieves recent audit events across the publishing control plane.
   */
  getAllEvents(limit = 100): AdvisoryAuditEvent[] {
    return [...this.events].reverse().slice(0, limit);
  }
}

export const auditService = new AuditService();
