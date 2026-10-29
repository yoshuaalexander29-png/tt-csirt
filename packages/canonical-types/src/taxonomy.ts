/**
 * @fileoverview Canonical Publication & Domain Taxonomies for TT-CSIRT
 * Contains pure application-level domain classifications.
 *
 * Strict Architectural Invariant:
 * Pure semantic application taxonomies free of legacy CMS identifiers or external schemas.
 */

/**
 * Authoritative high-level publication classification across all national communications
 */
export type PublicationType =
  | "advisory"
  | "alert"
  | "news"
  | "event"
  | "training"
  | "guidance"
  | "institutional";

/**
 * Classification specific to cyber threat notices
 */
export type AdvisoryClassification = "advisory" | "alert";

/**
 * Standardized national severity rating for vulnerability and threat disclosures
 */
export type SeverityRating = "critical" | "high" | "medium" | "low" | "informational";

/**
 * FIRST Traffic Light Protocol (TLP) designation for disclosures
 */
export type TlpMarking = "TLP:CLEAR" | "TLP:GREEN";

/**
 * Target constituency sectors for cyber bulletins
 */
export type TargetSector =
  | "government"
  | "critical_national_infrastructure"
  | "financial_services"
  | "energy_and_utilities"
  | "telecommunications"
  | "healthcare"
  | "commercial_enterprises"
  | "citizens_and_families"
  | "academic_and_research";

/**
 * Cyber attack vector / incident taxonomy categories
 */
export type IncidentTaxonomyCategory =
  | "phishing"
  | "ransomware"
  | "malware"
  | "denial_of_service"
  | "unauthorized_access"
  | "data_breach"
  | "website_defacement"
  | "vulnerability_exploitation"
  | "social_engineering"
  | "insider_threat";

/**
 * Canonical taxonomy tag representation
 */
export interface CanonicalTag {
  /** Stable semantic identifier, e.g. "ransomware" */
  slug: string;
  /** Presentation label, e.g. "Ransomware" */
  label: string;
  /** Optional brief description of taxonomy tag */
  description?: string;
}
