import React, { useState, useEffect } from 'react';
import type { AdvisoryDocument, CanonicalContentNode } from '@ttcsirt/canonical-types';
import { PublishingApiClient } from '../utils/api-client.ts';
import { useStaffAuth } from '../context/AuthContext.tsx';
import { GdsStatusTag } from '../components/GdsStatusTag.tsx';
import { GcdsDataTable } from '../../../../src/components/GcdsDataTable.tsx';

interface Props {
  advisoryId: string;
  onClose: () => void;
}

function renderAstNode(node: CanonicalContentNode, idx: number): React.ReactNode {
  switch (node.type) {
    case 'paragraph':
      return (
        <p key={node.id || idx} className="govuk-body">
          {node.text}
        </p>
      );
    case 'subheading':
      if (node.level === 4) {
        return (
          <h4 key={node.id || idx} className="govuk-heading-s">
            {node.text}
          </h4>
        );
      }
      return (
        <h3 key={node.id || idx} className="govuk-heading-m">
          {node.text}
        </h3>
      );
    case 'list':
      if (node.ordered) {
        return (
          <ol key={node.id || idx} className="govuk-list govuk-list--number">
            {node.items.map((item, i) => (
              <li key={item.id || i}>{item.text}</li>
            ))}
          </ol>
        );
      }
      return (
        <ul key={node.id || idx} className="govuk-list govuk-list--bullet">
          {node.items.map((item, i) => (
            <li key={item.id || i}>{item.text}</li>
          ))}
        </ul>
      );
    case 'callout':
      if (node.tone === 'warning') {
        return (
          <div key={node.id || idx} className="govuk-warning-text">
            <span className="govuk-warning-text__icon" aria-hidden="true">
              !
            </span>
            <strong className="govuk-warning-text__text">
              <span className="govuk-visually-hidden">Warning</span>
              {node.title ? `${node.title}: ` : ''}
              {node.text}
            </strong>
          </div>
        );
      }
      return (
        <div key={node.id || idx} className="govuk-inset-text">
          {node.title && <p className="govuk-heading-s govuk-!-margin-bottom-1">{node.title}</p>}
          <p className="govuk-body govuk-!-margin-bottom-0">{node.text}</p>
        </div>
      );
    case 'code':
      return (
        <div key={node.id || idx} className="ttcsirt-code-block">
          {node.filename && (
            <div className="govuk-body-s govuk-!-margin-bottom-1" style={{ fontWeight: 700 }}>
              {node.filename}
            </div>
          )}
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{node.code}</pre>
        </div>
      );
    case 'table':
      return (
        node.headers?.length ? <GcdsDataTable
          key={node.id || idx}
          caption={`${node.caption || `Advisory table ${idx + 1}`} in advisory content`}
          columns={node.headers.map((header, index) => ({ field: `column-${index}`, header, rowHeader: index === 0 }))}
          rows={(node.rows || []).map((row) => Object.fromEntries(row.map((cell, index) => [`column-${index}`, cell || 'Not provided'])))}
        /> : null
      );
    default:
      return null;
  }
}

