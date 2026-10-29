/**
 * Controlled Statistics → Cyber Security Incident Taxonomy Mapping Layer
 *
 * IMPORTANT GOVERNANCE PRINCIPLE:
 * The TT-CSIRT Statistics dataset and the Cyber Security Incident Taxonomy
 * are DISTINCT classification layers.
 *
 * The incident statistics published annually reflect high-level operational
 * reporting categories used by TT-CSIRT. The official Cyber Security Incident
 * Taxonomy provides granular, technical classifications with main categories,
 * sub-categories, and incident descriptions.
 *
 * This mapping layer explicitly and transparently defines how reporting
 * categories relate to official taxonomy categories/sub-categories without
 * forcing a false 1:1 relationship or automating policy.
 */

import type {
  TaxonomyCategory,
  TaxonomySubcategory
} from "../taxonomy/cyberSecurityIncidentTaxonomy.ts";
import {
  CYBER_SECURITY_INCIDENT_TAXONOMY,
  isValidTaxonomyEntry
} from "../taxonomy/cyberSecurityIncidentTaxonomy.ts";

export type StatisticsIncidentType =
  | "Phishing"
  | "Business Email Compromise"
  | "Data breach & System Compromise"
  | "Ransomware"
  | "Website Defacement & Denial of Service"
  | "Malicious Insider";

export type StatisticsTaxonomyRelationship =
  | "primary"
  | "secondary"
  | "subsumed"
  | "contributing";

export interface StatisticsTaxonomyMapping {
  readonly id: string;
  readonly statisticsIncidentType: StatisticsIncidentType;
  readonly taxonomyCategory: TaxonomyCategory;
  readonly taxonomySubcategory: TaxonomySubcategory;
  readonly relationshipType: StatisticsTaxonomyRelationship;
  readonly relationshipLabel: string;
  readonly justification: string;
  readonly relevantGuidanceSlugs?: readonly string[];
}

/**
 * Authoritative Controlled Mappings
 * Each mapping is strictly justified by the official Cyber Security Incident Taxonomy
 * and TT-CSIRT's operational reporting standards.
 */
export const STATISTICS_TAXONOMY_MAPPINGS: readonly StatisticsTaxonomyMapping[] = [
  // 1. Phishing
  {
    id: "map-phishing-fraud-phishing",
    statisticsIncidentType: "Phishing",
    taxonomyCategory: "Fraud",
    taxonomySubcategory: "Phishing",
    relationshipType: "primary",
    relationshipLabel: "Primary technical classification",
    justification:
      "The official taxonomy classifies Phishing under Fraud as fraudulent attempts to obtain sensitive credentials, tokens, or personal information via deceptive electronic communications.",
    relevantGuidanceSlugs: ["phishing-scams", "cyber-safety-basics", "account-security"]
  },

  // 2. Business Email Compromise
  {
    id: "map-bec-fraud-masquerade",
    statisticsIncidentType: "Business Email Compromise",
    taxonomyCategory: "Fraud",
    taxonomySubcategory: "Masquerade",
    relationshipType: "primary",
    relationshipLabel: "Primary technical classification",
    justification:
      "Business Email Compromise (BEC) relies on deceptive impersonation and masquerading as executives, trusted commercial suppliers, or legal authorities to fraudulently divert funds or extract restricted records.",
    relevantGuidanceSlugs: ["phishing-scams", "cyber-security-baseline"]
  },

  // 3. Data breach & System Compromise
  {
    id: "map-breach-content-security-access",
    statisticsIncidentType: "Data breach & System Compromise",
    taxonomyCategory: "Information Content Security",
    taxonomySubcategory: "Unauthorized Access to Information",
    relationshipType: "primary",
    relationshipLabel: "Primary classification (data breach)",
    justification:
      "Data breaches involve unauthorized viewing, extraction, or exfiltration of sensitive organizational databases or personal citizen records.",
    relevantGuidanceSlugs: ["data-protection-security", "incident-reporting-escalation"]
  },
  {
    id: "map-breach-intrusions-system-compromise",
    statisticsIncidentType: "Data breach & System Compromise",
    taxonomyCategory: "Intrusions",
    taxonomySubcategory: "System Compromise",
    relationshipType: "secondary",
    relationshipLabel: "Secondary classification (system compromise)",
    justification:
      "System compromise constitutes the underlying technical intrusion whereby an adversary obtains unauthorized command execution or persistent administrative control over the host infrastructure hosting data.",
    relevantGuidanceSlugs: ["incident-response-planning", "vulnerability-management"]
  },
  {
    id: "map-breach-content-security-leak",
    statisticsIncidentType: "Data breach & System Compromise",
    taxonomyCategory: "Information Content Security",
    taxonomySubcategory: "Leak of Confidential Information",
    relationshipType: "secondary",
    relationshipLabel: "Secondary classification (confidential leak)",
    justification:
      "Incident notifications involving the external release or public leak of proprietary or confidential citizen data map to Leak of Confidential Information.",
    relevantGuidanceSlugs: ["data-protection-security"]
  },

  // 4. Website Defacement & Denial of Service
  {
    id: "map-defacement-dos-availability-dos",
    statisticsIncidentType: "Website Defacement & Denial of Service",
    taxonomyCategory: "Availability",
    taxonomySubcategory: "DoS",
    relationshipType: "primary",
    relationshipLabel: "Primary classification (denial of service)",
    justification:
      "Denial of service events exhaust bandwidth, processing capacity, or application responsiveness, impairing the availability of public services.",
    relevantGuidanceSlugs: ["internet-facing-service-security", "incident-response-planning"]
  },
  {
    id: "map-defacement-content-security-modification",
    statisticsIncidentType: "Website Defacement & Denial of Service",
    taxonomyCategory: "Information Content Security",
    taxonomySubcategory: "Unauthorized Modification",
    relationshipType: "secondary",
    relationshipLabel: "Secondary classification (website defacement)",
    justification:
      "Website defacement entails the unauthorized modification and visual vandalism of web pages and published digital content.",
    relevantGuidanceSlugs: ["internet-facing-service-security"]
  },

  // 5. Ransomware
  {
    id: "map-ransomware-malicious-code-infected",
    statisticsIncidentType: "Ransomware",
    taxonomyCategory: "Malicious Code",
    taxonomySubcategory: "Infected System",
    relationshipType: "primary",
    relationshipLabel: "Primary classification (malware payload)",
    justification:
      "Ransomware incidents involve malicious code execution infecting endpoints and servers, encrypting operational files, and restricting access.",
    relevantGuidanceSlugs: ["ransomware-prevention-response", "backup-recovery"]
  },
  {
    id: "map-ransomware-availability-outage",
    statisticsIncidentType: "Ransomware",
    taxonomyCategory: "Availability",
    taxonomySubcategory: "Outage",
    relationshipType: "secondary",
    relationshipLabel: "Secondary classification (service outage)",
    justification:
      "Operational downtime and critical service outage occurring as a direct consequence of encrypted infrastructure and inaccessible storage volumes.",
    relevantGuidanceSlugs: ["ransomware-prevention-response", "backup-recovery"]
  },

  // 6. Malicious Insider
  {
    id: "map-insider-intrusions-privileged-account",
    statisticsIncidentType: "Malicious Insider",
    taxonomyCategory: "Intrusions",
    taxonomySubcategory: "Privileged Account Compromise",
    relationshipType: "primary",
    relationshipLabel: "Primary classification (privileged abuse)",
    justification:
      "Malicious insider incidents commonly involve the abuse, compromise, or intentional misuse of legitimate internal access credentials or elevated administrative roles.",
    relevantGuidanceSlugs: ["incident-reporting-escalation", "data-protection-security"]
  },
  {
    id: "map-insider-content-security-unauthorized-access",
    statisticsIncidentType: "Malicious Insider",
    taxonomyCategory: "Information Content Security",
    taxonomySubcategory: "Unauthorized Access to Information",
    relationshipType: "secondary",
    relationshipLabel: "Secondary classification (internal access)",
    justification:
      "Internal personnel accessing, collecting, or downloading restricted organizational data outside of their approved business scope.",
    relevantGuidanceSlugs: ["data-protection-security"]
  }
] as const;

