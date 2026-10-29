import React, { useState, useEffect } from 'react';
import type { AdvisoryAuditEvent } from '@ttcsirt/canonical-types';
import { PublishingApiClient } from '../utils/api-client.ts';
import { useStaffAuth } from '../context/AuthContext.tsx';
import { GdsStatusTag } from '../components/GdsStatusTag.tsx';

function formatAction(action: AdvisoryAuditEvent['action']): string {
  const label = action.toLowerCase().replace(/_/g, ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatChanges(event: AdvisoryAuditEvent): string[] {
  const diff = event.diffSummary;
  if (!diff) return [];

  const sectionsModified = diff.sectionsModified || [];
  const cvesAdded = diff.cvesAdded || [];
  const cvesRemoved = diff.cvesRemoved || [];
  const metadataFieldsChanged = diff.metadataFieldsChanged || [];

  return [
    ...(sectionsModified.length ? [`Sections: ${sectionsModified.join(', ')}`] : []),
    ...(cvesAdded.length ? [`CVEs added: ${cvesAdded.join(', ')}`] : []),
    ...(cvesRemoved.length ? [`CVEs removed: ${cvesRemoved.join(', ')}`] : []),
    ...(diff.affectedProductsModified ? ['Affected products updated'] : []),
    ...(metadataFieldsChanged.length ? [`Metadata: ${metadataFieldsChanged.join(', ')}`] : []),
  ];
}

export const AuditHistoryView: React.FC = () => {
  const { currentUser } = useStaffAuth();
  const [events, setEvents] = useState<AdvisoryAuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAudit() {
      setIsLoading(true);
      setError(null);
      try {
        const list = await PublishingApiClient.getAllAuditEvents(currentUser);
        setEvents(list);
      } catch (err: any) {
        setError(err.message || 'Could not load audit history.');
      } finally {
        setIsLoading(false);
      }
    }
    loadAudit();
  }, [currentUser]);

  return (
    <div>
      <h1 className="govuk-heading-l">Audit history</h1>
      <p className="govuk-body">Recent advisory changes, review decisions and publication events.</p>

      {isLoading ? (
        <p className="govuk-body" role="status" aria-live="polite">
          Loading audit history...
        </p>
      ) : error ? (
        <div
          className="govuk-error-summary"
          role="alert"
          aria-labelledby="audit-error-title"
          data-module="govuk-error-summary"
        >
          <h2 className="govuk-error-summary__title" id="audit-error-title">
            There is a problem
          </h2>
          <div className="govuk-error-summary__body">
            <p className="govuk-body">{error}</p>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="govuk-inset-text">No audit events have been recorded.</div>
      ) : (
        <ol className="govuk-list ttcsirt-audit-events" aria-label="Recent audit events">
          {events.map((event) => {
            const changes = formatChanges(event);
            return (
              <li key={event.eventId} className="ttcsirt-audit-event">
                <article aria-labelledby={`audit-event-${event.eventId}`}>
                  <div className="ttcsirt-audit-event__heading">
                    <h2 className="govuk-heading-m" id={`audit-event-${event.eventId}`}>
                      {formatAction(event.action)}
                    </h2>
                    <time className="govuk-body-s" dateTime={event.timestamp}>
                      {new Date(event.timestamp).toISOString()}
                    </time>
                  </div>

                  <dl className="govuk-summary-list govuk-summary-list--no-border ttcsirt-audit-event__details">
                    <div className="govuk-summary-list__row">
                      <dt className="govuk-summary-list__key">Advisory</dt>
                      <dd className="govuk-summary-list__value">
                        <strong>{event.referenceNumber}</strong> (version {event.version})
                      </dd>
                    </div>
                    <div className="govuk-summary-list__row">
                      <dt className="govuk-summary-list__key">Staff actor</dt>
                      <dd className="govuk-summary-list__value">
                        <strong>{event.actor.email}</strong>
                        <br />
                        {event.actor.role} · {event.actor.ipAddress}
                        <br />
                        <span className="govuk-body-s">{event.actor.userAgent}</span>
                      </dd>
                    </div>
                    <div className="govuk-summary-list__row">
                      <dt className="govuk-summary-list__key">Status change</dt>
                      <dd className="govuk-summary-list__value">
                        {event.previousStatus ? <GdsStatusTag status={event.previousStatus} /> : 'No previous status'}
                        {' → '}
                        <GdsStatusTag status={event.resultingStatus} />
                      </dd>
                    </div>
                    {event.comment && (
                      <div className="govuk-summary-list__row">
                        <dt className="govuk-summary-list__key">Notes</dt>
                        <dd className="govuk-summary-list__value">{event.comment}</dd>
                      </div>
                    )}
                    {changes.length > 0 && (
                      <div className="govuk-summary-list__row">
                        <dt className="govuk-summary-list__key">Changes</dt>
                        <dd className="govuk-summary-list__value">
                          <ul className="govuk-list govuk-list--bullet">
                            {changes.map((change) => <li key={change}>{change}</li>)}
                          </ul>
                        </dd>
                      </div>
                    )}
                    <div className="govuk-summary-list__row">
                      <dt className="govuk-summary-list__key">Payload digest</dt>
                      <dd className="govuk-summary-list__value">
                        {event.payloadDigest ? (
                          <>
                            {event.payloadDigest.algorithm}{' '}
                            <code className="govuk-!-font-size-16 ttcsirt-audit-digest">{event.payloadDigest.hexDigest}</code>
                          </>
                        ) : 'Not recorded'}
                      </dd>
                    </div>
                    {event.signature && (
                      <div className="govuk-summary-list__row">
                        <dt className="govuk-summary-list__key">Signature</dt>
                        <dd className="govuk-summary-list__value">
                          {event.signature.algorithm}; key {event.signature.keyId}{' '}
                          <code className="govuk-!-font-size-16 ttcsirt-audit-digest">{event.signature.signatureHex}</code>
                        </dd>
                      </div>
                    )}
                  </dl>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};
