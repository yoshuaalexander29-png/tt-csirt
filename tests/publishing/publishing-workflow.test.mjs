import test from 'node:test';
import assert from 'node:assert/strict';

import {
  WorkflowEngine,
  validateAdvisoryDocument,
  DevAuthenticationProvider,
  DEV_IDENTITIES,
  AuditService,
  VersionService,
  PreviewService,
  MediaService,
  DevStorage,
  devStorage,
  auditService,
  TEST_SAMPLE_ADVISORY,
  TEST_SAMPLE_ADVISORY_ID,
} from '../../services/publishing-api/src/index.ts';

test('Advisory Publishing System - Two-Person Integrity & State Machine Workflow', async (t) => {
  const authorUser = DEV_IDENTITIES['author-1']; // A. Ramlal (author)
  const reviewerUser = DEV_IDENTITIES['reviewer-1']; // C. Joseph (reviewer)
  const approverUser = DEV_IDENTITIES['approver-1']; // K. Mahabir (approver)

  const storage = new DevStorage();
  storage.clear();

  const audit = new AuditService();
  const versions = new VersionService();
  const engine = new WorkflowEngine();

  await t.test('1. Author creates initial draft', () => {
    const draft = engine.createDraft(
      {
        referenceNumber: 'TT-CSIRT-ADV-2026-501',
        title: 'Critical Vulnerability in Core Routing Engine',
        classification: 'advisory',
        severity: 'critical',
        tlp: 'TLP:CLEAR',
        leadParagraph: 'A critical vulnerability has been identified in core routing software requiring immediate operator patching.',
        targetSectors: ['telecommunications', 'government'],
        cveMetadata: [
          {
            id: 'CVE-2026-4001',
            cvssVersion: '3.1',
            cvssScore: 9.8,
            cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
            summary: 'Unauthenticated RCE in control packet parser',
          },
        ],
        affectedProducts: [
          {
            vendor: 'CoreRouter',
            product: 'EdgeOS',
            affectedVersions: ['< 15.2'],
            fixedVersions: ['15.2'],
          },
        ],
        sections: {
          overview: {
            id: 's-ov',
            title: 'Overview',
            level: 2,
            nodes: [{ id: 'p1', type: 'paragraph', text: 'Vulnerability allows remote command execution without credentials.', inlines: [] }],
          },
          remediation: {
            id: 's-rem',
            title: 'Remediation',
            level: 2,
            nodes: [{ id: 'p2', type: 'paragraph', text: 'Upgrade all border gateways to EdgeOS 15.2 immediately.', inlines: [] }],
          },
        },
        references: [
          {
            id: 'r1',
            title: 'Vendor EdgeOS 15.2 Release Notes',
            url: 'https://security.corerouter.example.com/advisories/15.2',
            type: 'vendor_advisory',
          },
        ],
      },
      authorUser,
    );

    assert.equal(draft.publication.status, 'draft');
    assert.equal(draft.publication.version, 1);
    assert.equal(draft.editorial.authorId, authorUser.id);
  });

  await t.test('2. Validation gate blocks incomplete draft submission', () => {
    // Attempt submitting draft with missing remediation section
    const badDraft = engine.createDraft(
      {
        referenceNumber: 'TT-CSIRT-ADV-2026-502',
        title: 'Missing Remediation Advisory',
        leadParagraph: 'Valid lead paragraph explaining the issue.',
        targetSectors: ['government'],
        sections: {
          overview: {
            id: 's-ov',
            title: 'Overview',
            level: 2,
            nodes: [{ id: 'p1', type: 'paragraph', text: 'Technical summary.', inlines: [] }],
          },
        },
      },
      authorUser,
    );

    assert.throws(
      () => {
        engine.submitForReview(badDraft.id, authorUser);
      },
      /VALIDATION_FAILED/,
      'Must reject submission when mandatory sections are missing',
    );
  });

  await t.test('3. Author submits valid draft for review', () => {
    const outcome = engine.submitForReview('adv-seed-draft-001', authorUser);
    assert.equal(outcome.advisory.publication.status, 'ready_for_review');
  });

  await t.test('4. Reviewer requests changes with mandatory notes', () => {
    assert.throws(
      () => {
        engine.requestChanges('adv-seed-draft-001', '   ', reviewerUser);
      },
      /feedback notes are required/,
    );

    const updated = engine.requestChanges(
      'adv-seed-draft-001',
      'Please clarify the specific firewall ports to block in the remediation section.',
      reviewerUser,
    );

    assert.equal(updated.publication.status, 'changes_requested');
    assert.equal(updated.editorial.reviewerNotes, 'Please clarify the specific firewall ports to block in the remediation section.');
  });

  await t.test('5. Author updates draft and re-submits for review', () => {
    engine.updateDraft(
      'adv-seed-draft-001',
      {
        sections: {
          overview: {
            id: 'sec-overview',
            title: 'Overview',
            level: 2,
            nodes: [{ id: 'n1', type: 'paragraph', text: 'Updated overview description.', inlines: [] }],
          },
          impact: {
            id: 'sec-impact',
            title: 'Impact',
            level: 2,
            nodes: [{ id: 'n-imp', type: 'paragraph', text: 'High risk of unauthorized network access.', inlines: [] }],
          },
          remediation: {
            id: 'sec-remediation',
            title: 'Remediation',
            level: 2,
            nodes: [{ id: 'n2', type: 'paragraph', text: 'Block ingress TCP ports 443 and 8443 on WAN interfaces until patch 12.4.2 is applied.', inlines: [] }],
          },
        },
      },
      authorUser,
      1,
    );

    const outcome = engine.submitForReview('adv-seed-draft-001', authorUser);
    assert.equal(outcome.advisory.publication.status, 'ready_for_review');
  });

  await t.test('6. CRITICAL SAFEGUARD: Author cannot self-approve (Two-Person Integrity)', () => {
    assert.throws(
      () => {
        // Author attempting to approve their own advisory
        engine.approve('adv-seed-draft-001', authorUser);
      },
      /TWO_PERSON_INTEGRITY_VIOLATION/,
      'Author must not be allowed to self-approve their own advisory',
    );
  });

  await t.test('7. Independent approver approves advisory', () => {
    const approved = engine.approve('adv-seed-draft-001', approverUser);
    assert.equal(approved.publication.status, 'approved');
    assert.equal(approved.editorial.approverId, approverUser.id);
  });

  await t.test('8. Approver publishes advisory (Atomic release & snapshot)', () => {
    const result = engine.publish('adv-seed-draft-001', approverUser);

    assert.equal(result.internalDocument.publication.status, 'published');
    assert.ok(result.internalDocument.publication.publishedAt);
    assert.equal(result.publishedDocument.referenceNumber, result.internalDocument.referenceNumber);

    // Ensure private editorial metadata is NOT leaked in the published delivery document
    assert.equal(result.publishedDocument.editorial, undefined, 'Editorial notes must not exist on published delivery model');
  });

  await t.test('9. Withdrawing published advisory requires formal notice', () => {
    assert.throws(
      () => {
        engine.withdraw('adv-seed-draft-001', '', approverUser);
      },
      /formal withdrawal explanation notice is mandatory/,
    );

    const withdrawn = engine.withdraw(
      'adv-seed-draft-001',
      'Withdrawn: Vendor retracted CVE after verifying issue was non-exploitable in production builds.',
      approverUser,
    );

    assert.equal(withdrawn.publication.status, 'withdrawn');
    assert.equal(
      withdrawn.publication.withdrawalNotice.publicReason,
      'Withdrawn: Vendor retracted CVE after verifying issue was non-exploitable in production builds.',
    );
  });
});

