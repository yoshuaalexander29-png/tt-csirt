/**
 * @fileoverview Standalone Node.js Smoke Test for @ttcsirt/canonical-types
 * Proves that the canonical contract package can be imported and executed
 * in a pure Node.js runtime environment with zero DOM, zero React, and zero Vite.
 */

import assert from 'node:assert';

// 1. Verify strict headless environment (no browser DOM globals)
assert.strictEqual(typeof globalThis.window, 'undefined', 'globalThis.window must be undefined in pure Node.js');
assert.strictEqual(typeof globalThis.document, 'undefined', 'globalThis.document must be undefined in pure Node.js');
assert.strictEqual(typeof globalThis.HTMLElement, 'undefined', 'globalThis.HTMLElement must be undefined in pure Node.js');
assert.strictEqual(typeof globalThis.DOMParser, 'undefined', 'globalThis.DOMParser must be undefined in pure Node.js');

// 2. Import canonical package directly from pure Node.js
const canonical = await import('../packages/canonical-types/src/index.ts');

assert.ok(canonical, 'Canonical package must resolve and export successfully');
assert.strictEqual(typeof canonical.toPublishedAdvisoryDocument, 'function');
assert.strictEqual(typeof canonical.createEmptyValidationResult, 'function');
assert.strictEqual(typeof canonical.MEDIA_CONSTRAINTS, 'object');

// 3. Test runtime functions in pure Node.js
const emptyValidation = canonical.createEmptyValidationResult('2026-09-22T12:00:00Z');
assert.strictEqual(emptyValidation.isValid, true);
assert.strictEqual(emptyValidation.errors.length, 0);

// 4. Test pure projection function in pure Node.js
const mockAdvisory = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  referenceNumber: 'TT-CSIRT-ADV-2026-999',
  classification: 'advisory',
  title: 'Critical Gateway Remote Code Execution',
  slug: 'critical-gateway-remote-code-execution',
  severity: 'critical',
  tlp: 'TLP:CLEAR',
  leadParagraph: 'A critical vulnerability allows unauthenticated attackers to execute remote code.',
  targetSectors: ['government', 'critical_national_infrastructure'],
  taxonomyTags: ['rce', 'firewall'],
  cveMetadata: [
    {
      id: 'CVE-2026-99999',
      cvssVersion: '3.1',
      cvssScore: 10.0,
      cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H',
      summary: 'Critical heap buffer overflow in web administrative interface',
    },
  ],
  affectedProducts: [
    {
      vendor: 'SecureGate Corp',
      product: 'EdgeOS',
      affectedVersions: ['>= 10.0.0', '< 10.4.5'],
      fixedVersions: ['10.4.5'],
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
          text: 'Vulnerability details and scope of impact.',
          inlines: [{ type: 'text', text: 'Vulnerability details and scope of impact.' }],
        },
      ],
    },
  },
  references: [
    {
      id: 'ref-1',
      title: 'Vendor Security Bulletin',
      url: 'https://security.example.com/advisories/2026-999',
      type: 'vendor_advisory',
    },
  ],
  mediaAssets: [],
  provenance: {
    originatingAgency: 'TT-CSIRT Vulnerability Coordination',
  },
  editorial: {
    authorId: 'user-sec-01',
    authorEmail: 'analyst@ttcsirt.gov.tt',
    reviewerId: 'user-rev-02',
    reviewerNotes: 'CONFIDENTIAL: Internal vulnerability analysis notes',
    internalTags: ['confidential-review', 'high-priority'],
  },
  publication: {
    version: 1,
    status: 'published',
    publishedAt: '2026-09-22T10:00:00Z',
  },
};

const published = canonical.toPublishedAdvisoryDocument(mockAdvisory, { readingTimeMinutes: 3 });

assert.strictEqual(published.id, mockAdvisory.id);
assert.strictEqual(published.isPublicDeliveryReady, true);
assert.strictEqual(published.readingTimeMinutes, 3);
// Invariant check: private editorial properties MUST NOT exist on published representation
assert.strictEqual('editorial' in published, false, 'Editorial metadata must not exist on published advisory');
assert.strictEqual('provenance' in published, false, 'Provenance metadata must not exist on published advisory');
assert.strictEqual('authorId' in published, false);
assert.strictEqual('reviewerNotes' in published, false);

console.log('✓ Smoke test passed: @ttcsirt/canonical-types imports and executes cleanly in standalone Node.js');
