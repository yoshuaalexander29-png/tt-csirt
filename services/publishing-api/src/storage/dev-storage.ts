/**
 * @fileoverview Environment-partitioned publishing persistence store.
 * Seed fixtures are development-only; production hydrates only persisted records.
 */

import type { AdvisoryDocument, PublishedAdvisoryDocument } from '@ttcsirt/canonical-types';
import { toPublishedAdvisoryDocument } from '@ttcsirt/canonical-types';
import { TEST_USER_ID } from '../auth/dev-identities.ts';
import { TEST_SAMPLE_ADVISORY_ID_PREFIX } from '../test-fixtures/sample-advisory.ts';
import { readJsonArray, writeJsonArray } from './json-file.ts';

export const LEGACY_DEVELOPMENT_SEED_IDS = new Set([
  'adv-seed-draft-001',
  'adv-seed-review-002',
  'adv-seed-published-003',
  'adv-seed-published-460',
]);

export class PublishingStorage {
  // Map of advisoryId -> AdvisoryDocument (internal control plane)
  private advisories: Map<string, AdvisoryDocument> = new Map();
  // Map of advisoryId -> PublishedAdvisoryDocument (public delivery plane)
  private publishedAdvisories: Map<string, PublishedAdvisoryDocument> = new Map();
  private readonly persistencePath?: string;
  private isHydrating = true;

  constructor(persistencePath = process.env.TTCSIRT_PUBLISHING_STORE_PATH) {
    this.persistencePath = persistencePath;
    if (process.env.NODE_ENV !== 'production') this.seedInitialData();
    this.loadPersistedAdvisories();
    this.isHydrating = false;
  }

  getAdvisory(id: string): AdvisoryDocument | null {
    const doc = this.advisories.get(id);
    return doc ? JSON.parse(JSON.stringify(doc)) : null;
  }

  getAdvisoryByReference(ref: string): AdvisoryDocument | null {
    for (const doc of this.advisories.values()) {
      if (doc.referenceNumber.toLowerCase() === ref.toLowerCase()) {
        return JSON.parse(JSON.stringify(doc));
      }
    }
    return null;
  }

  listAdvisories(): AdvisoryDocument[] {
    return Array.from(this.advisories.values())
      .sort((a, b) => new Date(b.publication.createdAt).getTime() - new Date(a.publication.createdAt).getTime())
      .map((d) => JSON.parse(JSON.stringify(d)));
  }

  saveAdvisory(doc: AdvisoryDocument): void {
    // Exclude known pre-isolation fixtures that may remain in an older shared store.
    if (process.env.NODE_ENV === 'production' && LEGACY_DEVELOPMENT_SEED_IDS.has(doc.id)) return;

    const previousDoc = this.advisories.get(doc.id);
    const previousPublished = this.publishedAdvisories.get(doc.id);
    this.advisories.set(doc.id, JSON.parse(JSON.stringify(doc)));

    // Defense in depth; environment-specific authentication, seeds, and persistence are the production boundary.
    if (doc.id.startsWith(TEST_SAMPLE_ADVISORY_ID_PREFIX) || doc.editorial.approverId === TEST_USER_ID) {
      this.publishedAdvisories.delete(doc.id);
      try {
        this.persistAdvisories();
      } catch (error) {
        this.restoreAdvisory(doc.id, previousDoc, previousPublished);
        throw error;
      }
      return;
    }

    // If published, superseded, or withdrawn (with publishedAt), cache in delivery plane
    if (
      (doc.publication.status === 'published' ||
        doc.publication.status === 'superseded' ||
        doc.publication.status === 'withdrawn') &&
      doc.publication.publishedAt
    ) {
      try {
        const pub = toPublishedAdvisoryDocument(doc);
        this.publishedAdvisories.set(doc.id, pub);
      } catch (err) {
        console.warn(`Could not project published document for ${doc.id}:`, err);
      }
    } else {
      this.publishedAdvisories.delete(doc.id);
    }
    try {
      this.persistAdvisories();
    } catch (error) {
      this.restoreAdvisory(doc.id, previousDoc, previousPublished);
      throw error;
    }
  }

