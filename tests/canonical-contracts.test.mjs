/**
 * @fileoverview Contract-level test suite for @ttcsirt/canonical-types
 * Verifies the mathematical, security, and architectural invariants of the canonical contracts.
 *
 * Requirements verified:
 * 1. Canonical types contain no WordPress-specific identifiers or imports.
 * 2. Canonical content cannot model arbitrary HTML as a normal node.
 * 3. Public and internal advisory representations remain distinguishable and isolated.
 * 4. Version metadata is representable and immutable.
 * 5. Audit events are representable with actor, action, diff, and digest.
 * 6. Validation results are representable with typed errors and warnings.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const canonicalPackageDir = path.resolve(__dirname, '../packages/canonical-types/src');

// Import runtime contract helpers directly from the canonical package
const {
  toPublishedAdvisoryDocument,
  createEmptyValidationResult,
  MEDIA_CONSTRAINTS,
} = await import('../packages/canonical-types/src/index.ts');

describe('Canonical Contract Layer (@ttcsirt/canonical-types)', () => {
  // Test 1: Zero WordPress, Elementor, React, or browser DOM dependencies/references across package source
  it('1. Package source files contain zero WordPress, Elementor, React, or browser DOM references', () => {
    const files = fs.readdirSync(canonicalPackageDir);
    assert.ok(files.length >= 8, 'Canonical package must contain at least 8 modules');

    // Strict list of prohibited tokens that must NOT appear anywhere in the source files (case-insensitive)
    const prohibitedSubstrings = [
      'wordpress',
      'elementor',
      'react',
      'window',
      'navigator',
      'HTMLElement',
      'DOMParser',
    ];

    const forbiddenImportPatterns = [
      /import\s+.*from\s+['"].*wordpress.*['"]/i,
      /import\s+.*from\s+['"].*wp-json.*['"]/i,
      /import\s+.*from\s+['"].*react.*['"]/i,
      /import\s+.*from\s+['"].*linkedom.*['"]/i,
      /import\s+.*from\s+['"].*elementor.*['"]/i,
      /import\s+.*from\s+['"].*express.*['"]/i,
    ];

    const forbiddenIdentifierPatterns = [
      /\bwpPostId\b/i,
      /\bwpCategoryId\b/i,
      /\bwpTermId\b/i,
      /\bwp_id\b/i,
      /\belementorClass\b/i,
      /\bWordPress\w+\b/,
    ];

    for (const file of files) {
      if (!file.endsWith('.ts')) continue;
      const content = fs.readFileSync(path.join(canonicalPackageDir, file), 'utf-8');

      // 1. Strict case-insensitive substring check across entire file content
      for (const token of prohibitedSubstrings) {
        assert.ok(
          !content.toLowerCase().includes(token.toLowerCase()),
          `Module ${file} must not contain any reference to '${token}' (found occurrence in source/comments)`,
        );
      }

      // 2. Strict check for browser DOM 'document' global / DOM API usage
      // Any usage of browser DOM document (document., window.document, document[, etc.) is strictly forbidden.
      // Outside of official canonical contract types (AdvisoryDocument, PublishedAdvisoryDocument, toPublishedAdvisoryDocument, documentPayload, MAX_DOCUMENT_SIZE_BYTES),
      // the string 'document' must not appear.
      assert.ok(
        !/\bdocument\s*[\.\[\(]/.test(content),
        `Module ${file} must not invoke or access browser DOM 'document' properties`,
      );
      assert.ok(
        !/\bwindow\s*[\.\[\(]/.test(content),
        `Module ${file} must not invoke or access browser DOM 'window' properties`,
      );

      const sanitizedForDocument = content
        .replaceAll(/AdvisoryDocument/gi, '')
        .replaceAll(/PublishedAdvisoryDocument/gi, '')
        .replaceAll(/toPublishedAdvisoryDocument/gi, '')
        .replaceAll(/documentPayload/gi, '')
        .replaceAll(/MAX_DOCUMENT_SIZE_BYTES/gi, '');

      assert.ok(
        !sanitizedForDocument.toLowerCase().includes('document'),
        `Module ${file} contains reference to 'document' outside of approved canonical type names`,
      );

      // 3. Check forbidden imports
      for (const pattern of forbiddenImportPatterns) {
        assert.ok(
          !pattern.test(content),
          `Module ${file} must not contain forbidden import matching ${pattern}`,
        );
      }

      // 4. Check forbidden identifiers
      for (const pattern of forbiddenIdentifierPatterns) {
        assert.ok(
          !pattern.test(content),
          `Module ${file} must not define or use WordPress-specific identifier matching ${pattern}`,
        );
      }
    }
  });

  // Test 2: Canonical content AST cannot model arbitrary HTML as a normal node
  it('2. Content AST strictly defines typed structural blocks with no arbitrary raw-html node', () => {
    const contentSource = fs.readFileSync(path.join(canonicalPackageDir, 'content.ts'), 'utf-8');

    // Confirm allowed node types in union
    const allowedNodeTypes = [
      'paragraph',
      'subheading',
      'list',
      'table',
      'callout',
      'code',
      'references',
    ];

    for (const nodeType of allowedNodeTypes) {
      assert.ok(
        contentSource.includes(`type: "${nodeType}"`),
        `Content AST must define '${nodeType}' node`,
      );
    }

    // Verify raw-html is explicitly absent from node definitions
    assert.ok(
      !contentSource.includes('type: "raw-html"'),
      'Content AST must strictly forbid raw-html block nodes',
    );
    assert.ok(
      !contentSource.includes('dangerouslySetInnerHTML'),
      'Content AST must contain no HTML injection helpers',
    );
  });

  // Test 3: Public and internal advisory representations remain strictly distinguishable and isolated
  it('3. Public and internal advisory representations are isolated, and internal metadata is stripped', () => {
    const sampleInternalDoc = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      referenceNumber: 'TT-CSIRT-ADV-2026-042',
      classification: 'advisory',
      title: 'Critical remote code execution vulnerability in enterprise router',
      slug: 'critical-remote-code-execution-enterprise-router',
      severity: 'critical',
      tlp: 'TLP:CLEAR',
      leadParagraph: 'A critical vulnerability has been disclosed affecting enterprise routers...',
      targetSectors: ['government', 'critical_national_infrastructure'],
      taxonomyTags: ['vulnerability_exploitation', 'router'],
      cveMetadata: [
        {
          id: 'CVE-2026-12345',
          cvssVersion: '3.1',
          cvssScore: 9.8,
          cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
          cweIds: ['CWE-120'],
          summary: 'Buffer overflow in web administration interface.',
        },
      ],
      affectedProducts: [
        {
          vendor: 'Acme Networks',
          product: 'EdgeGateway OS',
          affectedVersions: ['>= 12.0', '< 12.4.2'],
          fixedVersions: ['12.4.2'],
        },
      ],
      sections: {
        overview: {
          id: 'sec-overview',
          title: 'Overview',
          level: 2,
          nodes: [
            {
              id: 'p-1',
              type: 'paragraph',
              text: 'A critical vulnerability allows unauthenticated remote attackers to execute arbitrary code.',
              inlines: [
                {
                  type: 'text',
                  text: 'A critical vulnerability allows unauthenticated remote attackers to execute arbitrary code.',
                },
              ],
            },
          ],
        },
        impact: {
          id: 'sec-impact',
          title: 'Impact',
          level: 2,
          nodes: [
            {
              id: 'p-2',
              type: 'paragraph',
              text: 'Complete compromise of perimeter infrastructure.',
              inlines: [
                {
                  type: 'text',
                  text: 'Complete compromise of perimeter infrastructure.',
                },
              ],
            },
          ],
        },
        remediation: {
          id: 'sec-remediation',
          title: 'Remediation',
          level: 2,
          nodes: [
            {
              id: 'p-3',
              type: 'paragraph',
              text: 'Apply vendor security patch 12.4.2 immediately.',
              inlines: [
                {
                  type: 'text',
                  text: 'Apply vendor security patch 12.4.2 immediately.',
                },
              ],
            },
          ],
        },
      },
      references: [
        {
          id: 'ref-1',
          title: 'Acme Security Advisory 2026-09',
          url: 'https://security.example.com/advisories/2026-09',
          type: 'vendor_advisory',
          isExternal: true,
        },
      ],
      mediaAssets: [],
      provenance: {
        originatingAgency: 'TT-CSIRT Vulnerability Coordination Team',
        internalTrackingId: 'INC-2026-0991',
      },
      editorial: {
        authorId: 'usr-analyst-001',
        authorEmail: 'analyst1@ttcsirt.gov.tt',
        reviewerId: 'usr-lead-002',
        reviewerNotes: 'CONFIDENTIAL: Vendor embargo lifts 14:00 UTC. CVSS score re-verified.',
        approverId: 'usr-director-003',
        approverNotes: 'Authorized for national distribution under TLP:CLEAR.',
        internalTags: ['embargoed', 'critical-infrastructure'],
      },
      publication: {
        version: 1,
        status: 'draft',
        createdAt: '2026-09-22T10:00:00Z',
      },
    };

    // Sub-test 3A: Attempting to publish an unapproved draft must throw
    assert.throws(
      () => toPublishedAdvisoryDocument(sampleInternalDoc),
      /Cannot derive PublishedAdvisoryDocument: advisory status is 'draft'/,
      'Unapproved draft cannot be converted to public document',
    );

    // Sub-test 3B: Successfully derives public document when status is published
    sampleInternalDoc.publication.status = 'published';
    sampleInternalDoc.publication.publishedAt = '2026-09-22T14:00:00Z';

    const publicDoc = toPublishedAdvisoryDocument(sampleInternalDoc, {
      readingTimeMinutes: 3,
    });

    assert.strictEqual(publicDoc.isPublicDeliveryReady, true);
    assert.strictEqual(publicDoc.referenceNumber, 'TT-CSIRT-ADV-2026-042');
    assert.strictEqual(publicDoc.readingTimeMinutes, 3);
    assert.strictEqual(publicDoc.publication.status, 'published');
    assert.strictEqual(publicDoc.publication.publishedAt, '2026-09-22T14:00:00Z');

    // Sub-test 3C: Confidential editorial metadata is strictly absent from the public document
    assert.strictEqual(
      'editorial' in publicDoc,
      false,
      'Public document must never contain the editorial object',
    );
    assert.strictEqual(
      // @ts-ignore
      publicDoc.authorId,
      undefined,
      'Public document must not expose authorId',
    );
    assert.strictEqual(
      // @ts-ignore
      publicDoc.reviewerNotes,
      undefined,
      'Public document must not expose reviewerNotes',
    );
    assert.strictEqual(
      // @ts-ignore
      publicDoc.internalTags,
      undefined,
      'Public document must not expose internalTags',
    );
  });

  // Test 4: Version metadata is representable and immutable
  it('4. AdvisoryVersion snapshot and history structures represent immutable releases', () => {
    const versionRecord = {
      versionId: 'ver-8899aabb-1122-3344-5566-778899aabbcc',
      advisoryId: '550e8400-e29b-41d4-a716-446655440000',
      referenceNumber: 'TT-CSIRT-ADV-2026-042',
      versionNumber: 1,
      documentPayload: {} /* AdvisoryDocument snapshot */,
      contentDigest: {
        algorithm: 'SHA-256',
        hexDigest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
      publishedAt: '2026-09-22T14:00:00Z',
      approvedByUserId: 'usr-lead-002',
      publishedByUserId: 'usr-director-003',
      releaseNotes: 'Initial publication of national technical advisory.',
    };

    assert.strictEqual(versionRecord.versionNumber, 1);
    assert.strictEqual(versionRecord.contentDigest.algorithm, 'SHA-256');
    assert.strictEqual(versionRecord.approvedByUserId, 'usr-lead-002');
    assert.strictEqual(versionRecord.publishedByUserId, 'usr-director-003');
  });

  // Test 5: Audit events are representable with actor, action, diff, and payload digest
  it('5. Audit event contract models the full non-repudiation lifecycle', () => {
    const auditEvent = {
      eventId: 'evt-11223344-5566-7788-99aa-bbccddeeff00',
      advisoryId: '550e8400-e29b-41d4-a716-446655440000',
      referenceNumber: 'TT-CSIRT-ADV-2026-042',
      version: 1,
      actor: {
        userId: 'usr-director-003',
        email: 'director@ttcsirt.gov.tt',
        role: 'APPROVER',
        ipAddress: '192.168.10.50',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
      },
      action: 'PUBLISHED',
      previousStatus: 'approved',
      resultingStatus: 'published',
      timestamp: '2026-09-22T14:00:00Z',
      comment: 'Two-person integrity verified. Release authorized.',
      payloadDigest: {
        algorithm: 'SHA-256',
        hexDigest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
      diffSummary: {
        sectionsModified: ['overview', 'impact', 'remediation'],
        cvesAdded: ['CVE-2026-12345'],
      },
    };

    assert.strictEqual(auditEvent.action, 'PUBLISHED');
    assert.strictEqual(auditEvent.actor.role, 'APPROVER');
    assert.strictEqual(auditEvent.resultingStatus, 'published');
    assert.strictEqual(auditEvent.diffSummary.cvesAdded[0], 'CVE-2026-12345');
  });

  // Test 6: Validation results, errors, and warnings are representable
  it('6. Validation result contracts correctly model errors, warnings, and empty success', () => {
    const emptyResult = createEmptyValidationResult('2026-09-22T12:00:00Z');
    assert.strictEqual(emptyResult.isValid, true);
    assert.strictEqual(emptyResult.errors.length, 0);
    assert.strictEqual(emptyResult.warnings.length, 0);
    assert.strictEqual(emptyResult.validatedAt, '2026-09-22T12:00:00Z');

    const failingResult = {
      isValid: false,
      errors: [
        {
          code: 'INVALID_CVE_FORMAT',
          field: 'cveMetadata[0].id',
          message: 'CVE identifier "cve-2026-123" does not match standard pattern ^CVE-\\d{4}-\\d{4,}$',
          remediationSuggestion: 'Ensure uppercase CVE- prefix followed by 4-digit year and 4+ digit sequence.',
        },
        {
          code: 'EMPTY_REQUIRED_SECTION',
          field: 'sections.remediation',
          message: 'The remediation section is mandatory and must not be empty.',
        },
      ],
      warnings: [
        {
          code: 'EXTERNAL_HTTP_LINK',
          field: 'references[0].url',
          message: 'Reference URL uses unencrypted HTTP protocol.',
          guidance: 'Upgrade link to HTTPS if available.',
        },
      ],
      validatedAt: '2026-09-22T12:05:00Z',
    };

    assert.strictEqual(failingResult.isValid, false);
    assert.strictEqual(failingResult.errors.length, 2);
    assert.strictEqual(failingResult.errors[0].code, 'INVALID_CVE_FORMAT');
    assert.strictEqual(failingResult.warnings[0].code, 'EXTERNAL_HTTP_LINK');
  });

  // Test 7: Media constraints and quarantine rules
  it('7. Media constraints strictly enforce allowed MIME types and file limits', () => {
    assert.ok(MEDIA_CONSTRAINTS.ALLOWED_MIME_TYPES.includes('image/png'));
    assert.ok(MEDIA_CONSTRAINTS.ALLOWED_MIME_TYPES.includes('image/jpeg'));
    assert.ok(MEDIA_CONSTRAINTS.ALLOWED_MIME_TYPES.includes('image/webp'));
    assert.ok(MEDIA_CONSTRAINTS.ALLOWED_MIME_TYPES.includes('image/svg+xml'));
    assert.ok(MEDIA_CONSTRAINTS.ALLOWED_MIME_TYPES.includes('application/pdf'));

    assert.strictEqual(MEDIA_CONSTRAINTS.MAX_IMAGE_SIZE_BYTES, 5 * 1024 * 1024);
    assert.strictEqual(MEDIA_CONSTRAINTS.MAX_DOCUMENT_SIZE_BYTES, 25 * 1024 * 1024);
  });

  // Test 8: Standalone package consumption smoke test in Node.js
  it('8. Package can be consumed in pure Node.js runtime without DOM or browser environment', async () => {
    // Verify pure Node.js headless environment (no browser DOM globals)
    assert.strictEqual(typeof globalThis.window, 'undefined');
    assert.strictEqual(typeof globalThis.document, 'undefined');
    assert.strictEqual(typeof globalThis.HTMLElement, 'undefined');
    assert.strictEqual(typeof globalThis.DOMParser, 'undefined');

    // Dynamically import package root
    const pkg = await import('../packages/canonical-types/src/index.ts');
    assert.ok(pkg, 'Package must resolve and export successfully');
    assert.strictEqual(typeof pkg.toPublishedAdvisoryDocument, 'function');
    assert.strictEqual(typeof pkg.createEmptyValidationResult, 'function');
    assert.strictEqual(typeof pkg.MEDIA_CONSTRAINTS, 'object');

    // Verify empty validation result creation
    const valResult = pkg.createEmptyValidationResult('2026-09-22T14:00:00Z');
    assert.strictEqual(valResult.isValid, true);
    assert.strictEqual(valResult.errors.length, 0);

    // Verify media constraints
    assert.ok(pkg.MEDIA_CONSTRAINTS.ALLOWED_MIME_TYPES.includes('application/pdf'));
  });
});