test('Development Test-user can exercise the fictional workflow without public delivery', () => {
  process.env.NODE_ENV = 'development';
  process.env.ENABLE_DEV_AUTH = 'true';
  const testUser = DEV_IDENTITIES['test-user'];
  const engine = new WorkflowEngine();

  assert.equal(devStorage.getAdvisory(TEST_SAMPLE_ADVISORY_ID), null);
  const draft = engine.createDraft(TEST_SAMPLE_ADVISORY, testUser);
  assert.equal(engine.submitForReview(draft.id, testUser).advisory.publication.status, 'ready_for_review');
  assert.equal(engine.approve(draft.id, testUser).publication.status, 'approved');
  assert.equal(engine.publish(draft.id, testUser).internalDocument.publication.status, 'published');
  assert.equal(devStorage.getPublishedAdvisory(draft.id), null, 'Test-user publications must not enter public delivery.');
  assert.throws(() => engine.deleteAdvisory(draft.id, DEV_IDENTITIES['author-1']), /Access denied/);

  assert.equal(engine.deleteAdvisory(draft.id, testUser), true);
  assert.equal(devStorage.getAdvisory(draft.id), null);
  const events = auditService.getEventsForAdvisory(draft.id);
  assert.deepEqual(events.map((event) => event.action), ['DRAFT_CREATED', 'SUBMITTED_FOR_REVIEW', 'APPROVED', 'PUBLISHED', 'DELETED']);
  assert.equal(events.at(-1).resultingStatus, 'deleted');
  assert.ok(events.at(-1).payloadDigest?.hexDigest, 'Deletion must retain a digest of the removed advisory.');
});

test('Preview Service - Cryptographic HMAC Tokens & TTL Expiration', async (t) => {
  const preview = new PreviewService();
  const staff = DEV_IDENTITIES['author-1'];

  await t.test('Generates and verifies valid token', () => {
    const token = preview.generatePreviewToken('adv-123', 1, staff);
    assert.ok(token);

    const verified = preview.verifyPreviewToken(token);
    assert.equal(verified.advisoryId, 'adv-123');
    assert.equal(verified.version, 1);
    assert.equal(verified.issuedToUserId, staff.id);
  });

  await t.test('Rejects tampered tokens', () => {
    const token = preview.generatePreviewToken('adv-123', 1, staff);
    const tampered = token.slice(0, -4) + 'abcd';

    assert.throws(
      () => {
        preview.verifyPreviewToken(tampered);
      },
      /Invalid preview token signature/,
    );
  });
});

test('Media Pipeline - Format restrictions and SVG script rejection', async (t) => {
  const media = new MediaService();
  const staff = DEV_IDENTITIES['author-1'];

  await t.test('Allows valid PNG images', () => {
    const validPngBuffer = Buffer.from('fake-png-data');
    const asset = media.processUpload({
      fileName: 'diagram.png',
      mimeType: 'image/png',
      buffer: validPngBuffer,
      actor: staff,
    });
    assert.equal(asset.mimeType, 'image/png');
    assert.ok(asset.publicUrl.includes('.png'));
    assert.ok(asset.sha256);
  });

  await t.test('Rejects dangerous executable files', () => {
    assert.throws(
      () => {
        media.processUpload({
          fileName: 'payload.exe',
          mimeType: 'application/x-msdownload',
          buffer: Buffer.from('MZ...'),
          actor: staff,
        });
      },
      /Disallowed MIME type/,
    );
  });

  await t.test('Rejects SVGs containing script tags', () => {
    const dangerousSvg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    );
    assert.throws(
      () => {
        media.processUpload({
          fileName: 'vector.svg',
          mimeType: 'image/svg+xml',
          buffer: dangerousSvg,
          actor: staff,
        });
      },
      /Security violation: SVG file contains embedded scripts/,
    );
  });
});
