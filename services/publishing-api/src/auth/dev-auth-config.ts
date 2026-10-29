/**
 * @fileoverview Development Authentication Configuration and Enablement Boundary
 *
 * CRITICAL PRODUCTION SAFETY INVARIANT:
 * Development authentication is an intentionally temporary identity provider
 * intended solely for local workflow verification and test suites.
 *
 * Both conditions MUST be true for development authentication to be active:
 * 1. process.env.NODE_ENV !== 'production' (non-production environment)
 * 2. process.env.ENABLE_DEV_AUTH === 'true' || process.env.ENABLE_DEV_AUTH === '1' (explicit enablement flag)
 *
 * In production:
 * - Both conditions fail.
 * - /publishing/dev-login route is mechanically unavailable (returns 404).
 * - Development identity endpoints return 404/403.
 * - X-Dev-User header authentication is strictly rejected.
 * - Production staff authentication is reserved for enterprise SSO (Microsoft Entra ID with MFA).
 */

export function isDevAuthEnabled(): boolean {
  if (typeof process === 'undefined' || !process.env) {
    return false;
  }
  const isNonProduction = process.env.NODE_ENV !== 'production';
  const isExplicitlyEnabled =
    process.env.ENABLE_DEV_AUTH === 'true' || process.env.ENABLE_DEV_AUTH === '1';
  return isNonProduction && isExplicitlyEnabled;
}

export const DEV_SESSION_SECRET =
  (typeof process !== 'undefined' && process.env?.DEV_SESSION_SECRET) ||
  'ttcsirt-advisory-publishing-dev-session-key-2026';

export const DEV_SESSION_COOKIE_NAME = 'ttcsirt_dev_session';
