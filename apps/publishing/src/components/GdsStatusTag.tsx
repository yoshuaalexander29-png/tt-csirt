import React from 'react';
import type { AdvisoryStatus } from '@ttcsirt/canonical-types';

interface Props {
  status: AdvisoryStatus;
}

export const GdsStatusTag: React.FC<Props> = ({ status }) => {
  let modifier = 'govuk-tag--grey';
  let label = 'Draft';

  switch (status) {
    case 'draft':
      modifier = 'govuk-tag--grey';
      label = 'Draft';
      break;
    case 'ready_for_review':
      modifier = 'govuk-tag--blue';
      label = 'Ready for review';
      break;
    case 'changes_requested':
      modifier = 'govuk-tag--yellow';
      label = 'Changes requested';
      break;
    case 'approved':
      modifier = 'govuk-tag--purple';
      label = 'Approved';
      break;
    case 'published':
      modifier = 'govuk-tag--green';
      label = 'Published';
      break;
    case 'withdrawn':
      modifier = 'govuk-tag--red';
      label = 'Withdrawn';
      break;
    case 'superseded':
      modifier = 'govuk-tag--orange';
      label = 'Superseded';
      break;
    case 'deleted':
      modifier = 'govuk-tag--grey';
      label = 'Deleted';
      break;
  }

  return (
    <strong className={`govuk-tag ${modifier}`} style={{ textTransform: 'none' }}>
      {label}
    </strong>
  );
};