  deleteAdvisory(id: string): boolean {
    const previousDoc = this.advisories.get(id);
    const previousPublished = this.publishedAdvisories.get(id);
    this.publishedAdvisories.delete(id);
    const deleted = this.advisories.delete(id);
    try {
      this.persistAdvisories();
    } catch (error) {
      this.restoreAdvisory(id, previousDoc, previousPublished);
      throw error;
    }
    return deleted;
  }

  listPublishedAdvisories(): PublishedAdvisoryDocument[] {
    return Array.from(this.publishedAdvisories.values())
      .sort((a, b) => new Date(b.publication.publishedAt).getTime() - new Date(a.publication.publishedAt).getTime());
  }

  getPublishedAdvisory(id: string): PublishedAdvisoryDocument | null {
    return this.publishedAdvisories.get(id) || null;
  }

  clear(): void {
    this.advisories.clear();
    this.publishedAdvisories.clear();
    this.persistAdvisories();
  }

  private loadPersistedAdvisories(): void {
    if (!this.persistencePath) return;

    try {
      const persisted = readJsonArray<AdvisoryDocument>(this.persistencePath);
      for (const doc of persisted) {
        if (
          !doc || typeof doc.id !== 'string' || !doc.publication?.publishedAt ||
          !['published', 'superseded', 'withdrawn'].includes(doc.publication.status) ||
          (process.env.NODE_ENV === 'production' && LEGACY_DEVELOPMENT_SEED_IDS.has(doc.id))
        ) continue;
        this.saveAdvisory(doc);
      }
    } catch (err) {
      console.error('Could not load persisted publishing records:', err);
    }
  }

  private restoreAdvisory(
    id: string,
    previousDoc: AdvisoryDocument | undefined,
    previousPublished: PublishedAdvisoryDocument | undefined,
  ): void {
    if (previousDoc) this.advisories.set(id, previousDoc);
    else this.advisories.delete(id);
    if (previousPublished) this.publishedAdvisories.set(id, previousPublished);
    else this.publishedAdvisories.delete(id);
  }

  private persistAdvisories(): void {
    if (this.isHydrating || !this.persistencePath) return;

    const records = Array.from(this.advisories.values()).filter((doc) =>
      doc.publication.publishedAt &&
      ['published', 'superseded', 'withdrawn'].includes(doc.publication.status) &&
      !doc.id.startsWith(TEST_SAMPLE_ADVISORY_ID_PREFIX) &&
      doc.editorial.approverId !== TEST_USER_ID,
    );

    writeJsonArray(this.persistencePath, records);
  }

