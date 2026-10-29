import type { AdvisoryDocument } from '@ttcsirt/canonical-types';
import type { StaffUser } from './auth-types.ts';

export function canReadAdvisory(doc: AdvisoryDocument, user: StaffUser): boolean {
  if (doc.editorial.authorId === user.id || user.roles.includes('admin')) return true;

  if (doc.publication.status === 'draft' || doc.publication.status === 'changes_requested') {
    return false;
  }

  if (doc.publication.status === 'ready_for_review' || doc.publication.status === 'approved') {
    return user.roles.includes('reviewer') || user.roles.includes('approver');
  }

  return true;
}
