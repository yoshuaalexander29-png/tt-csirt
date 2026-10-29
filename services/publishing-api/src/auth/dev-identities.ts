/**
 * @fileoverview Fixed Development Staff Test Identities
 *
 * CRITICAL AUTHORIZATION GOVERNANCE:
 * These identities are server-defined and strictly immutable.
 * The browser client cannot define, inject, or alter roles, departments, or emails.
 * Any requested identity not present in this dictionary is rejected by the server.
 */

import type { StaffUser } from './auth-types.ts';
import { isDevAuthEnabled } from './dev-auth-config.ts';

export const TEST_USER_ID = 'usr-test-user-006';

export const DEV_IDENTITIES: Record<string, StaffUser> = {
  'author-1': {
    id: 'usr-author-001',
    email: 'a.ramlal@ttcsirt.gov.tt',
    displayName: 'A. Ramlal',
    roles: ['author'],
    department: 'Vulnerability Coordination Team',
    lastLoginAt: '2026-09-22T08:00:00Z',
  },
  'reviewer-1': {
    id: 'usr-reviewer-002',
    email: 'c.joseph@ttcsirt.gov.tt',
    displayName: 'C. Joseph',
    roles: ['reviewer'],
    department: 'Threat Analysis Unit',
    lastLoginAt: '2026-09-22T08:15:00Z',
  },
  'approver-1': {
    id: 'usr-approver-003',
    email: 'k.mahabir@ttcsirt.gov.tt',
    displayName: 'K. Mahabir',
    roles: ['approver'],
    department: 'Executive Directorate',
    lastLoginAt: '2026-09-22T08:30:00Z',
  },
  'admin-1': {
    id: 'usr-admin-004',
    email: 's.mohammed@ttcsirt.gov.tt',
    displayName: 'S. Mohammed',
    roles: ['admin', 'author', 'reviewer', 'approver'],
    department: 'Cyber Operations Division',
    lastLoginAt: '2026-09-22T08:45:00Z',
  },
  'reader-1': {
    id: 'usr-reader-005',
    email: 'g.baptiste@ttcsirt.gov.tt',
    displayName: 'G. Baptiste',
    roles: ['reader'],
    department: 'Public Relations & Legal',
    lastLoginAt: '2026-09-22T09:00:00Z',
  },
  'test-user': {
    id: TEST_USER_ID,
    email: 'test-user@example.invalid',
    displayName: 'Test-user',
    roles: ['author', 'reviewer', 'approver', 'reader'],
    department: 'Development test identity',
    lastLoginAt: '2026-10-01T09:00:00Z',
    developmentCapabilities: [
      'advisory_workflow_override',
      'advisory_delete',
      'test_fixture_management',
    ],
  },
};

export function hasDevelopmentCapability(
  actor: Pick<StaffUser, 'id'>,
  capability: NonNullable<StaffUser['developmentCapabilities']>[number],
): boolean {
  if (!isDevAuthEnabled() || actor.id !== TEST_USER_ID) return false;
  return DEV_IDENTITIES['test-user'].developmentCapabilities?.includes(capability) ?? false;
}
