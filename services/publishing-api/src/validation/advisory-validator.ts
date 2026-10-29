/**
 * @fileoverview Canonical Advisory Server-Side Validation Engine
 * Implements strict, typed validation rules for the Advisory Publishing System.
 * Distinguishes blocking errors from advisory warnings.
 */

import type {
  AdvisoryDocument,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  CanonicalContentNode,
  CanonicalAdvisorySection,
  AdvisorySectionBundle,
} from '@ttcsirt/canonical-types';
import { createEmptyValidationResult, MEDIA_CONSTRAINTS } from '@ttcsirt/canonical-types';

export const ADVISORY_REFERENCE_REGEX = /^TT-CSIRT-(ADV|ALR)-\d{4}-\d{3,4}$/;
export const CVE_REGEX = /^CVE-\d{4}-\d{4,}$/;
export const CVSS_VECTOR_REGEX = /^CVSS:(3\.[01]|4\.0)\/[A-Z0-9:/_.-]+$/;

export function validateAdvisoryDocument(doc: Partial<AdvisoryDocument>): ValidationResult {
  const result = createEmptyValidationResult();
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 1. Identity & Reference Format
  if (!doc.referenceNumber || !doc.referenceNumber.trim()) {
    errors.push({
      field: 'referenceNumber',
      code: 'REQUIRED_FIELD_MISSING',
      message: 'Advisory reference number is required.',
      remediationSuggestion: 'Provide a reference in the format TT-CSIRT-ADV-YYYY-NNN (e.g., TT-CSIRT-ADV-2026-001).',
    });
  } else if (!ADVISORY_REFERENCE_REGEX.test(doc.referenceNumber.trim())) {
    errors.push({
      field: 'referenceNumber',
      code: 'INVALID_REFERENCE_FORMAT',
      message: `Advisory reference "${doc.referenceNumber}" does not match the mandatory pattern ^TT-CSIRT-(ADV|ALR)-\\d{4}-\\d{3,4}$`,
      remediationSuggestion: 'Format as TT-CSIRT-ADV-2026-001 or TT-CSIRT-ALR-2026-001.',
    });
  }

  // 2. Title
  if (!doc.title || !doc.title.trim()) {
    errors.push({
      field: 'title',
      code: 'REQUIRED_FIELD_MISSING',
      message: 'Advisory title is required.',
      remediationSuggestion: 'Enter a clear, descriptive headline in sentence case.',
    });
  } else if (doc.title.trim().length < 5) {
    errors.push({
      field: 'title',
      code: 'TITLE_TOO_SHORT',
      message: 'Advisory title must be at least 5 characters long.',
      remediationSuggestion: 'Provide a complete title identifying the vendor, product, and vulnerability type.',
    });
  } else if (doc.title.trim().length > 250) {
    errors.push({
      field: 'title',
      code: 'TITLE_TOO_LONG',
      message: 'Advisory title must not exceed 250 characters.',
      remediationSuggestion: 'Shorten the title and move narrative context into the lead paragraph.',
    });
  }

  // 3. Classification
  const validClassifications = ['advisory', 'alert', 'guidance', 'bulletin'];
  if (!doc.classification || !validClassifications.includes(doc.classification)) {
    errors.push({
      field: 'classification',
      code: 'INVALID_CLASSIFICATION',
      message: 'A valid document classification must be selected.',
      remediationSuggestion: 'Select one of: advisory, alert, guidance, or bulletin.',
    });
  }

  // 4. Severity
  const validSeverities = ['critical', 'high', 'medium', 'low', 'informational'];
  if (!doc.severity || !validSeverities.includes(doc.severity)) {
    errors.push({
      field: 'severity',
      code: 'INVALID_SEVERITY',
      message: 'A valid severity rating is required.',
      remediationSuggestion: 'Choose from: critical, high, medium, low, or informational.',
    });
  }

  // 5. Traffic Light Protocol (TLP)
  const validTLP = ['TLP:CLEAR', 'TLP:GREEN', 'TLP:AMBER', 'TLP:AMBER+STRICT', 'TLP:RED'];
  if (!doc.tlp || !validTLP.includes(doc.tlp)) {
    errors.push({
      field: 'tlp',
      code: 'INVALID_TLP',
      message: 'A valid TLP classification is required.',
      remediationSuggestion: 'Select TLP:CLEAR for general public release.',
    });
  }

  // Public publication safeguard: only TLP:CLEAR may be published to the public delivery plane
  if (doc.publication?.status === 'published' && doc.tlp && doc.tlp !== 'TLP:CLEAR') {
    errors.push({
      field: 'tlp',
      code: 'RESTRICTED_TLP_CANNOT_BE_PUBLIC',
      message: `Cannot publish advisory with ${doc.tlp} to public portal. Only TLP:CLEAR can be published publicly.`,
      remediationSuggestion: 'Downgrade TLP to TLP:CLEAR with appropriate authorization or keep within internal distribution.',
    });
  }

  // 6. Lead Paragraph
  if (!doc.leadParagraph || !doc.leadParagraph.trim()) {
    errors.push({
      field: 'leadParagraph',
      code: 'REQUIRED_FIELD_MISSING',
      message: 'Lead paragraph summary is required.',
      remediationSuggestion: 'Provide a 1-3 sentence plain-language summary of the issue and required action.',
    });
  } else if (doc.leadParagraph.trim().length < 15) {
    errors.push({
      field: 'leadParagraph',
      code: 'LEAD_TOO_SHORT',
      message: 'Lead paragraph must be at least 15 characters long.',
      remediationSuggestion: 'Elaborate on who is affected and what immediate mitigation is recommended.',
    });
  }

  // 7. Target Sectors
  if (!doc.targetSectors || doc.targetSectors.length === 0) {
    errors.push({
      field: 'targetSectors',
      code: 'TARGET_SECTORS_EMPTY',
      message: 'At least one target audience sector must be designated.',
      remediationSuggestion: 'Select applicable sectors (e.g. government, financial, general public).',
    });
  }

  // 8. CVE Entries & CVSS Scoring
  const seenCveIds = new Set<string>();
  let highestCvssScore = 0;

  if (doc.cveMetadata && Array.isArray(doc.cveMetadata)) {
    doc.cveMetadata.forEach((cve, idx) => {
      const cveField = `cveMetadata[${idx}]`;

      if (!cve.id || !cve.id.trim()) {
        errors.push({
          field: `${cveField}.id`,
          code: 'CVE_ID_EMPTY',
          message: `CVE identifier at index ${idx + 1} is empty.`,
          remediationSuggestion: 'Provide a valid identifier like CVE-2026-12345.',
        });
      } else {
        const trimmedCve = cve.id.trim().toUpperCase();
        if (!CVE_REGEX.test(trimmedCve)) {
          errors.push({
            field: `${cveField}.id`,
            code: 'INVALID_CVE_SYNTAX',
            message: `CVE identifier "${cve.id}" does not match standard pattern ^CVE-\\d{4}-\\d{4,}$`,
            remediationSuggestion: 'Ensure standard prefix "CVE-" followed by a 4-digit year and at least 4 digits.',
          });
        }
        if (seenCveIds.has(trimmedCve)) {
          errors.push({
            field: `${cveField}.id`,
            code: 'DUPLICATE_CVE_ENTRY',
            message: `Duplicate CVE entry "${trimmedCve}" found at index ${idx + 1}.`,
            remediationSuggestion: 'Remove duplicate CVE records from the vulnerability list.',
          });
        }
        seenCveIds.add(trimmedCve);
      }

      // CVSS Score bounds
      if (cve.cvssScore !== undefined && cve.cvssScore !== null) {
        if (typeof cve.cvssScore !== 'number' || isNaN(cve.cvssScore) || cve.cvssScore < 0.0 || cve.cvssScore > 10.0) {
          errors.push({
            field: `${cveField}.cvssScore`,
            code: 'INVALID_CVSS_SCORE',
            message: `CVSS score for ${cve.id || `entry ${idx + 1}`} must be a number between 0.0 and 10.0.`,
            remediationSuggestion: 'Enter a valid base score from 0.0 to 10.0 with at most 1 decimal place.',
          });
        } else {
          if (cve.cvssScore > highestCvssScore) {
            highestCvssScore = cve.cvssScore;
          }
        }
      }

      // CVSS Vector syntax
      if (cve.cvssVector && cve.cvssVector.trim()) {
        if (!CVSS_VECTOR_REGEX.test(cve.cvssVector.trim())) {
          errors.push({
            field: `${cveField}.cvssVector`,
            code: 'INVALID_CVSS_VECTOR',
            message: `CVSS vector "${cve.cvssVector}" does not match standard CVSS 3.x/4.0 format.`,
            remediationSuggestion: 'Provide a standard vector string such as CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H.',
          });
        }
      }
    });
  }

  // Severity Consistency Check against CVSS
  if (highestCvssScore >= 9.0 && (doc.severity === 'low' || doc.severity === 'informational')) {
    errors.push({
      field: 'severity',
      code: 'SEVERITY_CVSS_MISMATCH',
      message: `Severity is marked as "${doc.severity}", but highest CVSS score is ${highestCvssScore} (Critical range >= 9.0).`,
      remediationSuggestion: 'Re-evaluate severity rating to "critical" or verify the CVSS base score.',
    });
  } else if (highestCvssScore >= 7.0 && doc.severity === 'low') {
    errors.push({
      field: 'severity',
      code: 'SEVERITY_CVSS_MISMATCH',
      message: `Severity is marked as "low", but highest CVSS score is ${highestCvssScore} (High range 7.0 - 8.9).`,
      remediationSuggestion: 'Re-evaluate severity rating to "high" or adjust CVSS data.',
    });
  }

  // 9. Affected Systems / Products
  if (!doc.affectedProducts || !Array.isArray(doc.affectedProducts) || doc.affectedProducts.length === 0) {
    warnings.push({
      field: 'affectedProducts',
      code: 'NO_AFFECTED_PRODUCTS',
      message: 'No affected systems or products have been listed.',
      guidance: 'Specify vendor and affected version ranges to help constituents determine their exposure.',
    });
  } else {
    doc.affectedProducts.forEach((prod, pIdx) => {
      const pField = `affectedProducts[${pIdx}]`;
      if (!prod.vendor || !prod.vendor.trim()) {
        errors.push({
          field: `${pField}.vendor`,
          code: 'REQUIRED_FIELD_MISSING',
          message: `Vendor name at index ${pIdx + 1} is missing.`,
          remediationSuggestion: 'Enter the vendor or publisher name.',
        });
      }
      if (!prod.product || !prod.product.trim()) {
        errors.push({
          field: `${pField}.product`,
          code: 'REQUIRED_FIELD_MISSING',
          message: `Product name at index ${pIdx + 1} is missing.`,
          remediationSuggestion: 'Enter the software or hardware product name.',
        });
      }
    });
  }

  // 10. Mandatory Narrative Sections
  const sections = (doc.sections || {}) as Partial<AdvisorySectionBundle>;

  // Overview Section is mandatory
  validateRequiredSection(sections.overview, 'sections.overview', 'Overview', errors);

  // Remediation Section is mandatory for advisories and alerts
  if (doc.classification === 'advisory' || doc.classification === 'alert') {
    validateRequiredSection(sections.remediation, 'sections.remediation', 'Remediation', errors);
  }

  // Check all sections for canonical AST validity & raw script/HTML injection
  for (const [secKey, sec] of Object.entries(sections)) {
    if (sec) {
      if (Array.isArray(sec)) {
        sec.forEach((s: CanonicalAdvisorySection, idx: number) => {
          validateSectionNodes(s, `sections.${secKey}[${idx}]`, errors, warnings);
        });
      } else {
        validateSectionNodes(sec as CanonicalAdvisorySection, `sections.${secKey}`, errors, warnings);
      }
    }
  }

  // 11. References & URLs
  if (doc.references && Array.isArray(doc.references)) {
    const seenUrls = new Set<string>();
    doc.references.forEach((ref, rIdx) => {
      const refField = `references[${rIdx}]`;
      if (!ref.title || !ref.title.trim()) {
        errors.push({
          field: `${refField}.title`,
          code: 'REQUIRED_FIELD_MISSING',
          message: `Reference title at index ${rIdx + 1} is missing.`,
          remediationSuggestion: 'Provide a descriptive title for the citation.',
        });
      }
      if (!ref.url || !ref.url.trim()) {
        errors.push({
          field: `${refField}.url`,
          code: 'REQUIRED_FIELD_MISSING',
          message: `Reference URL at index ${rIdx + 1} is missing.`,
          remediationSuggestion: 'Provide a valid HTTPS link to vendor or security research bulletin.',
        });
      } else {
        const urlStr = ref.url.trim();
        validateUrlSafety(urlStr, `${refField}.url`, errors, warnings);
        if (seenUrls.has(urlStr.toLowerCase())) {
          errors.push({
            field: `${refField}.url`,
            code: 'DUPLICATE_REFERENCE_URL',
            message: `Duplicate reference URL "${urlStr}" at index ${rIdx + 1}.`,
            remediationSuggestion: 'Remove duplicate citation links.',
          });
        }
        seenUrls.add(urlStr.toLowerCase());
      }
    });
  }

  // 12. Media Constraints
  if (doc.mediaAssets && Array.isArray(doc.mediaAssets)) {
    doc.mediaAssets.forEach((media, mIdx) => {
      const mField = `mediaAssets[${mIdx}]`;
      if (!MEDIA_CONSTRAINTS.ALLOWED_MIME_TYPES.includes(media.mimeType as any)) {
        errors.push({
          field: `${mField}.mimeType`,
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: `Media file "${media.storagePath}" has disallowed MIME type "${media.mimeType}".`,
          remediationSuggestion: `Permitted formats: ${MEDIA_CONSTRAINTS.ALLOWED_MIME_TYPES.join(', ')}`,
        });
      }
      if (media.byteSize > MEDIA_CONSTRAINTS.MAX_DOCUMENT_SIZE_BYTES) {
        errors.push({
          field: `${mField}.byteSize`,
          code: 'MEDIA_SIZE_EXCEEDED',
          message: `Media file "${media.storagePath}" size (${(media.byteSize / 1024 / 1024).toFixed(1)}MB) exceeds maximum limit of 25MB.`,
          remediationSuggestion: 'Compress or reduce the file size before uploading.',
        });
      }
    });
  }

  result.isValid = errors.length === 0;
  result.errors = errors;
  result.warnings = warnings;
  result.validatedAt = new Date().toISOString();

  return result;
}

