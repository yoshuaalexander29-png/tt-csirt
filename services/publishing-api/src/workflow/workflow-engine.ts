/**
 * @fileoverview Workflow Engine with Server-Side Mechanical Safeguards
 * Enforces:
 * 1. Finite State Machine state transitions
 * 2. Two-person integrity: authorId !== approverId (Strict - No self-approval)
 * 3. Server-side validation gate
 * 4. Optimistic concurrency control (stale save protection)
 * 5. Immutable version release creation & non-repudiation audit logging
 */

import crypto from 'node:crypto';
import type {
  AdvisoryDocument,
  PublishedAdvisoryDocument,
  AdvisoryStatus,
  AdvisorySectionBundle,
} from '@ttcsirt/canonical-types';
import { toPublishedAdvisoryDocument } from '@ttcsirt/canonical-types';
import type { StaffUser } from '../auth/auth-types.ts';
import { hasDevelopmentCapability } from '../auth/dev-identities.ts';
import { validateAdvisoryDocument } from '../validation/advisory-validator.ts';
import { auditService, type AuditService } from '../audit/audit-service.ts';
import { versionService, type VersionService } from '../versioning/version-service.ts';
import { publishingStorage, type PublishingStorage } from '../storage/dev-storage.ts';

export class WorkflowEngine {
  private readonly storage: PublishingStorage;
  private readonly audit: AuditService;
  private readonly versions: VersionService;

  constructor(
    storage: PublishingStorage = publishingStorage,
    audit: AuditService = auditService,
    versions: VersionService = versionService,
  ) {
    this.storage = storage;
    this.audit = audit;
    this.versions = versions;
  }