/**
 * Validation Result for Taxonomy Mappings
 */
export interface MappingValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Runtime validation of the controlled mapping layer.
 * Enforces:
 * - Every mapping references a known official taxonomy entry.
 * - Non-empty justification exists.
 * - Valid relationshipType is used.
 * - Fails clearly during development rather than silently producing invalid output.
 */
export function validateTaxonomyMappings(
  mappings: readonly StatisticsTaxonomyMapping[] = STATISTICS_TAXONOMY_MAPPINGS
): MappingValidationResult {
  const errors: string[] = [];

  for (const m of mappings) {
    if (!m.id) {
      errors.push(`Mapping for '${m.statisticsIncidentType}' is missing an 'id'.`);
    }

    if (!isValidTaxonomyEntry(m.taxonomyCategory, m.taxonomySubcategory)) {
      errors.push(
        `Mapping '${m.id}' references unknown taxonomy entry: Category '${m.taxonomyCategory}' -> Subcategory '${m.taxonomySubcategory}'.`
      );
    }

    if (!m.relationshipType || !["primary", "secondary", "subsumed", "contributing"].includes(m.relationshipType)) {
      errors.push(`Mapping '${m.id}' has invalid relationshipType: '${m.relationshipType}'.`);
    }

    if (!m.justification || m.justification.trim().length === 0) {
      errors.push(`Mapping '${m.id}' must provide a non-empty classification justification.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get all mappings for a specific Statistics Incident Type.
 */
export function getMappingsForIncidentType(
  type: StatisticsIncidentType | string
): StatisticsTaxonomyMapping[] {
  // Normalize string comparisons to handle casing or naming variants
  const normalized = type.toLowerCase().trim();
  return STATISTICS_TAXONOMY_MAPPINGS.filter(
    (m) => m.statisticsIncidentType.toLowerCase().trim() === normalized
  );
}

/**
 * Get primary mapping for a specific Statistics Incident Type.
 */
export function getPrimaryMappingForIncidentType(
  type: StatisticsIncidentType | string
): StatisticsTaxonomyMapping | undefined {
  const matches = getMappingsForIncidentType(type);
  return matches.find((m) => m.relationshipType === "primary") || matches[0];
}

/**
 * Get all mappings for a specific official Taxonomy Category.
 */
export function getMappingsForTaxonomyCategory(
  category: TaxonomyCategory
): StatisticsTaxonomyMapping[] {
  return STATISTICS_TAXONOMY_MAPPINGS.filter((m) => m.taxonomyCategory === category);
}