function validateRequiredSection(
  sec: CanonicalAdvisorySection | undefined,
  fieldPath: string,
  sectionName: string,
  errors: ValidationError[],
): void {
  if (!sec || !sec.nodes || sec.nodes.length === 0) {
    errors.push({
      field: fieldPath,
      code: 'REQUIRED_SECTION_MISSING',
      message: `The "${sectionName}" section is required and must contain content.`,
      remediationSuggestion: `Add substantive guidance and technical details to the ${sectionName} section.`,
    });
    return;
  }

  const hasSubstantiveText = sec.nodes.some((n: CanonicalContentNode) => {
    if ('text' in n && typeof (n as any).text === 'string') {
      return (n as any).text.trim().length > 0;
    }
    if (n.type === 'list' && Array.isArray((n as any).items)) {
      return (n as any).items.length > 0;
    }
    if (n.type === 'table' && Array.isArray((n as any).rows)) {
      return (n as any).rows.length > 0;
    }
    return false;
  });

  if (!hasSubstantiveText) {
    errors.push({
      field: fieldPath,
      code: 'EMPTY_REQUIRED_SECTION',
      message: `The "${sectionName}" section cannot be empty.`,
      remediationSuggestion: `Add text paragraphs or structured items to complete the ${sectionName} section.`,
    });
  }
}