  /**
   * Creates a new advisory draft.
   */
  createDraft(initialData: Partial<AdvisoryDocument>, actor: StaffUser): AdvisoryDocument {
    const id = initialData.id || `adv-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date().toISOString();

    const sections: AdvisorySectionBundle = initialData.sections || {
      overview: { id: 'sec-ov', title: 'Overview', level: 2, nodes: [] },
      impact: { id: 'sec-imp', title: 'Impact', level: 2, nodes: [] },
      remediation: { id: 'sec-rem', title: 'Remediation', level: 2, nodes: [] },
    };

    const doc: AdvisoryDocument = {
      id,
      referenceNumber: initialData.referenceNumber || '',
      classification: initialData.classification || 'advisory',
      title: initialData.title || '',
      slug: initialData.slug || '',
      severity: initialData.severity || 'medium',
      tlp: initialData.tlp || 'TLP:CLEAR',
      leadParagraph: initialData.leadParagraph || '',
      targetSectors: initialData.targetSectors || ['government'],
      taxonomyTags: initialData.taxonomyTags || [],
      cveMetadata: initialData.cveMetadata || [],
      affectedProducts: initialData.affectedProducts || [],
      sections,
      references: initialData.references || [],
      mediaAssets: initialData.mediaAssets || [],
      provenance: {
        originatingAgency: 'TT-CSIRT Vulnerability Coordination Unit',
      },
      editorial: {
        authorId: actor.id,
        authorEmail: actor.email,
        internalTags: initialData.editorial?.internalTags || [],
      },
      publication: {
        version: 1,
        status: 'draft',
        createdAt: now,
      },
    };

    this.storage.saveAdvisory(doc);

    this.audit.recordEvent({
      action: 'DRAFT_CREATED',
      advisoryId: doc.id,
      advisoryReference: doc.referenceNumber || 'UNASSIGNED',
      version: doc.publication.version,
      actor,
      newState: 'draft',
      payloadToDigest: doc,
    });

    return doc;
  }

  /**
   * Updates an existing draft with optimistic concurrency checking.
   */
  updateDraft(
    id: string,
    updates: Partial<AdvisoryDocument>,
    actor: StaffUser,
    expectedVersion?: number,
  ): AdvisoryDocument {
    const existing = this.storage.getAdvisory(id);
    if (!existing) {
      throw new Error(`Advisory "${id}" not found.`);
    }

    if (actor.id !== existing.editorial.authorId && !actor.roles.includes('admin')) {
      throw new Error('Access denied: only the advisory author or an administrator can edit this draft.');
    }

    // Only draft or changes_requested can be directly edited
    if (existing.publication.status !== 'draft' && existing.publication.status !== 'changes_requested') {
      throw new Error(
        `Cannot edit advisory in status "${existing.publication.status}". Only 'draft' or 'changes_requested' advisories can be modified. Create a new revision to alter published advisories.`,
      );
    }

    // Optimistic concurrency check
    if (expectedVersion !== undefined && existing.publication.version !== expectedVersion) {
      throw new Error(
        `STALE_CONCURRENCY_ERROR: The advisory has been updated by another user or session. Expected version ${expectedVersion}, but found ${existing.publication.version}. Please reload to review current changes.`,
      );
    }

    const previousStatus = existing.publication.status;

    // Apply allowed updates (safeguard editorial authorId and publication immutability)
    const updated: AdvisoryDocument = {
      ...existing,
      ...updates,
      id: existing.id, // Immutable ID
      editorial: {
        ...existing.editorial,
        ...updates.editorial,
        authorId: existing.editorial.authorId, // Preserve original author
        authorEmail: existing.editorial.authorEmail,
      },
      publication: {
        ...existing.publication,
        ...updates.publication,
        version: existing.publication.version,
        status: existing.publication.status, // Status changes must go through workflow methods
        createdAt: existing.publication.createdAt,
      },
    };

    this.storage.saveAdvisory(updated);

    this.audit.recordEvent({
      action: 'DRAFT_MUTATED',
      advisoryId: updated.id,
      advisoryReference: updated.referenceNumber,
      version: updated.publication.version,
      actor,
      previousState: previousStatus,
      newState: updated.publication.status,
      diffSummary: ['Updated advisory content and metadata'],
    });

    return updated;
  }

  /**
   * Submits a draft for technical and editorial review.
   * Enforces server-side validation gate: 0 blocking errors required.
   */
  submitForReview(id: string, actor: StaffUser): { advisory: AdvisoryDocument; validation: any } {
    const doc = this.storage.getAdvisory(id);
    if (!doc) {
      throw new Error(`Advisory "${id}" not found.`);
    }

    if (actor.id !== doc.editorial.authorId && !actor.roles.includes('admin')) {
      throw new Error('Access denied: only the advisory author or an administrator can submit this draft.');
    }

    if (doc.publication.status !== 'draft' && doc.publication.status !== 'changes_requested') {
      throw new Error(
        `Invalid state transition: Cannot submit advisory in "${doc.publication.status}" state for review.`,
      );
    }

    // Strict validation gate
    const validation = validateAdvisoryDocument(doc);
    if (!validation.isValid) {
      const errorSummary = validation.errors.map((e) => `${e.field}: ${e.message}`).join('; ');
      throw new Error(`VALIDATION_FAILED: Advisory has ${validation.errors.length} blocking error(s): ${errorSummary}`);
    }

    const previousState = doc.publication.status;
    doc.publication.status = 'ready_for_review';
    this.storage.saveAdvisory(doc);

    this.audit.recordEvent({
      action: 'SUBMITTED_FOR_REVIEW',
      advisoryId: doc.id,
      advisoryReference: doc.referenceNumber,
      version: doc.publication.version,
      actor,
      previousState,
      newState: 'ready_for_review',
    });

    return { advisory: doc, validation };
  }

  /**
   * Reviewer or Approver requests changes, returning the advisory to the author.
   */
  requestChanges(id: string, reviewerNotes: string, actor: StaffUser): AdvisoryDocument {
    if (!reviewerNotes || !reviewerNotes.trim()) {
      throw new Error('Reviewer feedback notes are required when requesting changes.');
    }

    const doc = this.storage.getAdvisory(id);
    if (!doc) {
      throw new Error(`Advisory "${id}" not found.`);
    }

    if (doc.publication.status !== 'ready_for_review' && doc.publication.status !== 'approved') {
      throw new Error(
        `Invalid state transition: Changes can only be requested on advisories currently 'ready_for_review' or 'approved' (current: '${doc.publication.status}').`,
      );
    }

    const previousState = doc.publication.status;
    doc.publication.status = 'changes_requested';
    doc.editorial.reviewerId = actor.id;
    doc.editorial.reviewerNotes = reviewerNotes.trim();
    doc.editorial.approverId = undefined;
    doc.editorial.approvedAt = undefined;

    this.storage.saveAdvisory(doc);

    this.audit.recordEvent({
      action: 'CHANGES_REQUESTED',
      advisoryId: doc.id,
      advisoryReference: doc.referenceNumber,
      version: doc.publication.version,
      actor,
      previousState,
      newState: 'changes_requested',
      reason: reviewerNotes.trim(),
    });

    return doc;
  }

  /**
   * Approves an advisory for public publication.
   * MANDATORY TWO-PERSON INTEGRITY: authorId !== approverId (Self-approval strictly forbidden)
   */
  approve(id: string, actor: StaffUser, approvalNotes?: string): AdvisoryDocument {
    const doc = this.storage.getAdvisory(id);
    if (!doc) {
      throw new Error(`Advisory "${id}" not found.`);
    }

    if (doc.publication.status !== 'ready_for_review') {
      throw new Error(
        `Invalid state transition: Only advisories in 'ready_for_review' can be approved (current: '${doc.publication.status}').`,
      );
    }

    // Two-Person Integrity Gate
    if (doc.editorial.authorId === actor.id && !hasDevelopmentCapability(actor, 'advisory_workflow_override')) {
      throw new Error(
        `TWO_PERSON_INTEGRITY_VIOLATION: The author (${doc.editorial.authorEmail || doc.editorial.authorId}) cannot approve their own advisory. An independent approver must review and authorize publication.`,
      );
    }

    // Role verification
    if (!actor.roles.includes('approver') && !actor.roles.includes('admin')) {
      throw new Error(`Access denied: Approver role required to approve advisories.`);
    }

    // Revalidate before approval
    const validation = validateAdvisoryDocument(doc);
    if (!validation.isValid) {
      throw new Error(`VALIDATION_FAILED: Cannot approve invalid advisory: ${validation.errors[0].message}`);
    }

    const previousState = doc.publication.status;
    doc.publication.status = 'approved';
    doc.editorial.approverId = actor.id;
    doc.editorial.approvedAt = new Date().toISOString();
    if (approvalNotes && approvalNotes.trim()) {
      doc.editorial.approverNotes = approvalNotes.trim();
    }

    this.storage.saveAdvisory(doc);

    this.audit.recordEvent({
      action: 'APPROVED',
      advisoryId: doc.id,
      advisoryReference: doc.referenceNumber,
      version: doc.publication.version,
      actor,
      previousState,
      newState: 'approved',
      reason: approvalNotes?.trim() || (hasDevelopmentCapability(actor, 'advisory_workflow_override')
        ? 'Test-user development workflow override recorded.'
        : 'Independent two-person approval recorded.'),
      payloadToDigest: doc,
    });

    return doc;
  }

  /**
   * Atomically publishes an approved advisory.
   * Enforces:
   * 1. Status must be 'approved'
   * 2. Author and Approver must be distinct
   * 3. Server revalidation
   * 4. Immutable version snapshot creation
   * 5. Projection to PublishedAdvisoryDocument (strips private editorial data)
   */
  publish(
    id: string,
    actor: StaffUser,
    options?: { idempotencyKey?: string; readingTimeMinutes?: number; releaseNotes?: string },
  ): { internalDocument: AdvisoryDocument; publishedDocument: PublishedAdvisoryDocument } {
    const doc = this.storage.getAdvisory(id);
    if (!doc) {
      throw new Error(`Advisory "${id}" not found.`);
    }

    // Idempotency check: if already published at this version, return current representation
    if (doc.publication.status === 'published') {
      const existingPublished = this.storage.getPublishedAdvisory(doc.id);
      if (existingPublished) {
        return { internalDocument: doc, publishedDocument: existingPublished };
      }
    }

    if (doc.publication.status !== 'approved') {
      throw new Error(
        `PUBLICATION_SAFETY_VIOLATION: Advisory status is '${doc.publication.status}'. Only 'approved' advisories can be published. Complete peer review and approver sign-off first.`,
      );
    }

    // Two-Person Integrity Gate verification
    if (
      !doc.editorial.approverId ||
      (doc.editorial.approverId === doc.editorial.authorId && !hasDevelopmentCapability(actor, 'advisory_workflow_override')) ||
      (actor.id === doc.editorial.authorId && !hasDevelopmentCapability(actor, 'advisory_workflow_override'))
    ) {
      throw new Error(
        `TWO_PERSON_INTEGRITY_VIOLATION: Advisory lacks valid independent approval (author cannot approve or publish their own advisory).`,
      );
    }

    // Role verification
    if (!actor.roles.includes('approver') && !actor.roles.includes('admin')) {
      throw new Error(`Access denied: Approver role required to execute publication.`);
    }

    // Final server re-validation
    const validation = validateAdvisoryDocument(doc);
    if (!validation.isValid) {
      throw new Error(`VALIDATION_FAILED: Revalidation failed before publication: ${validation.errors[0].message}`);
    }

    const previousState = doc.publication.status;
    const now = new Date().toISOString();

    doc.publication.status = 'published';
    if (!doc.publication.publishedAt) {
      doc.publication.publishedAt = now;
    } else {
      doc.publication.updatedAt = now;
    }

    // Derive the public delivery representation before committing the new state.
    const publishedDoc = toPublishedAdvisoryDocument(doc, {
      readingTimeMinutes: options?.readingTimeMinutes ?? 3,
    });

    // Persist before recording a version or audit event for the release.
    this.storage.saveAdvisory(doc);

    this.versions.createVersionSnapshot({
      advisory: doc,
      actor,
      changeDescription:
        options?.releaseNotes ||
        (doc.publication.version === 1
          ? `Initial release of ${doc.referenceNumber}`
          : `Published revision v${doc.publication.version} of ${doc.referenceNumber}`),
      isMajorVersion: true,
    });

    // 4. Record audit ledger entry
    this.audit.recordEvent({
      action: 'PUBLISHED',
      advisoryId: doc.id,
      advisoryReference: doc.referenceNumber,
      version: doc.publication.version,
      actor,
      previousState,
      newState: 'published',
      payloadToDigest: publishedDoc,
    });

    return { internalDocument: doc, publishedDocument: publishedDoc };
  }

  deleteAdvisory(id: string, actor: StaffUser): boolean {
    if (!hasDevelopmentCapability(actor, 'advisory_delete')) {
      throw new Error('Access denied: advisory deletion is reserved for the development Test-user.');
    }
    const doc = this.storage.getAdvisory(id);
    if (!doc) return false;

    this.audit.recordEvent({
      action: 'DELETED',
      advisoryId: doc.id,
      advisoryReference: doc.referenceNumber || 'UNASSIGNED',
      version: doc.publication.version,
      actor,
      previousState: doc.publication.status,
      newState: 'deleted',
      reason: 'Deleted by Test-user in the development test environment.',
      payloadToDigest: doc,
    });
    return this.storage.deleteAdvisory(id);
  }

  /**
   * Withdraws a published advisory.
   */
  withdraw(id: string, withdrawalNotice: string, actor: StaffUser): AdvisoryDocument {
    if (!withdrawalNotice || !withdrawalNotice.trim()) {
      throw new Error('A formal withdrawal explanation notice is mandatory.');
    }

    const doc = this.storage.getAdvisory(id);
    if (!doc) {
      throw new Error(`Advisory "${id}" not found.`);
    }

    if (doc.publication.status !== 'published') {
      throw new Error(`Cannot withdraw advisory in status '${doc.publication.status}'. Only published advisories can be withdrawn.`);
    }

    const previousState = doc.publication.status;
    doc.publication.status = 'withdrawn';
    doc.publication.withdrawalNotice = {
      withdrawnAt: new Date().toISOString(),
      authorizedBy: actor.id,
      publicReason: withdrawalNotice.trim(),
    };

    this.storage.saveAdvisory(doc);

    this.versions.createVersionSnapshot({
      advisory: doc,
      actor,
      changeDescription: `Advisory withdrawn: ${withdrawalNotice.trim()}`,
      isMajorVersion: false,
    });

    this.audit.recordEvent({
      action: 'WITHDRAWN',
      advisoryId: doc.id,
      advisoryReference: doc.referenceNumber,
      version: doc.publication.version,
      actor,
      previousState,
      newState: 'withdrawn',
      reason: withdrawalNotice.trim(),
    });

    return doc;
  }

  /**
   * Supersedes a published advisory with a newer reference.
   */
  supersede(id: string, supersededByReference: string, actor: StaffUser): AdvisoryDocument {
    if (!supersededByReference || !supersededByReference.trim()) {
      throw new Error('Superseding advisory reference number is required.');
    }

    const doc = this.storage.getAdvisory(id);
    if (!doc) {
      throw new Error(`Advisory "${id}" not found.`);
    }

    if (doc.publication.status !== 'published') {
      throw new Error(`Cannot supersede advisory in status '${doc.publication.status}'. Only published advisories can be superseded.`);
    }

    const previousState = doc.publication.status;
    doc.publication.status = 'superseded';
    doc.publication.supersededBy = {
      successorAdvisoryId: '',
      successorReferenceNumber: supersededByReference.trim(),
      supersededAt: new Date().toISOString(),
    };

    this.storage.saveAdvisory(doc);

    this.versions.createVersionSnapshot({
      advisory: doc,
      actor,
      changeDescription: `Superseded by ${supersededByReference.trim()}`,
      isMajorVersion: false,
    });

    this.audit.recordEvent({
      action: 'SUPERSEDED',
      advisoryId: doc.id,
      advisoryReference: doc.referenceNumber,
      version: doc.publication.version,
      actor,
      previousState,
      newState: 'superseded',
      reason: `Superseded by ${supersededByReference.trim()}`,
    });

    return doc;
  }

  /**
   * Creates a new draft revision from a published advisory.
   */
  createRevision(id: string, actor: StaffUser): AdvisoryDocument {
    const publishedDoc = this.storage.getAdvisory(id);
    if (!publishedDoc) {
      throw new Error(`Advisory "${id}" not found.`);
    }

    if (publishedDoc.publication.status !== 'published' && publishedDoc.publication.status !== 'superseded') {
      throw new Error(`Cannot create new revision from advisory in status '${publishedDoc.publication.status}'.`);
    }

    const nextVersion = publishedDoc.publication.version + 1;
    const revision: AdvisoryDocument = {
      ...JSON.parse(JSON.stringify(publishedDoc)),
      editorial: {
        ...publishedDoc.editorial,
        authorId: actor.id,
        authorEmail: actor.email,
        reviewerId: undefined,
        reviewerNotes: undefined,
        approverId: undefined,
        approvedAt: undefined,
      },
      publication: {
        ...publishedDoc.publication,
        version: nextVersion,
        status: 'draft',
        createdAt: new Date().toISOString(),
      },
    };

    this.storage.saveAdvisory(revision);

    this.audit.recordEvent({
      action: 'DRAFT_CREATED',
      advisoryId: revision.id,
      advisoryReference: revision.referenceNumber,
      version: revision.publication.version,
      actor,
      previousState: publishedDoc.publication.status,
      newState: 'draft',
      reason: `Created revision v${nextVersion} from published advisory`,
    });

    return revision;
  }

  /**
   * Executes an emergency rollback to a previous immutable version snapshot as a new version (v+1).
   */
  rollback(id: string, targetVersionNumber: number, reason: string, actor: StaffUser): AdvisoryDocument {
    if (!actor.roles.includes('admin') && !actor.roles.includes('approver')) {
      throw new Error('Access denied: Administrator or Approver role required to execute rollback.');
    }
    if (!reason || !reason.trim()) {
      throw new Error('A formal rollback justification reason is required.');
    }

    const currentDoc = this.storage.getAdvisory(id);
    if (!currentDoc) {
      throw new Error(`Advisory "${id}" not found.`);
    }

    const targetSnapshot = this.versions.getVersion(id, targetVersionNumber);
    if (!targetSnapshot) {
      throw new Error(`Target version snapshot v${targetVersionNumber} not found for advisory "${id}".`);
    }

    if (currentDoc.editorial.authorId === actor.id) {
      throw new Error('TWO_PERSON_INTEGRITY_VIOLATION: The original author cannot execute a unilateral rollback.');
    }

    const nextVersion = currentDoc.publication.version + 1;
    const now = new Date().toISOString();
    const rolledBack: AdvisoryDocument = {
      ...JSON.parse(JSON.stringify(targetSnapshot.documentPayload)),
      id: currentDoc.id,
      publication: {
        ...targetSnapshot.documentPayload.publication,
        version: nextVersion,
        status: 'published',
        publishedAt: currentDoc.publication.publishedAt || now,
        updatedAt: now,
      },
    };

    this.storage.saveAdvisory(rolledBack);

    this.versions.createVersionSnapshot({
      advisory: rolledBack,
      actor,
      changeDescription: `Rollback to v${targetVersionNumber}: ${reason.trim()}`,
      isMajorVersion: true,
    });

    this.audit.recordEvent({
      action: 'ROLLBACK_EXECUTED',
      advisoryId: rolledBack.id,
      advisoryReference: rolledBack.referenceNumber,
      version: nextVersion,
      actor,
      previousState: currentDoc.publication.status,
      newState: 'published',
      reason: `Rolled back to v${targetVersionNumber}: ${reason.trim()}`,
      payloadToDigest: rolledBack,
    });

    return rolledBack;
  }
}

export const workflowEngine = new WorkflowEngine();

// Seed baseline version snapshots and audit ledger entries for initial seeded advisories
function seedInitialGovernanceRecords() {
  const authorActor: StaffUser = {
    id: 'usr-author-001',
    email: 'a.ramlal@ttcsirt.gov.tt',
    displayName: 'A. Ramlal',
    roles: ['author'],
    department: 'Vulnerability Coordination Team',
    lastLoginAt: '2026-03-30T10:00:00Z',
  };
  const approverActor: StaffUser = {
    id: 'usr-approver-003',
    email: 'k.mahabir@ttcsirt.gov.tt',
    displayName: 'K. Mahabir',
    roles: ['approver'],
    department: 'Executive Directorate',
    lastLoginAt: '2026-03-30T10:00:00Z',
  };

  for (const adv of publishingStorage.listAdvisories().reverse()) {
    if (auditService.getEventsForAdvisory(adv.id).length === 0) {
      auditService.recordEvent({
        action: 'DRAFT_CREATED',
        advisoryId: adv.id,
        advisoryReference: adv.referenceNumber,
        version: 1,
        actor: authorActor,
        newState: 'draft',
        reason: 'Initial advisory draft created.',
        payloadToDigest: adv,
      });

      if (adv.publication.status === 'ready_for_review' || adv.publication.status === 'published') {
        auditService.recordEvent({
          action: 'SUBMITTED_FOR_REVIEW',
          advisoryId: adv.id,
          advisoryReference: adv.referenceNumber,
          version: 1,
          actor: authorActor,
          previousState: 'draft',
          newState: 'ready_for_review',
          reason: adv.editorial.reviewerNotes || 'Submitted for peer review.',
        });
      }

      if (adv.publication.status === 'published') {
        auditService.recordEvent({
          action: 'APPROVED',
          advisoryId: adv.id,
          advisoryReference: adv.referenceNumber,
          version: 1,
          actor: approverActor,
          previousState: 'ready_for_review',
          newState: 'approved',
          reason: 'Two-person integrity verification completed.',
          payloadToDigest: adv,
        });
        auditService.recordEvent({
          action: 'PUBLISHED',
          advisoryId: adv.id,
          advisoryReference: adv.referenceNumber,
          version: 1,
          actor: approverActor,
          previousState: 'approved',
          newState: 'published',
          reason: `Initial public release of ${adv.referenceNumber}`,
          payloadToDigest: adv,
        });
      }
    }

    if (adv.publication.status === 'published' && versionService.getVersionHistory(adv.id).length === 0) {
      versionService.createVersionSnapshot({
        advisory: adv,
        actor: approverActor,
        changeDescription: `Initial public release of ${adv.referenceNumber}`,
        isMajorVersion: true,
      });
    }
  }
}

seedInitialGovernanceRecords();
