/**
 * @fileoverview Publishing Control Plane Express Router
 * Mounts all internal editorial, review, validation, preview, and audit endpoints.
 * All write endpoints require staff credentials and enforce strict business gates.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import type { AuthenticatedStaffRequest } from './auth/auth-middleware.ts';
import { staffAuthMiddleware, requireStaffRoles, requireDevelopmentCapability, getAuthenticationProvider } from './auth/auth-middleware.ts';
import { DEV_IDENTITIES } from './auth/dev-identities.ts';
import { isDevAuthEnabled } from './auth/dev-auth-config.ts';
import { createDevSessionToken, serializeDevSessionCookie, clearDevSessionCookie } from './auth/session-service.ts';
import { workflowEngine } from './workflow/workflow-engine.ts';
import { validateAdvisoryDocument } from './validation/advisory-validator.ts';
import { versionService } from './versioning/version-service.ts';
import { auditService } from './audit/audit-service.ts';
import { previewService } from './preview/preview-service.ts';
import { mediaService } from './media/media-service.ts';
import { publishingStorage } from './storage/dev-storage.ts';
import { TEST_SAMPLE_ADVISORY, TEST_SAMPLE_ADVISORY_ID_PREFIX } from './test-fixtures/sample-advisory.ts';
import { canReadAdvisory } from './auth/advisory-access.ts';

export const publishingRouter = Router();

// 1. Authentication & Dev Identity Endpoints
publishingRouter.get('/auth/status', async (req: Request, res: Response) => {
  const devEnabled = isDevAuthEnabled();
  try {
    const provider = getAuthenticationProvider();
    const user = await provider.authenticate(req.headers as any);
    res.json({
      devAuthEnabled: devEnabled,
      isAuthenticated: !!user,
      user: user || null,
      environment: devEnabled ? 'development-test' : 'production-restricted',
    });
  } catch {
    res.json({
      devAuthEnabled: devEnabled,
      isAuthenticated: false,
      user: null,
      environment: devEnabled ? 'development-test' : 'production-restricted',
    });
  }
});

publishingRouter.get('/auth/dev-identities', (req: Request, res: Response) => {
  if (!isDevAuthEnabled()) {
    res.status(404).json({
      statusCode: 404,
      error: 'NotFound',
      message: 'Development identities are unavailable in this environment.',
    });
    return;
  }

  res.json({
    devAuthEnabled: true,
    identities: Object.entries(DEV_IDENTITIES).map(([key, u]) => ({
      key,
      id: u.id,
      displayName: u.displayName,
      email: u.email,
      roles: u.roles,
      department: u.department,
      developmentCapabilities: u.developmentCapabilities,
    })),
  });
});

publishingRouter.post('/auth/dev-login', (req: Request, res: Response) => {
  if (!isDevAuthEnabled()) {
    res.status(404).json({
      statusCode: 404,
      error: 'NotFound',
      message: 'Development login is not enabled in this environment.',
    });
    return;
  }

  const { identityKey } = req.body || {};
  if (!identityKey || typeof identityKey !== 'string') {
    res.status(400).json({
      statusCode: 400,
      error: 'BadRequest',
      message: 'identityKey is required.',
    });
    return;
  }

  const identity = DEV_IDENTITIES[identityKey];
  if (!identity) {
    res.status(400).json({
      statusCode: 400,
      error: 'InvalidIdentity',
      message: `Identity key '${identityKey}' is not an allowlisted development identity.`,
    });
    return;
  }

  // Issue signed HMAC development session token
  const token = createDevSessionToken(identityKey);
  res.setHeader('Set-Cookie', serializeDevSessionCookie(token));

  res.json({
    success: true,
    user: identity,
    token,
  });
});

publishingRouter.post('/auth/logout', (req: Request, res: Response) => {
  res.setHeader('Set-Cookie', clearDevSessionCookie());
  res.json({
    success: true,
    message: 'Staff session terminated successfully.',
  });
});

publishingRouter.get('/auth/me', staffAuthMiddleware, (req: AuthenticatedStaffRequest, res: Response) => {
  const devEnabled = isDevAuthEnabled();
  res.json({
    user: req.staffUser,
    isDevMode: devEnabled,
    devAuthEnabled: devEnabled,
    availableDevIdentities: devEnabled
      ? Object.entries(DEV_IDENTITIES).map(([key, u]) => ({
          key,
          id: u.id,
          displayName: u.displayName,
          email: u.email,
          roles: u.roles,
          department: u.department,
          developmentCapabilities: u.developmentCapabilities,
        }))
      : [],
  });
});

// 2. Advisories List & CRUD
publishingRouter.post(
  '/test-fixtures/sample-advisory',
  staffAuthMiddleware,
  requireDevelopmentCapability('test_fixture_management'),
  (req: AuthenticatedStaffRequest, res: Response) => {
    const existing = publishingStorage.listAdvisories().find((advisory) => advisory.id.startsWith(TEST_SAMPLE_ADVISORY_ID_PREFIX));
    if (existing) {
      res.json({ success: true, created: false, advisory: existing });
      return;
    }
    const previousCycles = auditService
      .getAllEvents(Number.MAX_SAFE_INTEGER)
      .filter((event) => event.advisoryId.startsWith(TEST_SAMPLE_ADVISORY_ID_PREFIX) && event.action === 'DRAFT_CREATED')
      .length;
    const sequence = String(previousCycles + 1).padStart(3, '0');
    const advisory = workflowEngine.createDraft({
      ...TEST_SAMPLE_ADVISORY,
      id: `${TEST_SAMPLE_ADVISORY_ID_PREFIX}${sequence}`,
      referenceNumber: `TT-CSIRT-ADV-2099-${sequence}`,
    }, req.staffUser!);
    res.status(201).json({ success: true, created: true, advisory });
  },
);

publishingRouter.get('/advisories', staffAuthMiddleware, (req: AuthenticatedStaffRequest, res: Response) => {
  const statusFilter = (req.query?.status || '') as string;
  let list = publishingStorage.listAdvisories().filter((advisory) => canReadAdvisory(advisory, req.staffUser!));

  if (statusFilter && statusFilter !== 'all') {
    list = list.filter((a) => a.publication.status === statusFilter);
  }

  res.json({
    total: list.length,
    advisories: list,
  });
});

publishingRouter.post(
  '/advisories',
  staffAuthMiddleware,
  requireStaffRoles('author', 'admin'),
  (req: AuthenticatedStaffRequest, res: Response) => {
    try {
      const doc = workflowEngine.createDraft(req.body || {}, req.staffUser!);
      res.status(201).json({ success: true, advisory: doc });
    } catch (err: any) {
      res.status(400).json({ error: 'CreateDraftFailed', message: err.message });
    }
  },
);

publishingRouter.get('/advisories/:id', staffAuthMiddleware, (req: AuthenticatedStaffRequest, res: Response) => {
  const id = req.params.id as string;
  const doc = publishingStorage.getAdvisory(id);
  if (!doc) {
    res.status(404).json({ error: 'NotFound', message: `Advisory ${id} not found.` });
    return;
  }
  if (!canReadAdvisory(doc, req.staffUser!)) {
    res.status(404).json({ error: 'NotFound', message: `Advisory ${id} not found.` });
    return;
  }
  res.json({ advisory: doc });
});

publishingRouter.put(
  '/advisories/:id',
  staffAuthMiddleware,
  requireStaffRoles('author', 'admin'),
  (req: AuthenticatedStaffRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const expectedVersion = req.body.expectedVersion !== undefined ? Number(req.body.expectedVersion) : undefined;
      const updated = workflowEngine.updateDraft(id, req.body, req.staffUser!, expectedVersion);
      res.json({ success: true, advisory: updated });
    } catch (err: any) {
      const isConcurrency = err.message.includes('STALE_CONCURRENCY_ERROR');
      res.status(isConcurrency ? 409 : 400).json({
        error: isConcurrency ? 'Conflict' : 'UpdateFailed',
        message: err.message,
      });
    }
  },
);

publishingRouter.delete(
  '/advisories/:id',
  staffAuthMiddleware,
  requireDevelopmentCapability('advisory_delete'),
  (req: AuthenticatedStaffRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      if (!workflowEngine.deleteAdvisory(id, req.staffUser!)) {
        res.status(404).json({ error: 'NotFound', message: `Advisory ${id} not found.` });
        return;
      }
      res.json({ success: true, deleted: true });
    } catch (err: any) {
      res.status(403).json({ error: 'DeletionDenied', message: err.message });
    }
  },
);

// 3. Validation
publishingRouter.post('/advisories/:id/validate', staffAuthMiddleware, (req: AuthenticatedStaffRequest, res: Response) => {
  const id = req.params.id as string;
  const doc = publishingStorage.getAdvisory(id);
  if (!doc) {
    res.status(404).json({ error: 'NotFound', message: `Advisory ${id} not found.` });
    return;
  }
  if (!canReadAdvisory(doc, req.staffUser!)) {
    res.status(404).json({ error: 'NotFound', message: `Advisory ${id} not found.` });
    return;
  }
  // Allow validating transient body or existing doc
  const target = req.body && Object.keys(req.body).length > 0 ? { ...doc, ...req.body } : doc;
  const result = validateAdvisoryDocument(target);
  res.json({ validation: result });
});

// 4. Workflow Operations
publishingRouter.post(
  '/advisories/:id/submit-review',
  staffAuthMiddleware,
  requireStaffRoles('author', 'admin'),
  (req: AuthenticatedStaffRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const outcome = workflowEngine.submitForReview(id, req.staffUser!);
      res.json({ success: true, advisory: outcome.advisory, validation: outcome.validation });
    } catch (err: any) {
      const isValidation = err.message.startsWith('VALIDATION_FAILED');
      res.status(isValidation ? 422 : 400).json({
        error: isValidation ? 'ValidationFailed' : 'TransitionFailed',
        message: err.message,
      });
    }
  },
);

publishingRouter.post(
  '/advisories/:id/request-changes',
  staffAuthMiddleware,
  requireStaffRoles('reviewer', 'approver', 'admin'),
  (req: AuthenticatedStaffRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const notes = req.body?.notes ?? req.body?.feedbackNotes ?? '';
      const updated = workflowEngine.requestChanges(id, notes, req.staffUser!);
      res.json({ success: true, advisory: updated });
    } catch (err: any) {
      res.status(400).json({ error: 'RequestChangesFailed', message: err.message });
    }
  },
);

publishingRouter.post(
  '/advisories/:id/approve',
  staffAuthMiddleware,
  requireStaffRoles('approver', 'admin'),
  (req: AuthenticatedStaffRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const approvalNotes = req.body?.approvalNotes ?? req.body?.notes;
      const updated = workflowEngine.approve(id, req.staffUser!, approvalNotes);
      res.json({ success: true, advisory: updated });
    } catch (err: any) {
      const isTwoPerson = err.message.includes('TWO_PERSON_INTEGRITY_VIOLATION');
      res.status(isTwoPerson ? 403 : 400).json({
        error: isTwoPerson ? 'TwoPersonIntegrityViolation' : 'ApprovalFailed',
        message: err.message,
      });
    }
  },
);

publishingRouter.post(
  '/advisories/:id/publish',
  staffAuthMiddleware,
  requireStaffRoles('approver', 'admin'),
  (req: AuthenticatedStaffRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const { idempotencyKey, readingTimeMinutes, releaseNotes } = req.body || {};
      const outcome = workflowEngine.publish(id, req.staffUser!, {
        idempotencyKey,
        readingTimeMinutes,
        releaseNotes,
      });
      res.json({
        success: true,
        advisory: outcome.internalDocument,
        publishedAdvisory: outcome.publishedDocument,
        isPubliclyAvailable: Boolean(publishingStorage.getPublishedAdvisory(outcome.internalDocument.id)),
      });
    } catch (err: any) {
      const isTwoPerson = err.message.includes('TWO_PERSON_INTEGRITY_VIOLATION');
      const isSafety = err.message.includes('PUBLICATION_SAFETY_VIOLATION');
      res.status(isTwoPerson ? 403 : isSafety ? 422 : 400).json({
        error: isTwoPerson ? 'TwoPersonIntegrityViolation' : 'PublicationFailed',
        message: err.message,
      });
    }
  },
);

publishingRouter.post(
  '/advisories/:id/withdraw',
  staffAuthMiddleware,
  requireStaffRoles('approver', 'admin'),
  (req: AuthenticatedStaffRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const withdrawalNotice = req.body?.withdrawalNotice ?? req.body?.withdrawalReason ?? '';
      const updated = workflowEngine.withdraw(id, withdrawalNotice, req.staffUser!);
      res.json({ success: true, advisory: updated });
    } catch (err: any) {
      res.status(400).json({ error: 'WithdrawalFailed', message: err.message });
    }
  },
);

publishingRouter.post(
  '/advisories/:id/supersede',
  staffAuthMiddleware,
  requireStaffRoles('approver', 'admin'),
  (req: AuthenticatedStaffRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const supersededBy = req.body?.supersededBy ?? req.body?.successorReferenceNumber ?? '';
      const updated = workflowEngine.supersede(id, supersededBy, req.staffUser!);
      res.json({ success: true, advisory: updated });
    } catch (err: any) {
      res.status(400).json({ error: 'SupersedeFailed', message: err.message });
    }
  },
);

publishingRouter.post(
  '/advisories/:id/create-revision',
  staffAuthMiddleware,
  requireStaffRoles('author', 'admin'),
  (req: AuthenticatedStaffRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const updated = workflowEngine.createRevision(id, req.staffUser!);
      res.json({ success: true, advisory: updated });
    } catch (err: any) {
      res.status(400).json({ error: 'RevisionFailed', message: err.message });
    }
  },
);

publishingRouter.post(
  '/advisories/:id/rollback',
  staffAuthMiddleware,
  requireStaffRoles('approver', 'admin'),
  (req: AuthenticatedStaffRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const targetVersionNumber = Number(req.body?.targetVersionNumber ?? req.body?.version ?? 1);
      const rollbackReason = req.body?.rollbackReason ?? req.body?.reason ?? '';
      const updated = workflowEngine.rollback(id, targetVersionNumber, rollbackReason, req.staffUser!);
      res.json({ success: true, advisory: updated });
    } catch (err: any) {
      const isTwoPerson = err.message.includes('TWO_PERSON_INTEGRITY_VIOLATION');
      res.status(isTwoPerson ? 403 : 400).json({
        error: isTwoPerson ? 'TwoPersonIntegrityViolation' : 'RollbackFailed',
        message: err.message,
      });
    }
  },
);

// 5. Versions and Audit Ledger
publishingRouter.get('/advisories/:id/versions', staffAuthMiddleware, (req: AuthenticatedStaffRequest, res: Response) => {
  const id = req.params.id as string;
  const advisory = publishingStorage.getAdvisory(id);
  if (advisory && !canReadAdvisory(advisory, req.staffUser!)) {
    res.status(404).json({ error: 'NotFound', message: `Advisory ${id} not found.` });
    return;
  }
  const versions = versionService.getVersionHistory(id);
  res.json({ versions });
});

publishingRouter.get('/advisories/:id/audit', staffAuthMiddleware, (req: AuthenticatedStaffRequest, res: Response) => {
  const id = req.params.id as string;
  const advisory = publishingStorage.getAdvisory(id);
  if (advisory && !canReadAdvisory(advisory, req.staffUser!)) {
    res.status(404).json({ error: 'NotFound', message: `Advisory ${id} not found.` });
    return;
  }
  const events = auditService.getEventsForAdvisory(id);
  res.json({ events });
});

publishingRouter.get('/advisories/:id/audit-trail', staffAuthMiddleware, (req: AuthenticatedStaffRequest, res: Response) => {
  const id = req.params.id as string;
  const advisory = publishingStorage.getAdvisory(id);
  if (advisory && !canReadAdvisory(advisory, req.staffUser!)) {
    res.status(404).json({ error: 'NotFound', message: `Advisory ${id} not found.` });
    return;
  }
  const events = auditService.getEventsForAdvisory(id);
  res.json({ events });
});

publishingRouter.get('/audit', staffAuthMiddleware, (req: AuthenticatedStaffRequest, res: Response) => {
  const events = auditService.getAllEvents().filter((event) => {
    const advisory = publishingStorage.getAdvisory(event.advisoryId);
    return !advisory || canReadAdvisory(advisory, req.staffUser!);
  });
  res.json({ events });
});

// 6. Secure Preview
publishingRouter.post('/advisories/:id/preview-token', staffAuthMiddleware, (req: AuthenticatedStaffRequest, res: Response) => {
  const id = req.params.id as string;
  const doc = publishingStorage.getAdvisory(id);
  if (!doc) {
    res.status(404).json({ error: 'NotFound', message: `Advisory ${id} not found.` });
    return;
  }
  if (!canReadAdvisory(doc, req.staffUser!)) {
    res.status(404).json({ error: 'NotFound', message: `Advisory ${id} not found.` });
    return;
  }
  const token = previewService.generatePreviewToken(doc.id, doc.publication.version, req.staffUser!);
  res.json({
    token,
    previewToken: token,
    advisoryId: doc.id,
    previewUrl: `/api/publishing/preview/${token}`,
  });
});

function handleTokenPreview(token: string, res: Response) {
  try {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    const payload = previewService.verifyPreviewToken(token);
    const doc = publishingStorage.getAdvisory(payload.advisoryId);

    if (!doc) {
      res.status(404).json({ error: 'NotFound', message: 'Preview advisory no longer exists.' });
      return;
    }

    res.json({
      isPreview: true,
      watermark: 'OFFICIAL USE ONLY — UNAPPROVED DRAFT PREVIEW — NOT FOR PUBLIC RELEASE',
      expiresAt: payload.expiresAt,
      advisory: doc,
    });
  } catch (err: any) {
    res.status(403).json({ error: 'PreviewAccessDenied', message: err.message });
  }
}

publishingRouter.get('/preview/:token', (req: Request, res: Response) => {
  handleTokenPreview(req.params.token as string, res);
});

publishingRouter.get('/advisories/:id/preview', (req: Request, res: Response) => {
  const token = (req.query?.token || '') as string;
  handleTokenPreview(token, res);
});

// 7. Sanitized Published Delivery Feed (Read-Only Projection)
publishingRouter.get('/published', (req: Request, res: Response) => {
  const published = publishingStorage.listPublishedAdvisories();
  res.json({
    total: published.length,
    items: published,
  });
});

publishingRouter.get('/published/:slugOrId', (req: Request, res: Response) => {
  const key = (req.params.slugOrId as string).toLowerCase();
  const list = publishingStorage.listPublishedAdvisories();
  const match = list.find(
    (p) =>
      p.id.toLowerCase() === key ||
      p.slug.toLowerCase() === key ||
      p.referenceNumber.toLowerCase() === key,
  );
  if (!match) {
    res.status(404).json({ statusCode: 404, error: 'NotFound', message: 'Published advisory not found.' });
    return;
  }
  res.json({ advisory: match });
});

// 8. Media Handling
publishingRouter.post(
  '/media/upload',
  staffAuthMiddleware,
  requireStaffRoles('author', 'admin'),
  (req: AuthenticatedStaffRequest, res: Response) => {
    try {
      const { fileName, mimeType, base64Data, altText, caption } = req.body || {};
      if (!fileName || !mimeType || !base64Data) {
        res.status(400).json({ error: 'BadRequest', message: 'fileName, mimeType, and base64Data are required.' });
        return;
      }
      const buffer = Buffer.from(base64Data, 'base64');
      const asset = mediaService.processUpload({
        fileName,
        mimeType,
        buffer,
        altText,
        caption,
        actor: req.staffUser!,
      });
      res.status(201).json({ success: true, asset });
    } catch (err: any) {
      res.status(400).json({ error: 'MediaUploadFailed', message: err.message });
    }
  },
);

// 9. Strict JSON 404 Catch-All for unknown /api/publishing/* endpoints (never falls through to HTML)
publishingRouter.use((req: Request, res: Response) => {
  res.status(404).json({
    statusCode: 404,
    error: 'NotFound',
    message: `Publishing API endpoint not found: ${req.method} ${req.originalUrl || req.url}`,
  });
});