function validateSectionNodes(
  sec: CanonicalAdvisorySection,
  secPath: string,
  errors: ValidationError[],
  warnings: ValidationWarning[],
): void {
  const allowedNodeTypes = [
    'paragraph',
    'subheading',
    'list',
    'table',
    'callout',
    'code',
    'references',
  ];

  sec.nodes.forEach((node: CanonicalContentNode, nIdx: number) => {
    const nodePath = `${secPath}.nodes[${nIdx}]`;

    if (!allowedNodeTypes.includes(node.type)) {
      errors.push({
        field: nodePath,
        code: 'UNSUPPORTED_AST_NODE',
        message: `Disallowed content node type "${(node as any).type}". Only canonical AST nodes are permitted.`,
        remediationSuggestion: `Use standard structural blocks: ${allowedNodeTypes.join(', ')}.`,
      });
    }

    // Subheading level checking: only H3 (level 3) and H4 (level 4) permitted in advisory sections
    if (node.type === 'subheading') {
      const level = (node as any).level;
      if (level < 3 || level > 4) {
        errors.push({
          field: `${nodePath}.level`,
          code: 'INVALID_HEADING_LEVEL',
          message: `Subheading level H${level} violates GOV.UK heading hierarchy. Only H3 and H4 are permitted within sections.`,
          remediationSuggestion: 'Adjust subheading level to 3 or 4.',
        });
      }
    }

    // AST text inspection for raw script/HTML injection
    if ('text' in node && typeof (node as any).text === 'string') {
      const text = (node as any).text;
      if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(text) || /\bon\w+\s*=/i.test(text)) {
        errors.push({
          field: `${nodePath}.text`,
          code: 'UNSAFE_EMBEDDED_CODE',
          message: 'Raw script tags or inline event handlers detected in content node.',
          remediationSuggestion: 'Remove script tags or encode them as code blocks.',
        });
      }
    }
  });
}

