import type { AdvisoryDocument } from '@ttcsirt/canonical-types';

export const TEST_SAMPLE_ADVISORY_ID_PREFIX = 'adv-test-user-sample-';
export const TEST_SAMPLE_ADVISORY_ID = `${TEST_SAMPLE_ADVISORY_ID_PREFIX}001`;

export const TEST_SAMPLE_ADVISORY: Partial<AdvisoryDocument> = {
  id: TEST_SAMPLE_ADVISORY_ID,
  referenceNumber: 'TT-CSIRT-ADV-2099-001',
  classification: 'advisory',
  title: 'Test only: fictional advisory for workflow practice',
  slug: 'test-only-fictional-advisory-workflow-practice',
  severity: 'low',
  tlp: 'TLP:CLEAR',
  leadParagraph: 'This fictional training record describes no real product, incident, vulnerability or operational action.',
  targetSectors: ['citizens_and_families'],
  taxonomyTags: ['test-only'],
  cveMetadata: [],
  affectedProducts: [{
    vendor: 'Fictional example vendor',
    product: 'Fictional training application',
    affectedVersions: ['Training example only'],
    fixedVersions: [],
  }],
  sections: {
    overview: {
      id: 'test-overview', title: 'Overview', level: 2,
      nodes: [{
        id: 'test-overview-paragraph', type: 'paragraph',
        text: 'Test only. This fictional scenario exists to practise the advisory workflow.',
        inlines: [{ type: 'text', text: 'Test only. This fictional scenario exists to practise the advisory workflow.' }],
      }],
    },
    impact: {
      id: 'test-impact', title: 'Impact', level: 2,
      nodes: [{
        id: 'test-impact-paragraph', type: 'paragraph',
        text: 'There is no real vulnerability, affected system or impact in this training example.',
        inlines: [{ type: 'text', text: 'There is no real vulnerability, affected system or impact in this training example.' }],
      }],
    },
    remediation: {
      id: 'test-remediation', title: 'Remediation', level: 2,
      nodes: [{
        id: 'test-remediation-paragraph', type: 'paragraph',
        text: 'No operational action is required. Use this record only to test authoring, review, approval and publication controls.',
        inlines: [{ type: 'text', text: 'No operational action is required. Use this record only to test authoring, review, approval and publication controls.' }],
      }],
    },
  },
  references: [{
    id: 'test-reference-1',
    title: 'Fictional test reference (not a real security source)',
    url: 'https://example.invalid/test-user-workflow-reference',
    type: 'vendor_advisory',
    isExternal: true,
  }],
  mediaAssets: [],
};
