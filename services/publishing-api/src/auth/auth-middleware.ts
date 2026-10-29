/**
 * @fileoverview Staff Authentication & RBAC Middleware
 * Enforces staff credentials and role-based permissions on publishing API endpoints.
 */

import type { Request, Response, NextFunction } from 'express';
import type { AuthenticationProvider, StaffRole, StaffUser } from './auth-types.ts';
import { DevAuthenticationProvider, ProductionDisabledAuthProvider } from './dev-auth-provider.ts';
import { isDevAuthEnabled } from './dev-auth-config.ts';
import { hasDevelopmentCapability } from './dev-identities.ts';

// Provider factory: strictly falls back to ProductionDisabledAuthProvider
function resolveDefaultProvider(): AuthenticationProvider {
  return isDevAuthEnabled()
    ? new DevAuthenticationProvider()
    : new ProductionDisabledAuthProvider();
}

let customProvider: AuthenticationProvider | null = null;

export function setAuthenticationProvider(provider: AuthenticationProvider): void {
  customProvider = provider;
}

export function resetAuthenticationProvider(): void {
  customProvider = null;
}

export function getAuthenticationProvider(): AuthenticationProvider {
  return customProvider ?? resolveDefaultProvider();
}

// Extend Express Request to include staffUser
export interface AuthenticatedStaffRequest extends Request {
  staffUser?: StaffUser;
}

export async function staffAuthMiddleware(
  req: AuthenticatedStaffRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const provider = getAuthenticationProvider();
    const user = await provider.authenticate(req.headers as Record<string, string | string[] | undefined>);

    if (!user) {
      res.status(401).json({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Valid staff authentication credentials required to access the publishing control plane.',
      });
      return;
    }

    req.staffUser = user;
    next();
  } catch (error: any) {
    res.status(500).json({
      statusCode: 500,
      error: 'AuthenticationError',
      message: error?.message || 'Authentication provider error',
    });
  }
}

/**
 * Role-Based Access Control Guard
 * Ensures the authenticated staff member holds at least one of the required roles.
 */
export function requireStaffRoles(...requiredRoles: StaffRole[]) {
  return (req: AuthenticatedStaffRequest, res: Response, next: NextFunction): void => {
    const user = req.staffUser;

    if (!user) {
      res.status(401).json({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Staff authentication required.',
      });
      return;
    }

    // Admin has superuser privileges across all actions
    if (user.roles.includes('admin')) {
      next();
      return;
    }

    const hasRequiredRole = requiredRoles.some((role) => user.roles.includes(role));

    if (!hasRequiredRole) {
      res.status(403).json({
        statusCode: 403,
        error: 'Forbidden',
        message: `Access denied. Action requires one of roles: [${requiredRoles.join(', ')}]. Current roles: [${user.roles.join(', ')}].`,
      });
      return;
    }

    next();
  };
}

export function requireDevelopmentCapability(
  capability: Parameters<typeof hasDevelopmentCapability>[1],
) {
  return (req: AuthenticatedStaffRequest, res: Response, next: NextFunction): void => {
    const user = req.staffUser;
    if (!user) {
      res.status(401).json({ statusCode: 401, error: 'Unauthorized', message: 'Staff authentication required.' });
      return;
    }
    if (!hasDevelopmentCapability(user, capability)) {
      res.status(403).json({
        statusCode: 403,
        error: 'Forbidden',
        message: 'This operation is available only to the Test-user in an explicitly enabled development environment.',
      });
      return;
    }
    next();
  };
}