  private seedInitialData(): void {
    // 1. A Draft advisory authored by A. Ramlal
    const draftAdv: AdvisoryDocument = {
      id: 'adv-seed-draft-001',
      referenceNumber: 'TT-CSIRT-ADV-2026-101',
      classification: 'advisory',
      title: 'Active Exploitation of Edge VPN Gateway Zero-Day Vulnerability',
      slug: 'active-exploitation-edge-vpn-gateway-zero-day',
      severity: 'critical',
      tlp: 'TLP:CLEAR',
      leadParagraph:
        'TT-CSIRT has received verified reports of threat actors actively weaponizing a remote code execution vulnerability in enterprise VPN gateways deployed across Trinidad and Tobago critical infrastructure.',
      targetSectors: ['government', 'critical_national_infrastructure', 'financial_services'],
      taxonomyTags: ['zero-day', 'vpn', 'remote-code-execution', 'cve-2026-3101'],
      cveMetadata: [
        {
          id: 'CVE-2026-3101',
          cvssVersion: '3.1',
          cvssScore: 9.8,
          cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
          cweIds: ['CWE-120'],
          summary: 'Buffer copy without checking size of input leading to unauthenticated RCE.',
        },
      ],
      affectedProducts: [
        {
          vendor: 'Apex Networks',
          product: 'SecureEdge VPN Appliance',
          affectedVersions: ['>= 12.0.0', '< 12.4.2'],
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
              id: 'n-ov-1',
              type: 'paragraph',
              text: 'A critical vulnerability in the web management daemon allows unauthenticated remote attackers to execute arbitrary commands with root privileges by sending a specially crafted HTTP request.',
              inlines: [
                {
                  type: 'text',
                  text: 'A critical vulnerability in the web management daemon allows unauthenticated remote attackers to execute arbitrary commands with root privileges by sending a specially crafted HTTP request.',
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
              id: 'n-imp-1',
              type: 'paragraph',
              text: 'Successful exploitation results in full firewall takeover, exfiltration of corporate credentials, and establishment of persistent lateral movement channels.',
              inlines: [
                {
                  type: 'text',
                  text: 'Successful exploitation results in full firewall takeover, exfiltration of corporate credentials, and establishment of persistent lateral movement channels.',
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
              id: 'n-rem-1',
              type: 'paragraph',
              text: 'Apply emergency security hotfix 12.4.2 immediately. If patching cannot be completed within 12 hours, isolate management interfaces from public routing.',
              inlines: [
                {
                  type: 'text',
                  text: 'Apply emergency security hotfix 12.4.2 immediately. If patching cannot be completed within 12 hours, isolate management interfaces from public routing.',
                },
              ],
            },
          ],
        },
      },
      references: [
        {
          id: 'ref-1',
          title: 'Vendor Advisory - Apex Security Bulletin 2026-B9',
          url: 'https://security.example.com/advisories/apex-2026-b9',
          type: 'vendor_advisory',
          isExternal: true,
        },
      ],
      mediaAssets: [],
      provenance: {
        originatingAgency: 'TT-CSIRT Vulnerability Coordination Unit',
      },
      editorial: {
        authorId: 'usr-author-001',
        authorEmail: 'a.ramlal@ttcsirt.gov.tt',
        internalTags: ['urgent-telecom', 'cni-priority'],
      },
      publication: {
        version: 1,
        status: 'draft',
        createdAt: '2026-09-22T08:00:00Z',
      },
    };

    // 2. A Ready-for-Review advisory submitted by Ramlal, awaiting Reviewer/Approver
    const inReviewAdv: AdvisoryDocument = {
      ...JSON.parse(JSON.stringify(draftAdv)),
      id: 'adv-seed-review-002',
      referenceNumber: 'TT-CSIRT-ADV-2026-102',
      title: 'Multiple Vulnerabilities in Apache HTTP Server and OpenSSL Cryptographic Library',
      slug: 'multiple-vulnerabilities-apache-http-server-openssl',
      severity: 'high',
      editorial: {
        authorId: 'usr-author-001',
        authorEmail: 'a.ramlal@ttcsirt.gov.tt',
        reviewerNotes: 'Submitted for peer review. Verified CVSS vectors against NVD feed.',
      },
      publication: {
        version: 1,
        status: 'ready_for_review',
        createdAt: '2026-09-21T10:00:00Z',
      },
    };

    // 3. A Published advisory
    const publishedAdv: AdvisoryDocument = {
      ...JSON.parse(JSON.stringify(draftAdv)),
      id: 'adv-seed-published-003',
      referenceNumber: 'TT-CSIRT-ADV-2026-099',
      title: 'Critical Ransomware Campaign Impersonating National Tax Notices',
      slug: 'critical-ransomware-campaign-impersonating-national-tax-notices',
      severity: 'high',
      editorial: {
        authorId: 'usr-author-001',
        authorEmail: 'a.ramlal@ttcsirt.gov.tt',
        reviewerId: 'usr-reviewer-002',
        reviewerNotes: 'Technical review completed and approved.',
        approverId: 'usr-approver-003',
        approvedAt: '2026-09-20T14:30:00Z',
      },
      publication: {
        version: 1,
        status: 'published',
        createdAt: '2026-09-20T10:00:00Z',
        publishedAt: '2026-09-20T15:00:00Z',
      },
    };

    // 4. Canonical Corpus Benchmark Advisory (TT-CSIRT 460: Multiple Vulnerabilities Under Active Exploitation)
    const corpusAdv460: AdvisoryDocument = {
      id: 'adv-seed-published-460',
      referenceNumber: 'TT-CSIRT-ADV-2024-460',
      classification: 'advisory',
      title: 'Multiple vulnerabilities under active exploitation in Ivanti, DrayTek, and Fortinet appliances',
      slug: 'tt-csirt-460-04-10-24-multiple-vulnerabilities-under-active-exploitation',
      severity: 'critical',
      tlp: 'TLP:CLEAR',
      leadParagraph:
        'Threat actors are actively exploiting critical authentication bypass and remote code execution vulnerabilities across Ivanti Virtual Traffic Manager (vTM), DrayTek Vigor routers, and Fortinet FortiOS appliances.',
      targetSectors: [
        'government',
        'critical_national_infrastructure',
        'telecommunications',
        'financial_services',
      ],
      taxonomyTags: ['active-exploitation', 'ivanti', 'draytek', 'fortinet', 'cve-2024-85102'],
      cveMetadata: [
        {
          id: 'CVE-2024-85102',
          cvssVersion: '3.1',
          cvssScore: 9.8,
          cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
          cweIds: ['CWE-287'],
          summary: 'Authentication bypass in Ivanti Virtual Traffic Manager (vTM) admin interface leading to unauthenticated administrative user creation.',
        },
        {
          id: 'CVE-2024-29855',
          cvssVersion: '3.1',
          cvssScore: 9.1,
          cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N',
          cweIds: ['CWE-78'],
          summary: 'Buffer overflow and command injection in DrayTek Vigor router web management interface.',
        },
      ],
      affectedProducts: [
        {
          vendor: 'Ivanti',
          product: 'Virtual Traffic Manager (vTM)',
          affectedVersions: ['22.2', '22.3', '22.3R1', '22.5R1', '22.6R1', '22.7R1'],
          fixedVersions: ['22.2R1', '22.5R2', '22.6R2', '22.7R2'],
        },
        {
          vendor: 'DrayTek',
          product: 'Vigor Series Routers (Vigor2960, Vigor300B, Vigor3900)',
          affectedVersions: ['< 1.5.1.5'],
          fixedVersions: ['1.5.1.5'],
        },
      ],
      sections: {
        overview: {
          id: 'sec-460-ov',
          title: 'Overview',
          level: 2,
          nodes: [
            {
              id: 'n-460-ov-1',
              type: 'paragraph',
              text: 'TT-CSIRT is alerting system administrators to multiple critical vulnerabilities currently undergoing active exploitation in the wild affecting edge network appliances, including Ivanti Virtual Traffic Manager (vTM) and DrayTek Vigor routers.',
              inlines: [
                {
                  type: 'text',
                  text: 'TT-CSIRT is alerting system administrators to multiple critical vulnerabilities currently undergoing active exploitation in the wild affecting edge network appliances, including Ivanti Virtual Traffic Manager (vTM) and DrayTek Vigor routers.',
                },
              ],
            },
          ],
        },
        impact: {
          id: 'sec-460-imp',
          title: 'Impact',
          level: 2,
          nodes: [
            {
              id: 'n-460-imp-1',
              type: 'paragraph',
              text: 'Unauthenticated attackers can bypass authentication controls on internet-exposed management interfaces, create rogue administrator accounts, execute arbitrary OS commands, and intercept encrypted network traffic.',
              inlines: [
                {
                  type: 'text',
                  text: 'Unauthenticated attackers can bypass authentication controls on internet-exposed management interfaces, create rogue administrator accounts, execute arbitrary OS commands, and intercept encrypted network traffic.',
                },
              ],
            },
          ],
        },
        immediateActions: {
          id: 'sec-460-act',
          title: 'Immediate actions',
          level: 2,
          nodes: [
            {
              id: 'n-460-act-1',
              type: 'callout',
              tone: 'warning',
              title: 'Restrict public management interfaces immediately',
              text: 'Ensure that administrative web interfaces (ports 9090, 443, and 8443) on Ivanti vTM and DrayTek appliances are never exposed directly to the public internet.',
              inlines: [
                {
                  type: 'text',
                  text: 'Ensure that administrative web interfaces (ports 9090, 443, and 8443) on Ivanti vTM and DrayTek appliances are never exposed directly to the public internet.',
                },
              ],
            },
          ],
        },
        remediation: {
          id: 'sec-460-rem',
          title: 'Remediation',
          level: 2,
          nodes: [
            {
              id: 'n-460-rem-1',
              type: 'paragraph',
              text: 'Apply the vendor-supplied security patches for Ivanti Virtual Traffic Manager and DrayTek Vigor firmware immediately, and audit appliance user tables for unauthorized administrative accounts.',
              inlines: [
                {
                  type: 'text',
                  text: 'Apply the vendor-supplied security patches for Ivanti Virtual Traffic Manager and DrayTek Vigor firmware immediately, and audit appliance user tables for unauthorized administrative accounts.',
                },
              ],
            },
            {
              id: 'n-460-rem-2',
              type: 'list',
              ordered: true,
              items: [
                {
                  id: 'li-460-1',
                  text: 'Upgrade Ivanti vTM to fixed releases 22.2R1, 22.5R2, 22.6R2, or 22.7R2.',
                  inlines: [{ type: 'text', text: 'Upgrade Ivanti vTM to fixed releases 22.2R1, 22.5R2, 22.6R2, or 22.7R2.' }],
                },
                {
                  id: 'li-460-2',
                  text: 'Upgrade DrayTek Vigor routers to firmware version 1.5.1.5 or later.',
                  inlines: [{ type: 'text', text: 'Upgrade DrayTek Vigor routers to firmware version 1.5.1.5 or later.' }],
                },
                {
                  id: 'li-460-3',
                  text: 'Inspect configuration backups and system logs for unexpected administrative account creation.',
                  inlines: [{ type: 'text', text: 'Inspect configuration backups and system logs for unexpected administrative account creation.' }],
                },
              ],
            },
          ],
        },
      },
      references: [
        {
          id: 'ref-460-1',
          title: 'CISA Known Exploited Vulnerabilities Catalog',
          url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
          type: 'official_guidance',
          isExternal: true,
        },
        {
          id: 'ref-460-2',
          title: 'Ivanti Security Advisory for Virtual Traffic Manager',
          url: 'https://forums.ivanti.com/s/article/Security-Advisory-Ivanti-Virtual-Traffic-Manager-vTM',
          type: 'vendor_advisory',
          isExternal: true,
        },
      ],
      mediaAssets: [],
      provenance: {
        originatingAgency: 'TT-CSIRT Vulnerability Coordination Unit',
        sourceReferenceUrl: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
      },
      editorial: {
        authorId: 'usr-author-001',
        authorEmail: 'a.ramlal@ttcsirt.gov.tt',
        reviewerId: 'usr-reviewer-002',
        reviewerNotes: 'Verified CVE-2024-85102 and DrayTek firmware versions against CISA KEV.',
        approverId: 'usr-approver-003',
        approvedAt: '2024-10-04T13:45:00Z',
      },
      publication: {
        version: 1,
        status: 'published',
        createdAt: '2024-10-04T09:00:00Z',
        publishedAt: '2024-10-04T14:00:00Z',
      },
    };

    this.saveAdvisory(draftAdv);
    this.saveAdvisory(inReviewAdv);
    this.saveAdvisory(publishedAdv);
    this.saveAdvisory(corpusAdv460);
  }
}

export { PublishingStorage as DevStorage };

export const publishingStorage = new PublishingStorage();
// Backward-compatible alias for development tests.
export const devStorage = publishingStorage;
