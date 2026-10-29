/**
 * @fileoverview Canonical Validation Contracts
 * Represents validation results, errors, and warnings returned by the server-side validation gate.
 */

/**
 * Severity level of validation issue
 */
export type ValidationIssueSeverity = "error" | "warning";

/**
 * Standard error codes emitted by validation gate
 */
export type ValidationErrorCode =
  | "INVALID_CVE_FORMAT"
  | "INVALID_CVSS_SCORE"
  | "INVALID_CVSS_VECTOR"
  | "UNSAFE_URL_PROTOCOL"
  | "EMPTY_REQUIRED_SECTION"
  | "MISSING_REQUIRED_FIELD"
  | "INVALID_AST_STRUCTURE"
  | "UNRESOLVED_REFERENCE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "MEDIA_EXCEEDS_SIZE_LIMIT"
  | "MISSING_MEDIA_ALT_TEXT"
  | "MISSING_REMEDIATION_ACTION"
  | "SUSPICIOUS_UNESCAPED_HTML";

/**
 * Concrete validation error blocking a state transition
 */
export interface ValidationError {
  /** Machine-readable error code */
  code: ValidationErrorCode | string;
  /** JSON path to invalid field, e.g. "cveMetadata[0].id" or "sections.overview" */
  field: string;
  /** Human-readable explanatory message */
  message: string;
  /** Suggested remediation for author */
  remediationSuggestion?: string;
}

/**
 * Non-blocking validation warning
 */
export interface ValidationWarning {
  code: string;
  field: string;
  message: string;
  guidance?: string;
}

/**
 * Aggregate result of advisory validation gate
 */
export interface ValidationResult {
  /** True strictly if errors array is empty */
  isValid: boolean;
  /** List of blocking errors */
  errors: ValidationError[];
  /** List of advisory warnings */
  warnings: ValidationWarning[];
  /** ISO 8601 UTC timestamp when validation occurred */
  validatedAt: string;
}

/**
 * Pure contract helper to create an empty successful validation result
 */
export function createEmptyValidationResult(nowUtcIso = new Date().toISOString()): ValidationResult {
  return {
    isValid: true,
    errors: [],
    warnings: [],
    validatedAt: nowUtcIso,
  };
}