function validateUrlSafety(
  urlStr: string,
  fieldPath: string,
  errors: ValidationError[],
  warnings: ValidationWarning[],
): void {
  try {
    const parsed = new URL(urlStr);
    const protocol = parsed.protocol.toLowerCase();

    if (protocol === 'javascript:' || protocol === 'data:' || protocol === 'file:' || protocol === 'vbscript:') {
      errors.push({
        field: fieldPath,
        code: 'DANGEROUS_URL_PROTOCOL',
        message: `URL protocol "${protocol}" is strictly prohibited due to security risks.`,
        remediationSuggestion: 'Use HTTPS protocol for all external links.',
      });
      return;
    }

    if (protocol === 'http:') {
      warnings.push({
        field: fieldPath,
        code: 'INSECURE_HTTP_PROTOCOL',
        message: `URL "${urlStr}" uses unencrypted HTTP.`,
        guidance: 'Upgrade link to HTTPS if supported by the remote host.',
      });
    } else if (protocol !== 'https:' && protocol !== 'mailto:') {
      errors.push({
        field: fieldPath,
        code: 'INVALID_URL_PROTOCOL',
        message: `Unsupported link protocol "${protocol}".`,
        remediationSuggestion: 'Only HTTPS and mailto links are permitted.',
      });
    }
  } catch {
    errors.push({
      field: fieldPath,
      code: 'MALFORMED_URL',
      message: `Invalid URL string "${urlStr}".`,
      remediationSuggestion: 'Ensure the link starts with https:// and is a valid web address.',
    });
  }
}
