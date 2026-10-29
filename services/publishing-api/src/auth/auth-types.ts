/**
 * @fileoverview Staff Authentication & Identity Provider Interface
 * Defines the contract for internal publishing control plane authentication.
 * Production will bind to organizational SSO (e.g. Microsoft Entra ID with MFA).
 */

export type StaffRole = 'author' | 'reviewer' | 'approver' | 'admin' | 'reader';
export type DevelopmentCapability = 'advisory_workflow_override' | 'advisory_delete' | 'test_fixture_management';

export interface StaffUser {
  id: string;
  email: string;
  displayName: string;
  roles: StaffRole[];
  department: string;
  lastLoginAt: string;
  developmentCapabilities?: DevelopmentCapability[];
}

export interface AuthContext {
  user: StaffUser;
  token?: string;
  isDevIdentity: boolean;
}

/**
 * Pluggable Authentication Provider Interface
 * Enables clean replacement with Microsoft Entra ID / OIDC in production.
 */
export interface AuthenticationProvider {
  /** Resolves and validates a staff user from request credentials */
  authenticate(headers: Record<string, string | string[] | undefined>): Promise<StaffUser | null>;
  /** Provider identifier for audit logging */
  getProviderName(): string;
  /** Whether this provider is permitted in production environments */
  isProductionReady(): boolean;
}