export const PreviewModal: React.FC<Props> = ({ advisoryId, onClose }) => {
  const { currentUser } = useStaffAuth();
  const [doc, setDoc] = useState<AdvisoryDocument | null>(null);
  const [tokenInfo, setTokenInfo] = useState<{ token: string; expiresAt?: number } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    async function loadPreview() {
      setIsLoading(true);
      setError(null);
      try {
        const tokenRes = await PublishingApiClient.createPreviewToken(advisoryId, currentUser);
        const previewData = await PublishingApiClient.getPreviewData(tokenRes.token);
        setDoc(previewData.advisory);
        setTokenInfo({ token: tokenRes.token, expiresAt: previewData.expiresAt });
      } catch (err: any) {
        setError(err.message || 'Failed to generate preview');
      } finally {
        setIsLoading(false);
      }
    }
    loadPreview();
  }, [advisoryId, currentUser]);

  return (
    <div
      className="ttcsirt-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div className="ttcsirt-modal-dialog">
        {/* GOV.UK Notification Banner for Preview Status */}
        <div
          className="govuk-notification-banner govuk-!-margin-bottom-0"
          role="region"
          aria-labelledby="preview-banner-title"
          data-module="govuk-notification-banner"
        >
          <div
            className="govuk-notification-banner__header"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}
          >
            <h2 className="govuk-notification-banner__title" id="preview-banner-title">
              OFFICIAL USE ONLY — Unapproved draft preview (X-Robots-Tag: noindex, nofollow)
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="govuk-button govuk-button--secondary govuk-!-margin-bottom-0"
            >
              Close preview
            </button>
          </div>
          <div className="govuk-notification-banner__content">
            <p className="govuk-body govuk-!-margin-bottom-0">
              This preview renders the canonical advisory document using the public TT-CSIRT advisory presentation.
              {tokenInfo?.expiresAt && ` Signed token expires at ${new Date(tokenInfo.expiresAt).toLocaleTimeString()}.`}
            </p>
          </div>
        </div>

        {/* Public Advisory Preview Body */}
        <div style={{ padding: '30px' }}>
          {isLoading ? (
            <p className="govuk-body" role="status" aria-live="polite">
              Generating cryptographically signed preview...
            </p>
          ) : error ? (
            <div className="govuk-error-summary" role="alert" data-module="govuk-error-summary">
              <h2 className="govuk-error-summary__title">There is a problem generating the preview</h2>
              <div className="govuk-error-summary__body">
                <p className="govuk-body">{error}</p>
              </div>
            </div>
          ) : doc ? (
            <article className="advisory-article">
              {/* Public Breadcrumbs */}
              <nav className="govuk-breadcrumbs govuk-!-margin-bottom-4" aria-label="Breadcrumb">
                <ol className="govuk-breadcrumbs__list">
                  <li className="govuk-breadcrumbs__list-item">
                    <span className="govuk-breadcrumbs__link">Home</span>
                  </li>
                  <li className="govuk-breadcrumbs__list-item">
                    <span className="govuk-breadcrumbs__link">Advisories &amp; alerts</span>
                  </li>
                  <li className="govuk-breadcrumbs__list-item" aria-current="page">
                    {doc.referenceNumber}
                  </li>
                </ol>
              </nav>

              {/* Lifecycle Notices (Withdrawn / Superseded) */}
              {doc.publication.status === 'withdrawn' && doc.publication.withdrawalNotice && (
                <div className="govuk-error-summary" role="region" aria-label="Withdrawal notice">
                  <h2 className="govuk-error-summary__title">Advisory withdrawn</h2>
                  <div className="govuk-error-summary__body">
                    <p className="govuk-body govuk-!-margin-bottom-0">
                      {doc.publication.withdrawalNotice.publicReason}
                    </p>
                  </div>
                </div>
              )}
              {doc.publication.status === 'superseded' && doc.publication.supersededBy && (
                <div className="govuk-inset-text">
                  <h2 className="govuk-heading-s govuk-!-margin-bottom-1">Superseded advisory</h2>
                  <p className="govuk-body govuk-!-margin-bottom-0">
                    This bulletin has been superseded by{' '}
                    <strong>{doc.publication.supersededBy.successorReferenceNumber}</strong>.
                  </p>
                </div>
              )}

              {/* Advisory Header */}
              <h2 id="preview-modal-title" className="govuk-heading-l govuk-!-margin-bottom-4">
                {doc.title || 'Untitled advisory'}
              </h2>

              {/* Public Metadata Strip */}
              <div className="app-c-metadata">
                <dl className="app-c-metadata__list">
                  <div className="app-c-metadata__item">
                    <dt className="app-c-metadata__term">Reference:</dt>
                    <dd className="app-c-metadata__definition">{doc.referenceNumber}</dd>
                  </div>
                  <div className="app-c-metadata__item">
                    <dt className="app-c-metadata__term">Advisory type:</dt>
                    <dd className="app-c-metadata__definition">
                      {doc.classification.charAt(0).toUpperCase() + doc.classification.slice(1)}
                    </dd>
                  </div>
                  <div className="app-c-metadata__item">
                    <dt className="app-c-metadata__term">Status:</dt>
                    <dd className="app-c-metadata__definition">
                      <GdsStatusTag status={doc.publication.status} />
                    </dd>
                  </div>
                  <div className="app-c-metadata__item">
                    <dt className="app-c-metadata__term">Severity:</dt>
                    <dd className="app-c-metadata__definition">
                      <strong>{doc.severity.charAt(0).toUpperCase() + doc.severity.slice(1)}</strong>
                    </dd>
                  </div>
                  <div className="app-c-metadata__item">
                    <dt className="app-c-metadata__term">Distribution:</dt>
                    <dd className="app-c-metadata__definition">{doc.tlp}</dd>
                  </div>
                  <div className="app-c-metadata__item">
                    <dt className="app-c-metadata__term">Version:</dt>
                    <dd className="app-c-metadata__definition">v{doc.publication.version}</dd>
                  </div>
                  <div className="app-c-metadata__item">
                    <dt className="app-c-metadata__term">Target sectors:</dt>
                    <dd className="app-c-metadata__definition">
                      {doc.targetSectors ? doc.targetSectors.length : 0} sector(s)
                    </dd>
                  </div>
                </dl>
              </div>

              {doc.leadParagraph && (
                <p className="app-c-advisory-lead">{doc.leadParagraph}</p>
              )}

              <hr className="govuk-section-break govuk-section-break--m govuk-section-break--visible" />

              {/* Authoritative Advisory Body */}
              <div className="advisory-authoritative-body">
                {/* CVE & Vulnerability Details */}
                {doc.cveMetadata.length > 0 && (
                  <section className="govuk-!-margin-bottom-6">
                    <h2 className="govuk-heading-l" id="preview-cve-heading">Vulnerabilities and CVE records</h2>
                    <GcdsDataTable
                      caption={`${doc.referenceNumber}: vulnerability and CVE records`}
                      labelledBy="preview-cve-heading"
                      columns={[
                        { field: 'id', header: 'CVE ID', rowHeader: true },
                        { field: 'score', header: 'CVSS score' },
                        { field: 'details', header: 'Vector and summary' },
                      ]}
                      rows={doc.cveMetadata.map((cve) => ({
                        id: cve.id,
                        score: `CVSS ${cve.cvssScore ?? 'N/A'} (v${cve.cvssVersion || '3.1'})`,
                        details: [cve.cvssVector, cve.summary].filter(Boolean).join(' — ') || 'No vector or summary provided',
                      }))}
                    />
                  </section>
                )}

                {/* Affected Products */}
                {doc.affectedProducts.length > 0 && (
                  <section className="govuk-!-margin-bottom-6">
                    <h2 className="govuk-heading-l" id="preview-products-heading">Affected products and systems</h2>
                    <GcdsDataTable
                      caption={`${doc.referenceNumber}: affected products and versions`}
                      labelledBy="preview-products-heading"
                      columns={[
                        { field: 'product', header: 'Vendor and product', rowHeader: true },
                        { field: 'affected', header: 'Vulnerable versions' },
                        { field: 'fixed', header: 'Fixed version' },
                      ]}
                      rows={doc.affectedProducts.map((product) => ({
                        product: `${product.vendor} ${product.product}`,
                        affected: product.affectedVersions.join(', ') || 'Not specified',
                        fixed: product.fixedVersions?.join(', ') || 'Pending',
                      }))}
                    />
                  </section>
                )}

                {/* Narrative Sections */}
                {Object.entries(doc.sections).map(([key, sec]) => {
                  if (!sec || Array.isArray(sec) || !sec.nodes || sec.nodes.length === 0) return null;
                  return (
                    <section key={key} className="govuk-!-margin-bottom-6">
                      <h2 className="govuk-heading-l">{sec.title}</h2>
                      {sec.nodes.map((node: CanonicalContentNode, nIdx: number) =>
                        renderAstNode(node, nIdx),
                      )}
                    </section>
                  );
                })}

                {/* Media Assets */}
                {doc.mediaAssets && doc.mediaAssets.length > 0 && (
                  <section className="govuk-!-margin-bottom-6">
                    <h2 className="govuk-heading-l">Verified media attachments</h2>
                    <dl className="govuk-summary-list">
                      {doc.mediaAssets.map((asset) => (
                        <div key={asset.assetId} className="govuk-summary-list__row">
                          <dt className="govuk-summary-list__key">{asset.altText}</dt>
                          <dd className="govuk-summary-list__value">
                            {asset.caption && <div>{asset.caption}</div>}
                            <span className="govuk-!-font-size-16" style={{ fontFamily: 'monospace', color: '#505a5f' }}>
                              {asset.mimeType} · SHA-256: {asset.sha256.slice(0, 12)}...
                            </span>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                )}

                {/* External References */}
                {doc.references.length > 0 && (
                  <section className="govuk-!-margin-bottom-4">
                    <h2 className="govuk-heading-l">References</h2>
                    <ul className="govuk-list govuk-list--bullet">
                      {doc.references.map((r, i) => (
                        <li key={i}>
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="govuk-link"
                          >
                            {r.title || r.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </article>
          ) : null}

          <hr className="govuk-section-break govuk-section-break--m govuk-section-break--visible" />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <span className="govuk-body-s govuk-!-margin-bottom-0">
              Draft preview generated by TT-CSIRT Advisory Publishing Service
            </span>
            <button
              type="button"
              onClick={onClose}
              className="govuk-button govuk-!-margin-bottom-0"
              data-module="govuk-button"
            >
              Close preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
