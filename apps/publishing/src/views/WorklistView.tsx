import React, { useState, useEffect } from 'react';
import type { AdvisoryDocument } from '@ttcsirt/canonical-types';
import { PublishingApiClient } from '../utils/api-client.ts';
import { useStaffAuth } from '../context/AuthContext.tsx';
import { GdsStatusTag } from '../components/GdsStatusTag.tsx';

interface Props {
  onSelectAdvisory: (advisoryId: string, action?: 'edit' | 'review' | 'preview') => void;
  onCreateNew: () => void;
}

export const WorklistView: React.FC<Props> = ({ onSelectAdvisory, onCreateNew }) => {
  const { currentUser, isAuthor } = useStaffAuth();
  const isTestUser = Boolean(currentUser?.developmentCapabilities?.includes('test_fixture_management'));
  const [advisories, setAdvisories] = useState<AdvisoryDocument[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sampleNotice, setSampleNotice] = useState<string | null>(null);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [deletingAdvisoryId, setDeletingAdvisoryId] = useState<string | null>(null);

  const loadAdvisories = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await PublishingApiClient.listAdvisories(statusFilter, currentUser);
      setAdvisories(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load advisories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdvisories();
  }, [statusFilter, currentUser]);

  const filterTabs = [
    { key: 'all', label: 'All advisories' },
    { key: 'draft', label: 'Drafts' },
    { key: 'ready_for_review', label: 'Ready for review' },
    { key: 'changes_requested', label: 'Changes requested' },
    { key: 'approved', label: 'Approved' },
    { key: 'published', label: 'Published' },
    { key: 'superseded', label: 'Superseded' },
    { key: 'withdrawn', label: 'Withdrawn' },
  ];
  const selectedStatusLabel = filterTabs.find((tab) => tab.key === statusFilter)?.label || 'selected status';

  const handleLoadSample = async () => {
    setIsLoadingSample(true);
    setSampleNotice(null);
    try {
      const sample = await PublishingApiClient.loadTestSample(currentUser);
      await loadAdvisories();
      onSelectAdvisory(sample.id, 'edit');
    } catch (err: any) {
      setSampleNotice(err.message || 'Could not open the prepared advisory.');
    } finally {
      setIsLoadingSample(false);
    }
  };

  const handleDelete = async (advisory: AdvisoryDocument) => {
    const displayName = advisory.referenceNumber || advisory.title || 'this advisory';
    if (!window.confirm(`Delete ${displayName}? The advisory will be removed from the worklist. Its audit history will remain.`)) return;
    setDeletingAdvisoryId(advisory.id);
    setSampleNotice(null);
    try {
      await PublishingApiClient.deleteAdvisory(advisory.id, currentUser);
      setSampleNotice(`${displayName} was deleted. Its audit history has been retained.`);
      await loadAdvisories();
    } catch (err: any) {
      setSampleNotice(err.message || 'Could not delete advisory.');
    } finally {
      setDeletingAdvisoryId(null);
    }
  };

  return (
    <div>
      <h1 className="govuk-heading-l">Advisories</h1>
      <p className="govuk-body">Manage advisory drafts, reviews and published releases.</p>
      {isAuthor && (
        <button
          type="button"
          onClick={onCreateNew}
          className="govuk-button"
          data-module="govuk-button"
        >
          Create new advisory
        </button>
      )}

      {isTestUser && (
        <div className="govuk-form-group">
          <button
            type="button"
            onClick={handleLoadSample}
            disabled={isLoadingSample}
            className="govuk-button govuk-button--secondary"
          >
            {isLoadingSample ? 'Opening advisory...' : 'Open prepared advisory'}
          </button>
        </div>
      )}

      {sampleNotice && <p className="govuk-body" role="status" aria-live="polite">{sampleNotice}</p>}

      {/* One native filter control for lifecycle status */}
      <div className="govuk-form-group govuk-!-margin-bottom-4">
        <label className="govuk-label govuk-label--s" htmlFor="worklist-status-filter">
          Filter by lifecycle status
        </label>
        <select
          id="worklist-status-filter"
          className="govuk-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {filterTabs.map((tab) => (
            <option key={tab.key} value={tab.key}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>
      {/* Error Summary */}
      {errorMessage && (
        <div
          className="govuk-error-summary"
          role="alert"
          aria-labelledby="worklist-error-title"
          data-module="govuk-error-summary"
        >
          <h2 className="govuk-error-summary__title" id="worklist-error-title">
            There is a problem loading advisories
          </h2>
          <div className="govuk-error-summary__body">
            <p className="govuk-body">{errorMessage}</p>
            <button
              type="button"
              onClick={loadAdvisories}
              className="govuk-button govuk-button--secondary govuk-!-margin-bottom-0"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
          <p className="govuk-body" role="status" aria-live="polite">
            Loading advisories...
          </p>
        ) : advisories.length === 0 ? (
          <div className="govuk-inset-text">
            No advisories match this status: {selectedStatusLabel}. Choose another status filter.
          </div>
        ) : (
          <ul className="govuk-list ttcsirt-worklist-records" aria-label="Advisory records">
            {advisories.map((adv) => {
              const isMyAdvisory = adv.editorial.authorId === currentUser?.id;
              const updatedAt = adv.publication.updatedAt;
              const updatedAtDate = updatedAt ? new Date(updatedAt) : null;
              const lastUpdated = updatedAtDate && !Number.isNaN(updatedAtDate.getTime())
                ? new Intl.DateTimeFormat('en-TT', { dateStyle: 'medium', timeStyle: 'short' }).format(updatedAtDate)
                : null;
              const isEditableState =
                isAuthor &&
                (adv.publication.status === 'draft' || adv.publication.status === 'changes_requested');
              return (
                <li key={adv.id} className="ttcsirt-worklist-record">
                  <div className="ttcsirt-worklist-record__heading">
                    <h2 className="govuk-heading-s">
                      <a
                        href={`#advisory-${adv.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onSelectAdvisory(adv.id, 'edit');
                        }}
                        className="govuk-link"
                      >
                        {adv.title || 'Untitled draft advisory'}
                      </a>
                    </h2>
                  </div>
                  <div className="ttcsirt-worklist-record__metadata-row">
                    <p className="govuk-body-s ttcsirt-worklist-record__metadata">
                      <strong>Reference:</strong> {adv.referenceNumber || 'Draft unassigned'}
                      {' · '}<strong>Advisory type:</strong> {adv.classification.charAt(0).toUpperCase() + adv.classification.slice(1)}
                      {' · '}<strong>Author:</strong> {isMyAdvisory ? `You (${adv.editorial.authorEmail})` : adv.editorial.authorEmail || adv.editorial.authorId}
                      {lastUpdated && <>{' · '}<strong>Last updated:</strong> <time dateTime={updatedAt}>{lastUpdated}</time></>}
                    </p>
                    <GdsStatusTag status={adv.publication.status} />
                  </div>
                  <div className="ttcsirt-worklist-actions">
                    <a
                      href={`#edit-${adv.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectAdvisory(adv.id, 'edit');
                      }}
                      className="govuk-link"
                    >
                      {isEditableState ? 'Edit' : 'View / manage'}
                    </a>
                    <a
                      href={`#preview-${adv.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectAdvisory(adv.id, 'preview');
                      }}
                      className="govuk-link"
                    >
                      Preview
                    </a>
                    {isTestUser && (
                      <button
                        type="button"
                        onClick={() => handleDelete(adv)}
                        disabled={Boolean(deletingAdvisoryId)}
                        className="govuk-button govuk-button--warning govuk-!-margin-bottom-0"
                        aria-label={`Delete ${adv.referenceNumber || adv.title || 'advisory'}`}
                      >
                        {deletingAdvisoryId === adv.id ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
      )}
    </div>
  );
};
