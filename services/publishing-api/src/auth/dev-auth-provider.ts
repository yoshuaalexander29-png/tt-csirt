/**
 * @fileoverview Development Identity Provider (DEV ONLY)
 *
 * CRITICAL SAFETY INVARIANT:
 * This provider is for local development, automated testing, and workflow verification ONLY.
 * It strictly refuses to authenticate if development authentication is disabled or in production.
 * Production must integrate with organizational identity (e.g. Microsoft Entra ID).
 */

import type { AuthenticationProvider, StaffUser } from './auth-types.ts';
import { DEV_IDENTITIES } from './dev-identities.ts';
import { isDevAuthEnabled, DEV_SESSION_COOKIE_NAME } from './dev-auth-config.ts';
import { verifyDevSessionToken, parseCookies } from './session-service.ts';

export { DEV_IDENTITIES } from './dev-identities.ts';

/**
 * Production-Safe Null Provider
 * Active in production or when dev auth is disabled.
 * Always returns null (unauthorized) for any development credentials.
 */
export class ProductionDisabledAuthProvider implements AuthenticationProvider {
  getProviderName(): string {
    return 'PRODUCTION_DISABLED_AUTH_PROVIDER';
  }

  isProductionReady(): boolean {
    return true;
  }

  async authenticate(): Promise<StaffUser | null> {
    return null;
  }
}

/**
 * Development Authentication Provider
 * Active ONLY in explicitly enabled development environments.
 */
export class DevAuthenticationProvider implements AuthenticationProvider {
  constructor() {
    if (!isDevAuthEnabled()) {
      throw new Error(
        'SECURITY VIOLATION: DevAuthenticationProvider cannot be instantiated when development authentication is disabled or in production. ' +
        'Configure an enterprise Identity Provider (e.g., Microsoft Entra ID).',
      );
    }
  }

  getProviderName(): string {
    return 'DEV_ONLY_MOCK_IDENTITY_PROVIDER';
  }

  isProductionReady(): boolean {
    return false;
  }

  async authenticate(headers: Record<string, string | string[] | undefined>): Promise<StaffUser | null> {
    // HARD BOUNDARY: If development authentication is disabled or in production, reject unconditionally
    if (!isDevAuthEnabled()) {
      return null;
    }

    // 1. Check Session Cookie (Primary browser mechanism)
    const rawCookie = headers['cookie'] || headers['Cookie'];
    const cookieStr = Array.isArray(rawCookie) ? rawCookie.join('; ') : rawCookie;
    if (cookieStr) {
      const cookies = parseCookies(cookieStr);
      const sessionToken = cookies[DEV_SESSION_COOKIE_NAME];
      if (sessionToken) {
        const identityKey = verifyDevSessionToken(sessionToken);
        if (identityKey && DEV_IDENTITIES[identityKey]) {
          const user = DEV_IDENTITIES[identityKey];
          return {
            ...user,
            roles: [...user.roles], // Immutable copy from server definition
            developmentCapabilities: user.developmentCapabilities ? [...user.developmentCapabilities] : undefined,
          };
        }
      }
    }

    // 2. Check X-Dev-User / X-Staff-User-Id / Authorization header (for CLI/test backward compatibility)
    const rawUserKey = headers['x-dev-user'] || headers['x-staff-user-id'] || headers['authorization'];
    if (!rawUserKey || rawUserKey === 'anonymous') {
      return null;
    }

    let userKey = Array.isArray(rawUserKey) ? rawUserKey[0] : rawUserKey;
    if (userKey.startsWith('Bearer ')) {
      userKey = userKey.slice(7).trim();
    }

    if (!userKey || userKey === 'anonymous') {
      return null;
    }

    // Match ONLY against the fixed server-side allowlist.
    // Client cannot supply arbitrary IDs or inject custom roles.
    for (const [key, user] of Object.entries(DEV_IDENTITIES)) {
      if (key === userKey || user.id === userKey || user.email.toLowerCase() === userKey.toLowerCase()) {
        return {
          ...user,
          roles: [...user.roles], // Strictly server-derived roles
          developmentCapabilities: user.developmentCapabilities ? [...user.developmentCapabilities] : undefined,
        };
      }
    }

    // Unknown or arbitrary user key is rejected
    return null;
  }
}
