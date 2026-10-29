import React, { useState, useEffect, useRef } from 'react';
import type {
  AdvisoryDocument,
  CveMetadata,
  AffectedProduct,
  CanonicalAdvisorySection,
  CanonicalContentNode,
  ValidationResult,
  ValidationError,
  AdvisoryReference,
  TargetSector,
  AdvisoryVersion,
  AdvisoryAuditEvent,
  AdvisoryMediaAsset,
} from '@ttcsirt/canonical-types';
import { PublishingApiClient } from '../utils/api-client.ts';
import { useStaffAuth } from '../context/AuthContext.tsx';
import { GdsStatusTag } from '../components/GdsStatusTag.tsx';
import { GdsErrorSummary } from '../components/GdsErrorSummary.tsx';
import { GcdsDataTable } from '../../../../src/components/GcdsDataTable.tsx';

interface Props {
  advisoryId: string | null;
  onBackToWorklist: () => void;
  onOpenPreview: (id: string) => void;
  onUnsavedChangesChange?: (hasUnsavedChanges: boolean) => void;
}

export const AuthoringWizardView: React.FC<Props> = ({
  advisoryId,
  onBackToWorklist,
  onOpenPreview,
  onUnsavedChangesChange,
}) => {
  const { currentUser, isAuthor, isReviewer, isApprover } = useStaffAuth();

  // Wizard Tab Navigation: 1=Identity, 2=Vulnerability, 3=Affected systems, 4=Content sections, 5=References and media, 6=Check answers, 7=Review and publish
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [bannerNotice, setBannerNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [initializationAttempt, setInitializationAttempt] = useState(0);
  const initializationKeyRef = useRef<string | null>(null);
  const initializationRequestRef = useRef(0);

  // Version & Audit History for current advisory
  const [versions, setVersions] = useState<AdvisoryVersion[]>([]);
  const [advisoryAudit, setAdvisoryAudit] = useState<AdvisoryAuditEvent[]>([]);

  // Media attachment state
  const [mediaAltText, setMediaAltText] = useState<string>('');
  const [mediaCaption, setMediaCaption] = useState<string>('');
  const [mediaMimeType, setMediaMimeType] = useState<'image/png' | 'image/jpeg' | 'image/webp' | 'application/pdf'>('image/png');
  const [mediaBase64Data, setMediaBase64Data] = useState<string>(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  );
  const [mediaFileName, setMediaFileName] = useState<string>('');
  const [isUploadingMedia, setIsUploadingMedia] = useState<boolean>(false);

  // Workflow Dialogs
  const [reviewerNotes, setReviewerNotes] = useState<string>('');
  const [showPublishConfirmation, setShowPublishConfirmation] = useState<boolean>(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState<boolean>(false);
  const [withdrawalNotice, setWithdrawalNotice] = useState<string>('');
  const [publishedConfirmationData, setPublishedConfirmationData] = useState<{
    reference: string;
    publishedAt: string;
    isPubliclyAvailable: boolean;
  } | null>(null);

  // Advisory Document State
  const [doc, setDoc] = useState<AdvisoryDocument>({
    id: '',
    referenceNumber: '',
    classification: 'advisory',
    title: '',
    slug: '',
    severity: 'high',
    tlp: 'TLP:CLEAR',
    leadParagraph: '',
    targetSectors: ['government', 'critical_national_infrastructure'],
    taxonomyTags: [],
    cveMetadata: [],
    affectedProducts: [],
    sections: {
      overview: { id: 'sec-ov', title: 'Overview', level: 2, nodes: [] },
      impact: { id: 'sec-imp', title: 'Impact', level: 2, nodes: [] },
      technicalDetails: { id: 'sec-tech', title: 'Technical details', level: 2, nodes: [] },
      detectionMethods: { id: 'sec-det', title: 'Detection methods', level: 2, nodes: [] },
      immediateActions: { id: 'sec-act', title: 'Immediate actions', level: 2, nodes: [] },
      remediation: { id: 'sec-rem', title: 'Remediation guidance', level: 2, nodes: [] },
    },
    references: [],
    mediaAssets: [],
    provenance: { originatingAgency: 'TT-CSIRT Vulnerability Coordination Unit' },
    editorial: { authorId: currentUser?.id || '', authorEmail: currentUser?.email || '' },
    publication: { version: 1, status: 'draft', createdAt: new Date().toISOString() },
  });

  const refreshGovernanceHistory = async (targetId: string, isCurrentRequest: () => boolean = () => true) => {
    if (!targetId) return;
    try {
      const [verList, audList] = await Promise.all([
        PublishingApiClient.getVersions(targetId, currentUser),
        PublishingApiClient.getAuditEvents(targetId, currentUser),
      ]);
      if (!isCurrentRequest()) return;
      setVersions(verList);
      setAdvisoryAudit(audList);
    } catch {
      // Ignore non-blocking history fetch errors
    }
  };

  // Fetch or initialize advisory
  useEffect(() => {
    const initializationKey = `${advisoryId || 'new-draft'}:${initializationAttempt}`;
    if (initializationKeyRef.current === initializationKey) return;
    initializationKeyRef.current = initializationKey;
    const requestId = ++initializationRequestRef.current;

    async function init() {
      setIsLoading(true);
      try {
        const loaded = advisoryId
          ? await PublishingApiClient.getAdvisory(advisoryId, currentUser)
          : await PublishingApiClient.createDraft(
            {
              referenceNumber: `TT-CSIRT-ADV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
              title: '',
              classification: 'advisory',
              severity: 'high',
              tlp: 'TLP:CLEAR',
            },
            currentUser,
          );
        if (requestId !== initializationRequestRef.current) return;
        setDoc(loaded);
        setHasUnsavedChanges(false);
        setBannerNotice(null);
        setLastSavedTime(new Date().toLocaleTimeString());
        setVersions([]);
        setAdvisoryAudit([]);
        await refreshGovernanceHistory(loaded.id, () => requestId === initializationRequestRef.current);
      } catch (err: any) {
        if (requestId === initializationRequestRef.current) {
          setBannerNotice({ type: 'error', message: err.message || 'Failed to load advisory.' });
        }
      } finally {
        if (requestId === initializationRequestRef.current) setIsLoading(false);
      }
    }
    init();
  }, [advisoryId, initializationAttempt]);

  // Unsaved changes browser prompt
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    onUnsavedChangesChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onUnsavedChangesChange]);

  // State mutations
  const updateField = (field: keyof AdvisoryDocument, val: any) => {
    setDoc((prev) => ({ ...prev, [field]: val }));
    setHasUnsavedChanges(true);
  };

  // Explicit Save Draft Handler
  const handleSaveDraft = async (): Promise<boolean> => {
    setIsSaving(true);
    setBannerNotice(null);
    try {
      const updated = await PublishingApiClient.updateDraft(
        doc.id,
        doc,
        doc.publication.version,
        currentUser,
      );
      setDoc(updated);
      setHasUnsavedChanges(false);
      setLastSavedTime(new Date().toLocaleTimeString());
      setBannerNotice({ type: 'success', message: 'Draft changes saved successfully.' });

      try {
        const val = await PublishingApiClient.validateAdvisory(doc.id, updated, currentUser);
        setValidationResult(val);
      } catch {
        setBannerNotice({ type: 'error', message: 'Draft saved, but validation could not be checked. Try checking validation again.' });
      }
      return true;
    } catch (err: any) {
      setBannerNotice({ type: 'error', message: err.message || 'Failed to save draft changes.' });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Validate on Demand
  const handleRunValidation = async () => {
    try {
      const val = await PublishingApiClient.validateAdvisory(doc.id, doc, currentUser);
      setValidationResult(val);
      if (val.isValid) {
        setBannerNotice({ type: 'success', message: 'Advisory passed all server-side validation checks.' });
      } else {
        setBannerNotice({
          type: 'error',
          message: `Validation failed with ${val.errors.length} blocking error(s). Review Error Summary above.`,
        });
      }
    } catch (err: any) {
      setBannerNotice({ type: 'error', message: err.message || 'Validation request failed.' });
    }
  };

  // Step Transitions
  const handleGoToStep = async (step: number) => {
    if (hasUnsavedChanges && isAuthor && (doc.publication.status === 'draft' || doc.publication.status === 'changes_requested')) {
      const saved = await handleSaveDraft();
      if (!saved) return;
    }
    if (step === 7 && doc.id) {
      await refreshGovernanceHistory(doc.id);
    }
    setActiveStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Error summary field navigation across wizard steps
  const handleErrorClick = (field: string, targetAnchor: string) => {
    let targetStep = 1;
    if (field.startsWith('cveMetadata')) targetStep = 2;
    else if (field.startsWith('affectedProducts')) targetStep = 3;
    else if (field.startsWith('sections')) targetStep = 4;
    else if (field.startsWith('references') || field.startsWith('mediaAssets')) targetStep = 5;

    setActiveStep(targetStep);
    setTimeout(() => {
      const el = document.getElementById(targetAnchor);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }, 60);
  };

  // Workflow: Submit for Review
  const handleSubmitForReview = async () => {
    setIsSaving(true);
    setBannerNotice(null);
    try {
      // 1. Save latest edits first
      await PublishingApiClient.updateDraft(doc.id, doc, doc.publication.version, currentUser);
      // 2. Submit for review (server executes validation gate)
      const updated = await PublishingApiClient.submitForReview(doc.id, currentUser);
      setDoc(updated);
      setHasUnsavedChanges(false);
      await refreshGovernanceHistory(updated.id);
      setBannerNotice({
        type: 'success',
        message: 'Advisory submitted for technical peer review and approval.',
      });
      setActiveStep(7);
    } catch (err: any) {
      setBannerNotice({ type: 'error', message: err.message || 'Submission for review failed.' });
      // Refresh validation result
      const val = await PublishingApiClient.validateAdvisory(doc.id, doc, currentUser);
      setValidationResult(val);
    } finally {
      setIsSaving(false);
    }
  };

  // Workflow: Request Changes (Reviewer/Approver)
  const handleRequestChanges = async () => {
    if (!reviewerNotes.trim()) {
      setBannerNotice({ type: 'error', message: 'Please provide review notes explaining requested changes.' });
      return;
    }
    setIsSaving(true);
    try {
      const updated = await PublishingApiClient.requestChanges(doc.id, reviewerNotes, currentUser);
      setDoc(updated);
      setReviewerNotes('');
      await refreshGovernanceHistory(updated.id);
      setBannerNotice({ type: 'success', message: 'Changes requested. Advisory returned to author.' });
    } catch (err: any) {
      setBannerNotice({ type: 'error', message: err.message || 'Failed to request changes.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Workflow: Approve (Approver - Two-Person Rule)
  const handleApprove = async () => {
    setIsSaving(true);
    setBannerNotice(null);
    try {
      const updated = await PublishingApiClient.approve(doc.id, currentUser);
      setDoc(updated);
      await refreshGovernanceHistory(updated.id);
      setBannerNotice({ type: 'success', message: 'Advisory approved for publication.' });
    } catch (err: any) {
      setBannerNotice({ type: 'error', message: err.message || 'Approval failed.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Workflow: Publish (Approver - Consequential Step)
  const handleExecutePublication = async () => {
    setIsSaving(true);
    setShowPublishConfirmation(false);
    setBannerNotice(null);
    try {
      const outcome = await PublishingApiClient.publish(
        doc.id,
        { readingTimeMinutes: 4, idempotencyKey: `pub-${doc.id}-v${doc.publication.version}` },
        currentUser,
      );
      setDoc(outcome.advisory);
      await refreshGovernanceHistory(outcome.advisory.id);
      setPublishedConfirmationData({
        reference: outcome.publishedAdvisory.referenceNumber,
        publishedAt: outcome.publishedAdvisory.publication.publishedAt,
        isPubliclyAvailable: outcome.isPubliclyAvailable,
      });
    } catch (err: any) {
      setBannerNotice({ type: 'error', message: err.message || 'Publication failed.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Workflow: Withdraw
  const handleWithdraw = async () => {
    if (!withdrawalNotice.trim()) {
      setBannerNotice({ type: 'error', message: 'A formal withdrawal notice explanation is required.' });
      return;
    }
    setIsSaving(true);
    setShowWithdrawDialog(false);
    try {
      const updated = await PublishingApiClient.withdraw(doc.id, withdrawalNotice, currentUser);
      setDoc(updated);
      setWithdrawalNotice('');
      await refreshGovernanceHistory(updated.id);
      setBannerNotice({ type: 'success', message: 'Advisory withdrawn from active circulation.' });
    } catch (err: any) {
      setBannerNotice({ type: 'error', message: err.message || 'Withdrawal failed.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Workflow: Rollback to Prior Snapshot
  const handleRollback = async (targetVersion: number) => {
    setIsSaving(true);
    setBannerNotice(null);
    try {
      const rolledBack = await PublishingApiClient.rollback(
        doc.id,
        targetVersion,
        `Rolled back to immutable snapshot v${targetVersion}`,
        currentUser,
      );
      setDoc(rolledBack);
      await refreshGovernanceHistory(rolledBack.id);
      setBannerNotice({
        type: 'success',
        message: `Rolled back to snapshot v${targetVersion} as new draft v${rolledBack.publication.version}.`,
      });
    } catch (err: any) {
      setBannerNotice({ type: 'error', message: err.message || 'Rollback failed.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Upload Verified Media Asset
  const handleAddVerifiedMedia = async () => {
    if (!mediaAltText.trim()) {
      setBannerNotice({ type: 'error', message: 'Mandatory altText is required before registering a media asset.' });
      return;
    }
    setIsUploadingMedia(true);
    setBannerNotice(null);
    try {
      const ext = mediaMimeType === 'application/pdf' ? 'pdf' : mediaMimeType.split('/')[1];
      const computedFileName =
        mediaFileName.trim() ||
        `ttcsirt-${doc.referenceNumber.toLowerCase() || 'diagram'}-${(doc.mediaAssets?.length || 0) + 1}.${ext}`;
      const asset = await PublishingApiClient.uploadMedia(
        {
          fileName: computedFileName,
          mimeType: mediaMimeType,
          base64Data: mediaBase64Data,
          altText: mediaAltText.trim(),
          caption: mediaCaption.trim() || undefined,
        },
        currentUser,
      );
      const nextMedia: AdvisoryMediaAsset[] = [...(doc.mediaAssets || []), asset];
      updateField('mediaAssets', nextMedia);
      setMediaAltText('');
      setMediaCaption('');
      setMediaFileName('');
      setBannerNotice({
        type: 'success',
        message: `Verified media asset attached (SHA-256: ${asset.sha256.slice(0, 12)}...). Save draft to persist.`,
      });
    } catch (err: any) {
      setBannerNotice({ type: 'error', message: err.message || 'Media verification failed.' });
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const getFieldError = (fieldPrefix: string): ValidationError | undefined => {
    if (!validationResult || validationResult.isValid) return undefined;
    return validationResult.errors.find(
      (e) => e.field === fieldPrefix || e.field.startsWith(`${fieldPrefix}.`) || e.field.startsWith(`${fieldPrefix}[`),
    );
  };

  if (isLoading) {
    return (
      <p className="govuk-body" role="status" aria-live="polite">
        Loading advisory from publishing service...
      </p>
    );
  }

  if (!doc.id && bannerNotice?.type === 'error') {
    return (
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-full">
          <h1 className="govuk-heading-l">Could not open advisory editor</h1>
          <div className="govuk-error-summary" role="alert" aria-labelledby="editor-load-error-title">
            <h2 className="govuk-error-summary__title" id="editor-load-error-title">There is a problem</h2>
            <div className="govuk-error-summary__body">
              <p className="govuk-body">{bannerNotice.message}</p>
            </div>
          </div>
          <div className="govuk-button-group">
            <button
              type="button"
              onClick={() => setInitializationAttempt((attempt) => attempt + 1)}
              className="govuk-button"
            >
              Try again
            </button>
            <button type="button" onClick={onBackToWorklist} className="govuk-button govuk-button--secondary">
              Return to advisories worklist
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Publication Confirmation View (GOV.UK Confirmation Panel Pattern)
  if (publishedConfirmationData) {
    return (
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-full">
          <div className="govuk-panel govuk-panel--confirmation">
            <h1 className="govuk-panel__title">Advisory published</h1>
            <div className="govuk-panel__body">
              Reference number
              <br />
              <strong>{publishedConfirmationData.reference}</strong>
            </div>
          </div>

          <h2 className="govuk-heading-m">What happens next</h2>
          <p className="govuk-body">
            The advisory release has been committed as an immutable version snapshot with cryptographic SHA-256 integrity.
            {publishedConfirmationData.isPubliclyAvailable
              ? ' The release is available on the public TT-CSIRT portal.'
              : ' The release is not available on the public portal.'}
          </p>

          <dl className="govuk-summary-list govuk-!-margin-bottom-6">
            <div className="govuk-summary-list__row">
              <dt className="govuk-summary-list__key">Public portal availability</dt>
              <dd className="govuk-summary-list__value">
                {publishedConfirmationData.isPubliclyAvailable ? 'Available' : 'Not available'}
              </dd>
            </div>
            <div className="govuk-summary-list__row">
              <dt className="govuk-summary-list__key">Author</dt>
              <dd className="govuk-summary-list__value">{doc.editorial.authorEmail}</dd>
            </div>
            <div className="govuk-summary-list__row">
              <dt className="govuk-summary-list__key">Authorized approver</dt>
              <dd className="govuk-summary-list__value">{currentUser?.displayName}</dd>
            </div>
            <div className="govuk-summary-list__row">
              <dt className="govuk-summary-list__key">Published timestamp</dt>
              <dd className="govuk-summary-list__value">{new Date(publishedConfirmationData.publishedAt).toUTCString()}</dd>
            </div>
          </dl>

          <div className="govuk-button-group">
            <button
              type="button"
              onClick={onBackToWorklist}
              className="govuk-button"
              data-module="govuk-button"
            >
              Return to advisories worklist
            </button>
            <button
              type="button"
              onClick={() => onOpenPreview(doc.id)}
              className="govuk-button govuk-button--secondary"
              data-module="govuk-button"
            >
              View rendered preview
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAuthorUser = doc.editorial.authorId === currentUser?.id;
  const isTestUser = Boolean(currentUser?.developmentCapabilities?.includes('advisory_workflow_override'));
  const canDirectlyEdit =
    isAuthor && (doc.publication.status === 'draft' || doc.publication.status === 'changes_requested');
  const handleReturnToWorklist = async () => {
    if (hasUnsavedChanges && canDirectlyEdit) {
      const saved = await handleSaveDraft();
      if (!saved) return;
    }
    onBackToWorklist();
  };

  return (
    <div className="ttcsirt-authoring-view">
      {/* GOV.UK Back Link */}
      <a
        href="#worklist"
        className="govuk-back-link govuk-!-margin-top-0 govuk-!-margin-bottom-4"
        onClick={(e) => {
          e.preventDefault();
          void handleReturnToWorklist();
        }}
      >
        Back to advisories worklist
      </a>

      {/* Page Heading & Service Actions */}
      <div className="govuk-grid-row govuk-!-margin-bottom-4">
        <div className="govuk-grid-column-two-thirds">
          <h1 className="govuk-heading-l govuk-!-margin-bottom-2">
            {doc.title || 'Untitled security advisory'}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '15px' }} className="govuk-!-margin-bottom-4">
            <span className="govuk-body-s govuk-!-margin-bottom-0">
              Reference: <strong>{doc.referenceNumber || 'Draft unassigned'}</strong> · Version v{doc.publication.version}
            </span>
            <GdsStatusTag status={doc.publication.status} />
            <span className="govuk-body-s govuk-!-margin-bottom-0">
              Author: <strong>{doc.editorial.authorEmail || doc.editorial.authorId}</strong>
            </span>
            {lastSavedTime && (
              <span className="govuk-body-s govuk-!-margin-bottom-0">
                Last saved: {lastSavedTime}
              </span>
            )}
            {hasUnsavedChanges && canDirectlyEdit && (
              <strong className="govuk-tag govuk-tag--yellow" style={{ textTransform: 'none' }}>
                Unsaved changes
              </strong>
            )}
          </div>
        </div>

        <div className="govuk-grid-column-one-third">
          <div className="govuk-button-group">
            {canDirectlyEdit && (
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="govuk-button"
                data-module="govuk-button"
              >
                {isSaving ? 'Saving...' : 'Save draft'}
              </button>
            )}

            <button
              type="button"
              onClick={handleRunValidation}
              className="govuk-button govuk-button--secondary"
              data-module="govuk-button"
            >
              Check validation
            </button>

            <button
              type="button"
              onClick={() => onOpenPreview(doc.id)}
              className="govuk-button govuk-button--secondary"
              data-module="govuk-button"
            >
              Secure preview
            </button>
          </div>
        </div>
      </div>

      {/* Read-Only Lifecycle / Role Lock Banner */}
      {!canDirectlyEdit && (
        <div
          className="govuk-notification-banner"
          role="region"
          aria-labelledby="readonly-banner-title"
          data-module="govuk-notification-banner"
        >
          <div className="govuk-notification-banner__header">
            <h2 className="govuk-notification-banner__title" id="readonly-banner-title">
              Read-only inspection mode
            </h2>
          </div>
          <div className="govuk-notification-banner__content">
            <p className="govuk-body">
              {doc.publication.status === 'published' || doc.publication.status === 'superseded'
                ? 'Published advisories are immutable snapshots. Create a new revision in Step 7 to make edits.'
                : doc.publication.status === 'ready_for_review' || doc.publication.status === 'approved'
                ? 'This advisory is locked while in peer review or approval. Request changes in Step 7 to unlock for authoring.'
                : !isAuthor
                ? `Signed in as ${currentUser?.roles.join(', ')} (${currentUser?.displayName}). Only authors or administrators can modify draft fields.`
                : 'This advisory is archived and cannot be directly edited.'}{' '}
              <a
                href="#step-7"
                className="govuk-notification-banner__link"
                onClick={(e) => {
                  e.preventDefault();
                  handleGoToStep(7);
                }}
              >
                Go to Step 7 (Review and publish)
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Banner Notice */}
      {bannerNotice && (
        <div
          className={`govuk-notification-banner ${
            bannerNotice.type === 'success' ? 'govuk-notification-banner--success' : ''
          }`}
          role="alert"
          aria-labelledby="status-banner-title"
          data-module="govuk-notification-banner"
        >
          <div className="govuk-notification-banner__header">
            <h2 className="govuk-notification-banner__title" id="status-banner-title">
              {bannerNotice.type === 'success' ? 'Success' : 'Important'}
            </h2>
          </div>
          <div className="govuk-notification-banner__content">
            <p className="govuk-notification-banner__heading">{bannerNotice.message}</p>
          </div>
        </div>
      )}

      {/* GDS Error Summary */}
      {validationResult && !validationResult.isValid && (
        <GdsErrorSummary errors={validationResult.errors} onErrorClick={handleErrorClick} />
      )}

      {/* Step Navigation */}
      <nav aria-label="Advisory authoring steps">
        <ol className="ttcsirt-step-nav">
          {[
            { step: 1, label: '1. Identity' },
            { step: 2, label: '2. Vulnerability' },
            { step: 3, label: '3. Affected systems' },
            { step: 4, label: '4. Content sections' },
            { step: 5, label: '5. References and media' },
            { step: 6, label: '6. Check answers' },
            { step: 7, label: '7. Review and publish' },
          ].map((t) => (
            <li key={t.step}>
              <button
                type="button"
                onClick={() => handleGoToStep(t.step)}
                aria-current={activeStep === t.step ? 'step' : undefined}
                className={`ttcsirt-step-nav__button ${
                  activeStep === t.step ? 'ttcsirt-step-nav__button--current' : ''
                }`}
              >
                {t.label}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {/* STEP 1: IDENTITY */}
      {activeStep === 1 && (
        <form noValidate onSubmit={(e) => e.preventDefault()} className="bg-white border border-[#b1b4b6] p-6 space-y-6">
          <h2 className="govuk-heading-m border-b pb-2">1. Advisory identity and metadata</h2>

          {/* Reference Number */}
          <div className="govuk-form-group">
            <label htmlFor="field-referenceNumber" className="block govuk-!-font-size-16 font-bold text-[#0b0c0c] mb-1">
              Advisory reference number <span className="text-[#d4351c]">*</span>
            </label>
            <p className="govuk-body text-[#505a5f] mb-1.5">
              Standard format: <code className="font-mono bg-gray-100 px-1">TT-CSIRT-ADV-YYYY-NNN</code> or <code className="font-mono bg-gray-100 px-1">TT-CSIRT-ALR-YYYY-NNN</code>
            </p>
            <input
              id="field-referenceNumber"
              type="text"
              value={doc.referenceNumber}
              onChange={(e) => updateField('referenceNumber', e.target.value)}
              className="w-full sm:w-80 border-2 border-[#0b0c0c] p-2 govuk-!-font-size-16 font-mono focus:bg-[#ffdd00] focus:outline-none"
            />
          </div>

          {/* Title */}
          <div className="govuk-form-group">
            <label htmlFor="field-title" className="block govuk-!-font-size-16 font-bold text-[#0b0c0c] mb-1">
              Title <span className="text-[#d4351c]">*</span>
            </label>
            <p className="govuk-body text-[#505a5f] mb-1.5">
              Sentence case descriptive headline stating the affected technology and vulnerability type.
            </p>
            <input
              id="field-title"
              type="text"
              value={doc.title}
              onChange={(e) => {
                updateField('title', e.target.value);
                if (!doc.slug) {
                  updateField(
                    'slug',
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, ''),
                  );
                }
              }}
              className="w-full border-2 border-[#0b0c0c] p-2 govuk-!-font-size-16 focus:bg-[#ffdd00] focus:outline-none"
            />
          </div>

          {/* Slug */}
          <div className="govuk-form-group">
            <label htmlFor="field-slug" className="block govuk-!-font-size-16 font-bold text-[#0b0c0c] mb-1">
              URL slug
            </label>
            <p className="govuk-body text-[#505a5f] mb-1.5">Web identifier for delivery URLs.</p>
            <input
              id="field-slug"
              type="text"
              value={doc.slug}
              onChange={(e) => updateField('slug', e.target.value)}
              className="w-full sm:w-96 border border-[#b1b4b6] p-2 govuk-!-font-size-16 font-mono focus:bg-[#ffdd00] focus:outline-none"
            />
          </div>

          {/* Classification & Severity & TLP Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            <div>
              <label htmlFor="field-classification" className="block govuk-!-font-size-16 font-bold text-[#0b0c0c] mb-1">
                Advisory type <span className="text-[#d4351c]">*</span>
              </label>
              <select
                id="field-classification"
                value={doc.classification}
                onChange={(e) => updateField('classification', e.target.value)}
                className="w-full border-2 border-[#0b0c0c] p-2 govuk-!-font-size-16 bg-white focus:bg-[#ffdd00] focus:outline-none"
              >
                <option value="advisory">Advisory</option>
                <option value="alert">Alert</option>
              </select>
            </div>

            <div>
              <label htmlFor="field-severity" className="block govuk-!-font-size-16 font-bold text-[#0b0c0c] mb-1">
                Severity rating <span className="text-[#d4351c]">*</span>
              </label>
              <select
                id="field-severity"
                value={doc.severity}
                onChange={(e) => updateField('severity', e.target.value)}
                className="w-full border-2 border-[#0b0c0c] p-2 govuk-!-font-size-16 bg-white focus:bg-[#ffdd00] focus:outline-none"
              >
                <option value="critical">Critical (CVSS 9.0 - 10.0)</option>
                <option value="high">High (CVSS 7.0 - 8.9)</option>
                <option value="medium">Medium (CVSS 4.0 - 6.9)</option>
                <option value="low">Low (CVSS 0.1 - 3.9)</option>
                <option value="informational">Informational (0.0)</option>
              </select>
            </div>

            <div>
              <label htmlFor="field-tlp" className="block govuk-!-font-size-16 font-bold text-[#0b0c0c] mb-1">
                Traffic Light Protocol (TLP) <span className="text-[#d4351c]">*</span>
              </label>
              <select
                id="field-tlp"
                value={doc.tlp}
                onChange={(e) => updateField('tlp', e.target.value)}
                className="w-full border-2 border-[#0b0c0c] p-2 govuk-!-font-size-16 bg-white focus:bg-[#ffdd00] focus:outline-none"
              >
                <option value="TLP:CLEAR">TLP:CLEAR (Approved for public release)</option>
                <option value="TLP:GREEN">TLP:GREEN (Community distribution only)</option>
                <option value="TLP:AMBER">TLP:AMBER (Restricted to constituents)</option>
                <option value="TLP:RED">TLP:RED (Strictly confidential)</option>
              </select>
            </div>
          </div>

          {/* Lead Paragraph */}
          <div className="govuk-form-group">
            <label htmlFor="field-leadParagraph" className="block govuk-!-font-size-16 font-bold text-[#0b0c0c] mb-1">
              Lead paragraph summary <span className="text-[#d4351c]">*</span>
            </label>
            <p className="govuk-body text-[#505a5f] mb-1.5">
              1-3 concise sentences summarizing who is affected, the risk level, and required immediate action.
            </p>
            <textarea
              id="field-leadParagraph"
              rows={3}
              value={doc.leadParagraph}
              onChange={(e) => updateField('leadParagraph', e.target.value)}
              className="w-full border-2 border-[#0b0c0c] p-2 govuk-!-font-size-16 focus:bg-[#ffdd00] focus:outline-none"
            />
          </div>

          {/* Target Sectors */}
          <div className="govuk-form-group" id="field-targetSectors">
            <label className="block govuk-!-font-size-16 font-bold text-[#0b0c0c] mb-1">
              Target constituent sectors <span className="text-[#d4351c]">*</span>
            </label>
            <p className="govuk-body text-[#505a5f] mb-2">Select all impacted sectors in Trinidad and Tobago.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 govuk-!-font-size-16">
              {[
                { id: 'government', label: 'Government & Public Sector' },
                { id: 'critical_national_infrastructure', label: 'Critical National Infrastructure' },
                { id: 'financial_services', label: 'Banking & Financial Services' },
                { id: 'telecommunications', label: 'Telecommunications' },
                { id: 'energy_and_utilities', label: 'Energy & Utilities' },
                { id: 'commercial_enterprises', label: 'Commercial Enterprises' },
                { id: 'citizens_and_families', label: 'Citizens & Families' },
                { id: 'academic_and_research', label: 'Academic & Research' },
              ].map((sec) => (
                <label key={sec.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(doc.targetSectors || []).includes(sec.id as TargetSector)}
                    onChange={(e) => {
                      const current = doc.targetSectors || [];
                      if (e.target.checked) {
                        updateField('targetSectors', [...current, sec.id as TargetSector]);
                      } else {
                        updateField(
                          'targetSectors',
                          current.filter((s) => s !== sec.id),
                        );
                      }
                    }}
                    className="w-4 h-4 border-2 border-[#0b0c0c] rounded-none focus:ring-2 focus:ring-[#ffdd00]"
                  />
                  <span className="govuk-!-font-size-16">{sec.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t flex justify-between">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="bg-white border border-[#002d62] text-[#002d62] font-bold px-4 py-2 govuk-!-font-size-16"
            >
              Save progress
            </button>
            <button
              type="button"
              onClick={() => handleGoToStep(2)}
              className="ttcsirt-primary-action text-white font-bold px-5 py-2 govuk-!-font-size-16"
            >
              Continue to Vulnerability details →
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: VULNERABILITY & CVEs */}
      {activeStep === 2 && (
        <div className="bg-white border border-[#b1b4b6] p-6 space-y-6">
          <div className="flex justify-between items-center border-b pb-2">
            <div>
              <h2 className="govuk-heading-m">2. Vulnerability details and CVE records</h2>
              <p className="govuk-body text-[#505a5f]">Add CVE identifiers, CVSS base scores, and vectors.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const newCve: CveMetadata = {
                  id: `CVE-${new Date().getFullYear()}-`,
                  cvssVersion: '3.1',
                  cvssScore: 7.5,
                  cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
                  summary: '',
                };
                updateField('cveMetadata', [...doc.cveMetadata, newCve]);
              }}
              className="bg-[#002d62] text-white govuk-!-font-size-16 font-bold px-3 py-1.5 hover:bg-[#001d40]"
            >
              + Add CVE entry
            </button>
          </div>

          {doc.cveMetadata.length === 0 ? (
            <div className="p-6 bg-[#f3f2f1] text-center govuk-!-font-size-16 text-[#505a5f]">
              No CVE entries added yet. Click "+ Add CVE entry" above to attach vulnerabilities.
            </div>
          ) : (
            <div className="space-y-4">
              {doc.cveMetadata.map((cve, idx) => (
                <div key={idx} className="p-4 border-2 border-[#b1b4b6] bg-[#fafafa] space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="govuk-!-font-size-16 font-bold text-[#002d62] uppercase">Vulnerability #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        updateField(
                          'cveMetadata',
                          doc.cveMetadata.filter((_, i) => i !== idx),
                        );
                      }}
                      className="govuk-!-font-size-16 text-[#d4351c] font-bold hover:underline"
                    >
                      Remove CVE
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label htmlFor={`field-cveMetadata-${idx}-id`} className="block govuk-!-font-size-16 font-bold mb-1">
                        CVE Identifier <span className="text-[#d4351c]">*</span>
                      </label>
                      <input
                        id={`field-cveMetadata-${idx}-id`}
                        type="text"
                        placeholder="CVE-2026-12345"
                        value={cve.id}
                        onChange={(e) => {
                          const copy = [...doc.cveMetadata];
                          copy[idx].id = e.target.value.toUpperCase();
                          updateField('cveMetadata', copy);
                        }}
                        className="w-full border border-[#0b0c0c] p-1.5 govuk-!-font-size-16 font-mono focus:bg-[#ffdd00] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor={`field-cveMetadata-${idx}-cvssScore`} className="block govuk-!-font-size-16 font-bold mb-1">
                        CVSS Base Score (0.0 - 10.0)
                      </label>
                      <input
                        id={`field-cveMetadata-${idx}-cvssScore`}
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={cve.cvssScore ?? ''}
                        onChange={(e) => {
                          const copy = [...doc.cveMetadata];
                          copy[idx].cvssScore = e.target.value ? parseFloat(e.target.value) : undefined;
                          updateField('cveMetadata', copy);
                        }}
                        className="w-full border border-[#0b0c0c] p-1.5 govuk-!-font-size-16 focus:bg-[#ffdd00] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block govuk-!-font-size-16 font-bold mb-1">CVSS Version</label>
                      <select
                        value={cve.cvssVersion || '3.1'}
                        onChange={(e) => {
                          const copy = [...doc.cveMetadata];
                          copy[idx].cvssVersion = e.target.value as any;
                          updateField('cveMetadata', copy);
                        }}
                        className="w-full border border-[#0b0c0c] p-1.5 govuk-!-font-size-16 bg-white focus:bg-[#ffdd00] focus:outline-none"
                      >
                        <option value="3.1">CVSS v3.1</option>
                        <option value="4.0">CVSS v4.0</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor={`field-cveMetadata-${idx}-cvssVector`} className="block govuk-!-font-size-16 font-bold mb-1">
                      CVSS Vector String
                    </label>
                    <input
                      id={`field-cveMetadata-${idx}-cvssVector`}
                      type="text"
                      placeholder="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
                      value={cve.cvssVector || ''}
                      onChange={(e) => {
                        const copy = [...doc.cveMetadata];
                        copy[idx].cvssVector = e.target.value;
                        updateField('cveMetadata', copy);
                      }}
                      className="w-full border border-[#0b0c0c] p-1.5 govuk-!-font-size-16 font-mono focus:bg-[#ffdd00] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block govuk-!-font-size-16 font-bold mb-1">Summary / Technical Flaw</label>
                    <input
                      type="text"
                      placeholder="e.g. Unauthenticated remote stack buffer overflow in web daemon"
                      value={cve.summary || ''}
                      onChange={(e) => {
                        const copy = [...doc.cveMetadata];
                        copy[idx].summary = e.target.value;
                        updateField('cveMetadata', copy);
                      }}
                      className="w-full border border-[#b1b4b6] p-1.5 govuk-!-font-size-16 focus:bg-[#ffdd00] focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t flex justify-between">
            <button
              type="button"
              onClick={() => handleGoToStep(1)}
              className="bg-white border border-[#b1b4b6] govuk-!-font-size-16 font-bold px-4 py-2"
            >
              ← Back to Identity
            </button>
            <button
              type="button"
              onClick={() => handleGoToStep(3)}
              className="ttcsirt-primary-action text-white font-bold px-5 py-2 govuk-!-font-size-16"
            >
              Continue to Affected systems →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: AFFECTED SYSTEMS */}
      {activeStep === 3 && (
        <div className="bg-white border border-[#b1b4b6] p-6 space-y-6">
          <div className="flex justify-between items-center border-b pb-2">
            <div>
              <h2 className="govuk-heading-m">3. Affected products and versions</h2>
              <p className="govuk-body text-[#505a5f]">List vendors, software names, vulnerable versions, and fixed versions.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const newProd: AffectedProduct = {
                  vendor: '',
                  product: '',
                  affectedVersions: [''],
                  fixedVersions: [''],
                };
                updateField('affectedProducts', [...doc.affectedProducts, newProd]);
              }}
              className="bg-[#002d62] text-white govuk-!-font-size-16 font-bold px-3 py-1.5 hover:bg-[#001d40]"
            >
              + Add affected product
            </button>
          </div>

          {doc.affectedProducts.length === 0 ? (
            <div className="p-6 bg-[#f3f2f1] text-center govuk-!-font-size-16 text-[#505a5f]">
              No affected products listed yet. Click "+ Add affected product" above to add vendors.
            </div>
          ) : (
            <div className="space-y-4">
              {doc.affectedProducts.map((prod, pIdx) => (
                <div key={pIdx} className="p-4 border-2 border-[#b1b4b6] bg-[#fafafa] space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="govuk-!-font-size-16 font-bold text-[#002d62] uppercase">Product #{pIdx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        updateField(
                          'affectedProducts',
                          doc.affectedProducts.filter((_, i) => i !== pIdx),
                        );
                      }}
                      className="govuk-!-font-size-16 text-[#d4351c] font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`field-affectedProducts-${pIdx}-vendor`} className="block govuk-!-font-size-16 font-bold mb-1">
                        Vendor <span className="text-[#d4351c]">*</span>
                      </label>
                      <input
                        id={`field-affectedProducts-${pIdx}-vendor`}
                        type="text"
                        placeholder="e.g. Cisco, Microsoft, Fortinet"
                        value={prod.vendor}
                        onChange={(e) => {
                          const copy = [...doc.affectedProducts];
                          copy[pIdx].vendor = e.target.value;
                          updateField('affectedProducts', copy);
                        }}
                        className="w-full border border-[#0b0c0c] p-1.5 govuk-!-font-size-16 focus:bg-[#ffdd00] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor={`field-affectedProducts-${pIdx}-product`} className="block govuk-!-font-size-16 font-bold mb-1">
                        Product name <span className="text-[#d4351c]">*</span>
                      </label>
                      <input
                        id={`field-affectedProducts-${pIdx}-product`}
                        type="text"
                        placeholder="e.g. ASA 5500 Series, SharePoint Enterprise"
                        value={prod.product}
                        onChange={(e) => {
                          const copy = [...doc.affectedProducts];
                          copy[pIdx].product = e.target.value;
                          updateField('affectedProducts', copy);
                        }}
                        className="w-full border border-[#0b0c0c] p-1.5 govuk-!-font-size-16 focus:bg-[#ffdd00] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block govuk-!-font-size-16 font-bold mb-1">Affected versions (comma-separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. >= 9.16.0, < 9.18.3"
                        value={prod.affectedVersions.join(', ')}
                        onChange={(e) => {
                          const copy = [...doc.affectedProducts];
                          copy[pIdx].affectedVersions = e.target.value.split(',').map((s) => s.trim());
                          updateField('affectedProducts', copy);
                        }}
                        className="w-full border border-[#b1b4b6] p-1.5 govuk-!-font-size-16 font-mono focus:bg-[#ffdd00] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block govuk-!-font-size-16 font-bold mb-1">Fixed in versions</label>
                      <input
                        type="text"
                        placeholder="e.g. 9.18.4, 9.20.1"
                        value={(prod.fixedVersions || []).join(', ')}
                        onChange={(e) => {
                          const copy = [...doc.affectedProducts];
                          copy[pIdx].fixedVersions = e.target.value.split(',').map((s) => s.trim());
                          updateField('affectedProducts', copy);
                        }}
                        className="w-full border border-[#b1b4b6] p-1.5 govuk-!-font-size-16 font-mono focus:bg-[#ffdd00] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t flex justify-between">
            <button
              type="button"
              onClick={() => handleGoToStep(2)}
              className="bg-white border border-[#b1b4b6] govuk-!-font-size-16 font-bold px-4 py-2"
            >
              ← Back to Vulnerability
            </button>
            <button
              type="button"
              onClick={() => handleGoToStep(4)}
              className="ttcsirt-primary-action text-white font-bold px-5 py-2 govuk-!-font-size-16"
            >
              Continue to Narrative content AST →
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: STRUCTURED CONTENT AST */}
      {activeStep === 4 && (
        <div className="bg-white border border-[#b1b4b6] p-6 space-y-6">
          <div className="border-b pb-2">
            <h2 className="govuk-heading-m">4. Advisory content</h2>
            <p className="govuk-body text-[#505a5f]">
              Directly author typed canonical blocks (Paragraphs, Subheadings, Lists, Callouts, Code blocks, Tables).
              <span className="font-bold text-[#b10e1e]"> No generic rich-text editor or raw HTML is permitted.</span>
            </p>
          </div>

          {/* Section Editors */}
          {[
            { key: 'overview', title: 'Overview', required: true, description: 'Core description of vulnerability and mechanism.' },
            { key: 'impact', title: 'Impact', required: false, description: 'Direct consequences to confidentiality, integrity, and availability.' },
            { key: 'technicalDetails', title: 'Technical details', required: false, description: 'Deep technical analysis, exploitation mechanics, and execution paths.' },
            { key: 'detectionMethods', title: 'Detection methods', required: false, description: 'How to detect indicators of compromise or vulnerable configurations.' },
            { key: 'immediateActions', title: 'Immediate actions', required: false, description: 'Containment actions that should be taken right away.' },
            { key: 'remediation', title: 'Remediation guidance', required: true, description: 'Permanent fixes, vendor patches, and configuration workarounds.' },
          ].map((sec) => {
            const currentSec: CanonicalAdvisorySection = (doc.sections as any)[sec.key] || {
              id: `sec-${sec.key}`,
              title: sec.title,
              level: 2,
              nodes: [],
            };

            const setSectionNodes = (nextNodes: CanonicalContentNode[]) => {
              updateField('sections', {
                ...doc.sections,
                [sec.key]: {
                  ...currentSec,
                  nodes: nextNodes,
                },
              });
            };

            const addBlockNode = (blockType: CanonicalContentNode['type']) => {
              const id = `${blockType}-${sec.key}-${Date.now()}-${currentSec.nodes.length}`;
              let newNode: CanonicalContentNode;
              if (blockType === 'subheading') {
                newNode = { id, type: 'subheading', level: 3, text: '' };
              } else if (blockType === 'list') {
                newNode = {
                  id,
                  type: 'list',
                  ordered: false,
                  items: [{ id: `item-${Date.now()}-1`, text: '', inlines: [{ type: 'text', text: '' }] }],
                };
              } else if (blockType === 'callout') {
                newNode = {
                  id,
                  type: 'callout',
                  tone: 'important',
                  title: 'Important notice',
                  text: '',
                  inlines: [{ type: 'text', text: '' }],
                };
              } else if (blockType === 'code') {
                newNode = { id, type: 'code', language: 'bash', filename: '', code: '' };
              } else if (blockType === 'table') {
                newNode = {
                  id,
                  type: 'table',
                  caption: '',
                  headers: ['Component', 'Requirement'],
                  rows: [['', '']],
                };
              } else {
                newNode = { id, type: 'paragraph', text: '', inlines: [{ type: 'text', text: '' }] };
              }
              setSectionNodes([...currentSec.nodes, newNode]);
            };

            return (
              <div
                key={sec.key}
                className="p-4 border-2 border-[#b1b4b6] bg-[#fafafa] space-y-3"
                id={`field-sections-${sec.key}`}
                tabIndex={-1}
              >
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <span className="govuk-!-font-size-16 font-bold text-[#0b0c0c]">
                      {sec.title} {sec.required && <span className="text-[#d4351c]">* (Mandatory)</span>}
                    </span>
                    <p className="govuk-body text-[#505a5f]">{sec.description}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 govuk-!-font-size-16">
                    <span className="bg-gray-200 text-gray-800 px-2 py-0.5 font-mono">
                      {currentSec.nodes.length} block{currentSec.nodes.length !== 1 ? 's' : ''}
                    </span>
                    {canDirectlyEdit && (
                      <>
                        <button
                          type="button"
                          onClick={() => addBlockNode('paragraph')}
                          className="bg-[#002d62] text-white px-2 py-1 font-bold hover:bg-[#001d40] cursor-pointer"
                        >
                          + Paragraph
                        </button>
                        <button
                          type="button"
                          onClick={() => addBlockNode('subheading')}
                          className="bg-white border border-[#002d62] text-[#002d62] px-2 py-1 font-bold hover:bg-[#eef5fb] cursor-pointer"
                        >
                          + Subheading
                        </button>
                        <button
                          type="button"
                          onClick={() => addBlockNode('list')}
                          className="bg-white border border-[#002d62] text-[#002d62] px-2 py-1 font-bold hover:bg-[#eef5fb] cursor-pointer"
                        >
                          + List
                        </button>
                        <button
                          type="button"
                          onClick={() => addBlockNode('callout')}
                          className="bg-white border border-[#002d62] text-[#002d62] px-2 py-1 font-bold hover:bg-[#eef5fb] cursor-pointer"
                        >
                          + Callout
                        </button>
                        <button
                          type="button"
                          onClick={() => addBlockNode('code')}
                          className="bg-white border border-[#002d62] text-[#002d62] px-2 py-1 font-bold hover:bg-[#eef5fb] cursor-pointer"
                        >
                          + Code
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {currentSec.nodes.length === 0 ? (
                  <div className="p-4 bg-white border border-dashed border-[#b1b4b6] govuk-!-font-size-16 text-[#505a5f]">
                    No AST blocks in {sec.title} yet.{' '}
                    {canDirectlyEdit && 'Use the "+ Paragraph" or block buttons above to add structured content.'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentSec.nodes.map((node, nIdx) => (
                      <div key={node.id || nIdx} className="p-3 bg-white border border-[#b1b4b6] space-y-2">
                        <div className="flex justify-between items-center govuk-!-font-size-16 border-b border-[#f3f2f1] pb-1.5">
                          <span className="font-mono font-bold uppercase text-[#002d62]">
                            Block #{nIdx + 1} · {node.type}
                          </span>
                          {canDirectlyEdit && (
                            <button
                              type="button"
                              onClick={() =>
                                setSectionNodes(currentSec.nodes.filter((_, idx) => idx !== nIdx))
                              }
                              className="text-[#d4351c] font-bold hover:underline cursor-pointer"
                            >
                              Remove block
                            </button>
                          )}
                        </div>

                        {node.type === 'paragraph' && (
                          <textarea
                            rows={3}
                            disabled={!canDirectlyEdit}
                            placeholder={`Enter paragraph text for ${sec.title}...`}
                            value={node.text}
                            onChange={(e) => {
                              const next = [...currentSec.nodes];
                              next[nIdx] = {
                                ...node,
                                text: e.target.value,
                                inlines: [{ type: 'text', text: e.target.value }],
                              };
                              setSectionNodes(next);
                            }}
                            className="w-full border border-[#0b0c0c] p-2 govuk-!-font-size-16 focus:bg-[#ffdd00] focus:outline-none disabled:bg-[#f3f2f1]"
                          />
                        )}

                        {node.type === 'subheading' && (
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <div>
                              <label className="block govuk-!-font-size-16 font-bold mb-1">Heading level</label>
                              <select
                                disabled={!canDirectlyEdit}
                                value={node.level}
                                onChange={(e) => {
                                  const next = [...currentSec.nodes];
                                  next[nIdx] = { ...node, level: Number(e.target.value) as 3 | 4 };
                                  setSectionNodes(next);
                                }}
                                className="w-full border border-[#0b0c0c] p-1.5 govuk-!-font-size-16 bg-white focus:bg-[#ffdd00] focus:outline-none"
                              >
                                <option value={3}>H3 subheading</option>
                                <option value={4}>H4 subheading</option>
                              </select>
                            </div>
                            <div className="sm:col-span-3">
                              <label className="block govuk-!-font-size-16 font-bold mb-1">Subheading text (sentence case)</label>
                              <input
                                type="text"
                                disabled={!canDirectlyEdit}
                                value={node.text}
                                onChange={(e) => {
                                  const next = [...currentSec.nodes];
                                  next[nIdx] = { ...node, text: e.target.value };
                                  setSectionNodes(next);
                                }}
                                className="w-full border border-[#0b0c0c] p-1.5 govuk-!-font-size-16 font-bold focus:bg-[#ffdd00] focus:outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {node.type === 'list' && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3 govuk-!-font-size-16">
                              <label className="flex items-center space-x-1.5 font-bold cursor-pointer">
                                <input
                                  type="checkbox"
                                  disabled={!canDirectlyEdit}
                                  checked={node.ordered}
                                  onChange={(e) => {
                                    const next = [...currentSec.nodes];
                                    next[nIdx] = { ...node, ordered: e.target.checked };
                                    setSectionNodes(next);
                                  }}
                                />
                                <span>Numbered list (ordered)</span>
                              </label>
                            </div>
                            <label className="block govuk-!-font-size-16 text-[#505a5f]">
                              List items (one item per line):
                            </label>
                            <textarea
                              rows={Math.max(3, node.items.length)}
                              disabled={!canDirectlyEdit}
                              value={node.items.map((it) => it.text).join('\n')}
                              onChange={(e) => {
                                const lines = e.target.value.split('\n');
                                const next = [...currentSec.nodes];
                                next[nIdx] = {
                                  ...node,
                                  items: lines.map((line, lIdx) => ({
                                    id: node.items[lIdx]?.id || `item-${nIdx}-${lIdx}`,
                                    text: line,
                                    inlines: [{ type: 'text', text: line }],
                                  })),
                                };
                                setSectionNodes(next);
                              }}
                              className="w-full border border-[#0b0c0c] p-2 govuk-!-font-size-16 focus:bg-[#ffdd00] focus:outline-none disabled:bg-[#f3f2f1]"
                            />
                          </div>
                        )}

                        {node.type === 'callout' && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="block govuk-!-font-size-16 font-bold mb-1">Callout tone</label>
                                <select
                                  disabled={!canDirectlyEdit}
                                  value={node.tone}
                                  onChange={(e) => {
                                    const next = [...currentSec.nodes];
                                    next[nIdx] = { ...node, tone: e.target.value as any };
                                    setSectionNodes(next);
                                  }}
                                  className="w-full border border-[#0b0c0c] p-1.5 govuk-!-font-size-16 bg-white"
                                >
                                  <option value="info">Information</option>
                                  <option value="important">Important</option>
                                  <option value="warning">Warning</option>
                                </select>
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block govuk-!-font-size-16 font-bold mb-1">Callout title</label>
                                <input
                                  type="text"
                                  disabled={!canDirectlyEdit}
                                  value={node.title || ''}
                                  onChange={(e) => {
                                    const next = [...currentSec.nodes];
                                    next[nIdx] = { ...node, title: e.target.value };
                                    setSectionNodes(next);
                                  }}
                                  className="w-full border border-[#0b0c0c] p-1.5 govuk-!-font-size-16"
                                />
                              </div>
                            </div>
                            <textarea
                              rows={2}
                              disabled={!canDirectlyEdit}
                              placeholder="Callout body text..."
                              value={node.text}
                              onChange={(e) => {
                                const next = [...currentSec.nodes];
                                next[nIdx] = { ...node, text: e.target.value };
                                setSectionNodes(next);
                              }}
                              className="w-full border border-[#0b0c0c] p-2 govuk-!-font-size-16 focus:bg-[#ffdd00] focus:outline-none"
                            />
                          </div>
                        )}

                        {node.type === 'code' && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block govuk-!-font-size-16 font-bold mb-1">Language</label>
                                <select
                                  disabled={!canDirectlyEdit}
                                  value={node.language || 'bash'}
                                  onChange={(e) => {
                                    const next = [...currentSec.nodes];
                                    next[nIdx] = { ...node, language: e.target.value as any };
                                    setSectionNodes(next);
                                  }}
                                  className="w-full border border-[#0b0c0c] p-1.5 govuk-!-font-size-16 font-mono bg-white"
                                >
                                  <option value="bash">bash</option>
                                  <option value="powershell">powershell</option>
                                  <option value="json">json</option>
                                  <option value="xml">xml</option>
                                  <option value="python">python</option>
                                  <option value="yara">yara</option>
                                  <option value="snort">snort</option>
                                  <option value="text">text</option>
                                </select>
                              </div>
                              <div>
                                <label className="block govuk-!-font-size-16 font-bold mb-1">Filename (optional)</label>
                                <input
                                  type="text"
                                  disabled={!canDirectlyEdit}
                                  value={node.filename || ''}
                                  onChange={(e) => {
                                    const next = [...currentSec.nodes];
                                    next[nIdx] = { ...node, filename: e.target.value };
                                    setSectionNodes(next);
                                  }}
                                  className="w-full border border-[#0b0c0c] p-1.5 govuk-!-font-size-16 font-mono"
                                />
                              </div>
                            </div>
                            <textarea
                              rows={3}
                              disabled={!canDirectlyEdit}
                              placeholder="Enter command or configuration snippet..."
                              value={node.code}
                              onChange={(e) => {
                                const next = [...currentSec.nodes];
                                next[nIdx] = { ...node, code: e.target.value };
                                setSectionNodes(next);
                              }}
                              className="w-full border border-[#0b0c0c] p-2 govuk-!-font-size-16 font-mono bg-[#0b0c0c] text-white focus:outline-none"
                            />
                          </div>
                        )}

                        {node.type === 'table' && (
                          <div className="space-y-2 govuk-!-font-size-16">
                            <p className="font-semibold text-[#505a5f]">
                              Structured table ({node.headers.join(' | ')}) — {node.rows.length} row(s)
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-4 border-t flex justify-between">
            <button
              type="button"
              onClick={() => handleGoToStep(3)}
              className="bg-white border border-[#b1b4b6] govuk-!-font-size-16 font-bold px-4 py-2 cursor-pointer"
            >
              ← Back to Affected systems
            </button>
            <button
              type="button"
              onClick={() => handleGoToStep(5)}
              className="ttcsirt-primary-action text-white font-bold px-5 py-2 govuk-!-font-size-16 cursor-pointer"
            >
              Continue to References and media →
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: REFERENCES & MEDIA */}
      {activeStep === 5 && (
        <div className="bg-white border border-[#b1b4b6] p-6 space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <h2 className="govuk-heading-m">5. References and media</h2>
                <p className="govuk-body text-[#505a5f]">HTTPS URLs to vendor security advisories and verified diagram/PDF attachments.</p>
              </div>
              {canDirectlyEdit && (
                <button
                  type="button"
                  onClick={() => {
                    const newRef: AdvisoryReference = {
                      id: `ref-${Date.now()}`,
                      title: '',
                      url: 'https://',
                      type: 'vendor_advisory',
                      isExternal: true,
                    };
                    updateField('references', [...doc.references, newRef]);
                  }}
                  className="bg-[#002d62] text-white govuk-!-font-size-16 font-bold px-3 py-1.5 hover:bg-[#001d40] cursor-pointer"
                >
                  + Add reference link
                </button>
              )}
            </div>

            {doc.references.length === 0 ? (
              <div className="p-6 bg-[#f3f2f1] text-center govuk-!-font-size-16 text-[#505a5f]">
                No external reference citations attached.
              </div>
            ) : (
              <div className="space-y-3">
                {doc.references.map((ref, rIdx) => (
                  <div key={rIdx} className="p-3 border border-[#b1b4b6] bg-[#fafafa] grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-5">
                      <label htmlFor={`field-references-${rIdx}-title`} className="block govuk-!-font-size-16 font-bold mb-0.5">
                        Citation title
                      </label>
                      <input
                        id={`field-references-${rIdx}-title`}
                        type="text"
                        disabled={!canDirectlyEdit}
                        placeholder="e.g. Vendor Security Bulletin 2026-01"
                        value={ref.title}
                        onChange={(e) => {
                          const copy = [...doc.references];
                          copy[rIdx].title = e.target.value;
                          updateField('references', copy);
                        }}
                        className="w-full border border-[#0b0c0c] p-1 govuk-!-font-size-16 focus:bg-[#ffdd00] focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-5">
                      <label htmlFor={`field-references-${rIdx}-url`} className="block govuk-!-font-size-16 font-bold mb-0.5">
                        HTTPS URL
                      </label>
                      <input
                        id={`field-references-${rIdx}-url`}
                        type="url"
                        disabled={!canDirectlyEdit}
                        placeholder="https://example.com/security"
                        value={ref.url}
                        onChange={(e) => {
                          const copy = [...doc.references];
                          copy[rIdx].url = e.target.value;
                          updateField('references', copy);
                        }}
                        className="w-full border border-[#0b0c0c] p-1 govuk-!-font-size-16 font-mono focus:bg-[#ffdd00] focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2 text-right pt-3">
                      {canDirectlyEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            updateField(
                              'references',
                              doc.references.filter((_, i) => i !== rIdx),
                            );
                          }}
                          className="govuk-!-font-size-16 text-[#d4351c] font-bold hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verified Media Assets Pipeline */}
          <div className="border-t pt-6 space-y-4">
            <div>
              <h3 className="govuk-heading-s">Verified media attachments</h3>
              <p className="govuk-body text-[#505a5f]">
                SVG uploads are strictly rejected to prevent embedded XSS payloads. Every image requires accessible alt text and SHA-256 verification.
              </p>
            </div>

            {canDirectlyEdit && (
              <div className="p-4 bg-[#f8f8f8] border border-[#b1b4b6] grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-3">
                  <label className="block govuk-!-font-size-16 font-bold mb-1">Allowlisted MIME type</label>
                  <select
                    value={mediaMimeType}
                    onChange={(e) => setMediaMimeType(e.target.value as any)}
                    className="w-full border border-[#0b0c0c] p-1.5 govuk-!-font-size-16 bg-white"
                  >
                    <option value="image/png">image/png (Architecture diagram)</option>
                    <option value="image/jpeg">image/jpeg (Screenshot)</option>
                    <option value="image/webp">image/webp (Optimized figure)</option>
                    <option value="application/pdf">application/pdf (IOC appendix)</option>
                  </select>
                </div>
                <div className="sm:col-span-4">
                  <label className="block govuk-!-font-size-16 font-bold mb-1">
                    Accessible alt text <span className="text-[#d4351c]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Describe the diagram or document for screen readers"
                    value={mediaAltText}
                    onChange={(e) => setMediaAltText(e.target.value)}
                    className="w-full border border-[#0b0c0c] p-1.5 govuk-!-font-size-16 focus:bg-[#ffdd00] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block govuk-!-font-size-16 font-bold mb-1">Caption (optional)</label>
                  <input
                    type="text"
                    placeholder="Figure 1: Exploitation flow"
                    value={mediaCaption}
                    onChange={(e) => setMediaCaption(e.target.value)}
                    className="w-full border border-[#b1b4b6] p-1.5 govuk-!-font-size-16 focus:bg-[#ffdd00] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    disabled={isUploadingMedia}
                    onClick={handleAddVerifiedMedia}
                    className="w-full bg-[#002d62] text-white govuk-!-font-size-16 font-bold py-2 px-3 hover:bg-[#001d40] cursor-pointer"
                  >
                    {isUploadingMedia ? 'Verifying...' : '+ Attach asset'}
                  </button>
                </div>
              </div>
            )}

            {(!doc.mediaAssets || doc.mediaAssets.length === 0) ? (
              <div className="p-4 bg-[#f3f2f1] govuk-!-font-size-16 text-[#505a5f]">
                No verified media assets attached to this advisory.
              </div>
            ) : (
              <div className="space-y-2">
                {doc.mediaAssets.map((asset, aIdx) => (
                  <div
                    key={asset.assetId}
                    id={`field-mediaAssets-${aIdx}-altText`}
                    className="p-3 border border-[#b1b4b6] bg-white flex flex-wrap justify-between items-center gap-2 govuk-!-font-size-16"
                  >
                    <div>
                      <span className="font-bold text-[#0b0c0c]">{asset.altText}</span>
                      {asset.caption && <span className="text-[#505a5f] ml-2">— {asset.caption}</span>}
                      <div className="font-mono govuk-!-font-size-16 text-[#505a5f] mt-0.5">
                        {asset.mimeType} · SHA-256: {asset.sha256.slice(0, 16)}...
                      </div>
                    </div>
                    {canDirectlyEdit && (
                      <button
                        type="button"
                        onClick={() =>
                          updateField(
                            'mediaAssets',
                            (doc.mediaAssets || []).filter((_, i) => i !== aIdx),
                          )
                        }
                        className="text-[#d4351c] font-bold hover:underline cursor-pointer"
                      >
                        Remove asset
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t flex justify-between">
            <button
              type="button"
              onClick={() => handleGoToStep(4)}
              className="bg-white border border-[#b1b4b6] govuk-!-font-size-16 font-bold px-4 py-2 cursor-pointer"
            >
              ← Back to Content sections
            </button>
            <button
              type="button"
              onClick={() => handleGoToStep(6)}
              className="ttcsirt-primary-action text-white font-bold px-5 py-2 govuk-!-font-size-16 cursor-pointer"
            >
              Continue to Check answers →
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: CHECK ANSWERS */}
      {activeStep === 6 && (
        <div className="bg-white border border-[#b1b4b6] p-6 space-y-6">
          <div className="border-b pb-2">
            <h2 className="govuk-heading-m">Check answers before submitting for review</h2>
            <p className="govuk-body text-[#505a5f]">
              Review all entered data and confirm accuracy. Use the "Change" action to update any section.
            </p>
          </div>

          {/* Identity Summary */}
          <div className="border border-[#b1b4b6] divide-y divide-[#b1b4b6]">
            <div className="bg-[#f8f8f8] p-3 font-bold govuk-!-font-size-16 text-[#0b0c0c] flex justify-between items-center">
              <span>1. Advisory identity & metadata</span>
              <button
                type="button"
                onClick={() => handleGoToStep(1)}
                className="govuk-!-font-size-16 text-[#1d70b8] font-bold hover:underline"
              >
                Change <span className="sr-only">identity</span>
              </button>
            </div>
            <div className="p-3 govuk-!-font-size-16 grid grid-cols-3 gap-2">
              <span className="font-bold text-[#505a5f]">Reference:</span>
              <span className="col-span-2 font-mono">{doc.referenceNumber || 'Not provided'}</span>
            </div>
            <div className="p-3 govuk-!-font-size-16 grid grid-cols-3 gap-2">
              <span className="font-bold text-[#505a5f]">Title:</span>
              <span className="col-span-2 font-bold">{doc.title || 'Not provided'}</span>
            </div>
            <div className="p-3 govuk-!-font-size-16 grid grid-cols-3 gap-2">
              <span className="font-bold text-[#505a5f]">Advisory type and distribution:</span>
              <span className="col-span-2 capitalize">{doc.classification} — {doc.tlp}</span>
            </div>
            <div className="p-3 govuk-!-font-size-16 grid grid-cols-3 gap-2">
              <span className="font-bold text-[#505a5f]">Lead paragraph:</span>
              <span className="col-span-2 govuk-!-font-size-16">{doc.leadParagraph || 'Not provided'}</span>
            </div>
          </div>

          {/* Vulnerability Summary */}
          <div className="border border-[#b1b4b6] divide-y divide-[#b1b4b6]">
            <div className="bg-[#f8f8f8] p-3 font-bold govuk-!-font-size-16 text-[#0b0c0c] flex justify-between items-center">
              <span>2. Vulnerability & CVEs ({doc.cveMetadata.length})</span>
              <button
                type="button"
                onClick={() => handleGoToStep(2)}
                className="govuk-!-font-size-16 text-[#1d70b8] font-bold hover:underline"
              >
                Change <span className="sr-only">vulnerabilities</span>
              </button>
            </div>
            {doc.cveMetadata.map((c, i) => (
              <div key={i} className="p-3 govuk-!-font-size-16 grid grid-cols-3 gap-2">
                <span className="font-mono font-bold text-[#002d62]">{c.id}</span>
                <span className="col-span-2 govuk-!-font-size-16">
                  CVSS Score: <strong>{c.cvssScore ?? 'N/A'}</strong> | Vector: {c.cvssVector || 'N/A'}
                </span>
              </div>
            ))}
          </div>

          {/* Affected Systems Summary */}
          <div className="border border-[#b1b4b6] divide-y divide-[#b1b4b6]">
            <div className="bg-[#f8f8f8] p-3 font-bold govuk-!-font-size-16 text-[#0b0c0c] flex justify-between items-center">
              <span>3. Affected products ({doc.affectedProducts.length})</span>
              <button
                type="button"
                onClick={() => handleGoToStep(3)}
                className="govuk-!-font-size-16 text-[#1d70b8] font-bold hover:underline"
              >
                Change <span className="sr-only">affected products</span>
              </button>
            </div>
            {doc.affectedProducts.map((p, i) => (
              <div key={i} className="p-3 govuk-!-font-size-16 grid grid-cols-3 gap-2">
                <span className="font-bold">
                  {p.vendor} {p.product}
                </span>
                <span className="col-span-2 govuk-!-font-size-16 font-mono">
                  Affected: {p.affectedVersions.join(', ') || 'All'} | Fixed in: {p.fixedVersions?.join(', ') || 'Pending'}
                </span>
              </div>
            ))}
          </div>

          {/* Content Summary */}
          <div className="border border-[#b1b4b6] divide-y divide-[#b1b4b6]">
            <div className="bg-[#f8f8f8] p-3 font-bold govuk-!-font-size-16 text-[#0b0c0c] flex justify-between items-center">
              <span>4. Narrative sections</span>
              <button
                type="button"
                onClick={() => handleGoToStep(4)}
                className="govuk-!-font-size-16 text-[#1d70b8] font-bold hover:underline"
              >
                Change <span className="sr-only">content</span>
              </button>
            </div>
            <div className="p-3 govuk-!-font-size-16 grid grid-cols-3 gap-2">
              <span className="font-bold text-[#505a5f]">Overview:</span>
              <span className="col-span-2 govuk-!-font-size-16">
                {doc.sections.overview?.nodes.length ? `${doc.sections.overview.nodes.length} content block(s)` : 'Empty'}
              </span>
            </div>
            <div className="p-3 govuk-!-font-size-16 grid grid-cols-3 gap-2">
              <span className="font-bold text-[#505a5f]">Remediation:</span>
              <span className="col-span-2 govuk-!-font-size-16">
                {doc.sections.remediation?.nodes.length ? `${doc.sections.remediation.nodes.length} content block(s)` : 'Empty'}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-between">
            <button
              type="button"
              onClick={() => handleGoToStep(5)}
              className="bg-white border border-[#b1b4b6] govuk-!-font-size-16 font-bold px-4 py-2"
            >
              ← Back to References
            </button>
            <button
              type="button"
              onClick={() => handleGoToStep(7)}
              className="bg-[#002d62] text-white font-bold px-5 py-2.5 govuk-!-font-size-16 hover:bg-[#001d40]"
            >
              Proceed to Review & Publishing Gate →
            </button>
          </div>
        </div>
      )}

      {/* STEP 7: REVIEW & PUBLISH GATE */}
      {activeStep === 7 && (
        <div className="bg-white border border-[#b1b4b6] p-6 space-y-6">
          <div className="border-b pb-2">
            <h2 className="govuk-heading-m">7. Review and publication</h2>
            <p className="govuk-body text-[#505a5f]">
              Two-person integrity rule strictly enforced. Authors cannot approve or self-publish their own advisories.
            </p>
          </div>

          {/* Current Status Panel */}
          <div className="p-4 bg-[#f8f8f8] border border-[#b1b4b6] flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="govuk-!-font-size-16 text-[#505a5f] font-bold">Editorial lifecycle status:</span>
              <div className="mt-1 flex items-center space-x-2">
                <GdsStatusTag status={doc.publication.status} />
                <span className="govuk-!-font-size-16 font-bold text-[#0b0c0c]">
                  {doc.publication.status === 'draft' && 'Draft — Ready for technical submission'}
                  {doc.publication.status === 'ready_for_review' && 'Ready for review — Awaiting peer reviewer and approver sign-off'}
                  {doc.publication.status === 'changes_requested' && 'Changes requested — Returned to author'}
                  {doc.publication.status === 'approved' && 'Approved — Ready for atomic public release'}
                  {doc.publication.status === 'published' && 'Published — Live on authoritative delivery plane'}
                  {doc.publication.status === 'superseded' && 'Superseded — Replaced by newer revision'}
                  {doc.publication.status === 'withdrawn' && 'Withdrawn — Archived from active circulation'}
                </span>
              </div>
            </div>
            <div className="text-right govuk-!-font-size-16 text-[#505a5f]">
              <p>Author: <strong>{doc.editorial.authorEmail}</strong></p>
              {doc.editorial.reviewerId && <p>Reviewer: {doc.editorial.reviewerId}</p>}
              {doc.editorial.approverId && <p>Approver: {doc.editorial.approverId}</p>}
            </div>
          </div>

          {/* Reviewer Feedback (if changes were requested) */}
          {doc.editorial.reviewerNotes && (
            <div className="p-4 bg-[#fff9e6] border-l-4 border-[#ffdd00]">
              <h3 className="govuk-heading-s">Reviewer feedback</h3>
              <p className="govuk-body text-[#505a5f] mt-1">{doc.editorial.reviewerNotes}</p>
            </div>
          )}

          {/* ACTION SECTION ACCORDING TO CURRENT STATUS */}

          {/* 1. DRAFT or CHANGES_REQUESTED -> Submit for Review */}
          {(doc.publication.status === 'draft' || doc.publication.status === 'changes_requested') && (
            <div className="p-5 border-2 border-[#002d62] bg-[#f2f7fb] space-y-3">
              <h3 className="govuk-heading-s">Submit advisory for peer review</h3>
              <p className="govuk-body text-[#505a5f]">
                Submitting executes full server-side validation. Once submitted, the draft enters the review queue for peer analysts.
              </p>
              <button
                type="button"
                onClick={handleSubmitForReview}
                disabled={isSaving || !isAuthor}
                className="bg-[#002d62] text-white font-bold px-6 py-3 govuk-!-font-size-16 hover:bg-[#001d40] disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Validating and submitting...' : 'Submit for review'}
              </button>
            </div>
          )}

          {/* 2. READY_FOR_REVIEW -> Reviewer/Approver Actions */}
          {doc.publication.status === 'ready_for_review' && (
            <div className="space-y-6">
              {/* Reviewer Section */}
              <div className="p-5 border border-[#b1b4b6] bg-[#fafafa] space-y-3">
                <h3 className="govuk-heading-s">Request changes</h3>
                <p className="govuk-body text-[#505a5f]">
                  If technical details, CVE vectors, or remediation instructions need improvement, return the advisory to the author.
                </p>
                <textarea
                  rows={3}
                  placeholder="Enter specific feedback notes for the author..."
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  className="w-full border border-[#0b0c0c] p-2 govuk-!-font-size-16 focus:bg-[#ffdd00] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleRequestChanges}
                  disabled={isSaving || !isReviewer}
                  className="bg-[#f47738] text-white font-bold px-4 py-2 govuk-!-font-size-16 hover:bg-[#d95e20] disabled:opacity-50 cursor-pointer"
                >
                  Request changes
                </button>
              </div>

              {/* Approver Section with Mandatory Two-Person Integrity */}
              <div className="p-5 border-2 border-[#00703c] bg-[#eaf4ec] space-y-3">
                <h3 className="govuk-heading-s text-[#00703c]">
                  Approver sign-off
                </h3>
                <p className="govuk-body text-[#505a5f]">
                  Confirm that technical review is complete before authorising publication.
                </p>

                {/* Two-Person Integrity Mechanical Safeguard */}
                {isAuthorUser && !isTestUser ? (
                  <div className="p-3 bg-[#fcedeb] border-l-4 border-[#d4351c] govuk-!-font-size-16 text-[#d4351c] font-bold">
                    Two-person integrity safeguard: You are the author of this advisory. Authors cannot approve their own work.
                    Switch identity to an independent approver (for example, K. Mahabir) in the header to approve.
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isSaving || !isApprover}
                    className="ttcsirt-primary-action text-white font-bold px-6 py-3 govuk-!-font-size-16 disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? 'Recording approval...' : 'Approve advisory'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 3. APPROVED -> Consequential Publication or Return for Changes */}
          {doc.publication.status === 'approved' && (
            <div className="space-y-4">
              <div className="p-6 border-4 border-[#00703c] bg-[#eaf4ec] space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-[#00703c]"></span>
                <h3 className="govuk-heading-s">Ready for publication</h3>
                </div>
                <p className="govuk-body text-[#505a5f]">
                  This advisory has satisfied all peer review and approval criteria.
                  Publishing will generate an immutable cryptographic release.
                </p>
                {isAuthorUser && !isTestUser ? (
                  <div className="p-3 bg-[#fcedeb] border-l-4 border-[#d4351c] govuk-!-font-size-16 text-[#d4351c] font-bold">
                    Two-person integrity safeguard: Authors cannot self-publish their own advisories. Switch identity to an independent approver to execute publication.
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPublishConfirmation(true)}
                    disabled={isSaving || !isApprover}
                    className="ttcsirt-primary-action hover:bg-[#004b83] text-white font-bold px-8 py-3.5 govuk-!-font-size-16 shadow-[0_3px_0_#003b66] active:translate-y-0.5 disabled:opacity-50 cursor-pointer"
                  >
                    Publish advisory
                  </button>
                )}
              </div>

              <div className="p-4 border border-[#b1b4b6] bg-[#fafafa] space-y-2">
                <h3 className="govuk-heading-s govuk-!-margin-bottom-2">Return approved advisory for further changes</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Reason for returning to author..."
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    className="flex-1 border border-[#0b0c0c] p-2 govuk-!-font-size-16 focus:bg-[#ffdd00] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleRequestChanges}
                    disabled={isSaving || !isReviewer}
                    className="bg-[#f47738] text-white font-bold px-4 py-2 govuk-!-font-size-16 hover:bg-[#d95e20] disabled:opacity-50 cursor-pointer"
                  >
                    Request changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. PUBLISHED / SUPERSEDED -> Post-Release Actions */}
          {(doc.publication.status === 'published' || doc.publication.status === 'superseded') && (
            <div className="p-5 border border-[#b1b4b6] bg-[#f8f8f8] space-y-4">
              <h3 className="govuk-heading-s">Post-publication management</h3>
              <p className="govuk-body text-[#505a5f]">
                Published versions are immutable. To make changes, create a new draft revision or issue a formal withdrawal.
              </p>

              <div className="flex flex-wrap gap-3">
                {isAuthor && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const revision = await PublishingApiClient.createRevision(doc.id, currentUser);
                        setDoc(revision);
                        await refreshGovernanceHistory(revision.id);
                        setActiveStep(1);
                        setBannerNotice({
                          type: 'success',
                          message: `Created revision draft v${revision.publication.version}. You can now edit and submit for review.`,
                        });
                      } catch (err: any) {
                        setBannerNotice({ type: 'error', message: err.message || 'Failed to create revision.' });
                      }
                    }}
                    className="bg-[#002d62] text-white font-bold px-4 py-2 govuk-!-font-size-16 hover:bg-[#001d40] cursor-pointer"
                  >
                    Create new revision (v{doc.publication.version + 1})
                  </button>
                )}

                {doc.publication.status === 'published' && isApprover && (
                  <button
                    type="button"
                    onClick={() => setShowWithdrawDialog(true)}
                    className="bg-[#d4351c] text-white font-bold px-4 py-2 govuk-!-font-size-16 hover:bg-[#a82513] cursor-pointer"
                  >
                    Withdraw advisory
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 5. IMMUTABLE VERSION HISTORY & SNAPSHOT ROLLBACK */}
          <div className="border-t pt-6 space-y-3">
            <h3 className="govuk-heading-s">Version history</h3>
            <p className="govuk-body text-[#505a5f]">
              Every published release is sealed with a canonical SHA-256 digest. Approvers can roll back to a prior snapshot by staging it as a new draft revision.
            </p>

            {versions.length === 0 ? (
              <div className="p-4 bg-[#f3f2f1] govuk-!-font-size-16 text-[#505a5f]">
                No published version snapshots recorded for this advisory yet.
              </div>
            ) : (
                <GcdsDataTable
                  caption={`${doc.referenceNumber}: published version history and rollback actions`}
                  columns={[
                    { field: 'version', header: 'Version', rowHeader: true },
                    { field: 'timestamp', header: 'Timestamp (UTC)' },
                    { field: 'actor', header: 'Actor' },
                    { field: 'summary', header: 'Change summary' },
                    { field: 'digest', header: 'SHA-256 digest' },
                    { field: 'rollback', header: 'Rollback', alignment: 'end', renderCell: ({ row }) => isApprover ? (
                      <button type="button" onClick={() => handleRollback(Number(row.versionNumber))} disabled={isSaving} className="govuk-!-font-size-16 font-bold text-[#1d70b8] hover:underline cursor-pointer">Restore as draft</button>
                    ) : 'Not available' },
                  ]}
                  rows={versions.map((ver) => ({
                    id: ver.versionId,
                    version: `v${ver.versionNumber}`,
                    versionNumber: ver.versionNumber,
                    timestamp: new Date(ver.publishedAt).toISOString(),
                    actor: `${ver.publishedByUserId} (approver: ${ver.approvedByUserId})`,
                    summary: ver.releaseNotes || 'No release notes recorded',
                    digest: `${ver.contentDigest.hexDigest.slice(0, 16)}...`,
                  }))}
                />
            )}
          </div>

          {/* 6. ADVISORY AUDIT LEDGER */}
          {advisoryAudit.length > 0 && (
            <div className="border-t pt-6 space-y-3">
              <h3 className="govuk-heading-s">Advisory audit history ({advisoryAudit.length} events)</h3>
                <GcdsDataTable
                  caption={`${doc.referenceNumber}: advisory audit history`}
                  columns={[
                    { field: 'timestamp', header: 'Timestamp (UTC)', rowHeader: true },
                    { field: 'action', header: 'Action' },
                    { field: 'actor', header: 'Staff actor' },
                    { field: 'transition', header: 'Transition' },
                    { field: 'notes', header: 'Notes' },
                  ]}
                  rows={advisoryAudit.map((evt) => ({
                    id: evt.eventId,
                    timestamp: new Date(evt.timestamp).toISOString(),
                    action: evt.action,
                    actor: `${evt.actor.email} (${evt.actor.role})`,
                    transition: evt.previousStatus ? `${evt.previousStatus} → ${evt.resultingStatus}` : evt.resultingStatus,
                    notes: evt.comment || 'No notes recorded',
                  }))}
                />
            </div>
          )}
        </div>
      )}

      {/* MODAL: PUBLISH CONFIRMATION DIALOG */}
      {showPublishConfirmation && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 border-4 border-[#00703c] shadow-2xl space-y-4">
            <h3 className="govuk-heading-m">Confirm advisory publication</h3>
            <p className="govuk-body text-[#505a5f]">
              You are about to publish <strong className="text-[#002d62]">{doc.referenceNumber}</strong> ({doc.title}).
            </p>
            <div className="p-3 bg-[#f8f8f8] govuk-!-font-size-16 text-[#505a5f] border space-y-1">
              <p>● Author: <strong>{doc.editorial.authorEmail}</strong></p>
              <p>● Approver: <strong>{currentUser?.displayName}</strong></p>
              <p>● Status: <strong>Approved</strong></p>
              <p>● TLP: <strong>{doc.tlp}</strong></p>
            </div>
            <p className="govuk-body text-[#505a5f]">
              This action is consequential and will be permanently recorded in the immutable audit ledger.
            </p>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowPublishConfirmation(false)}
                className="bg-white border border-[#b1b4b6] px-4 py-2 govuk-!-font-size-16 font-bold text-[#0b0c0c]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecutePublication}
                disabled={isSaving}
                className="ttcsirt-primary-action hover:bg-[#004b83] text-white px-6 py-2 govuk-!-font-size-16 font-bold shadow-[0_2px_0_#003b66]"
              >
                {isSaving ? 'Publishing...' : 'Yes, publish advisory'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: WITHDRAW DIALOG */}
      {showWithdrawDialog && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 border-4 border-[#d4351c] shadow-2xl space-y-4">
            <h3 className="govuk-heading-m">Withdraw advisory</h3>
            <p className="govuk-body text-[#505a5f]">
              Provide a formal explanation for withdrawing <strong className="text-[#002d62]">{doc.referenceNumber}</strong>.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Superseded by vendor update; vulnerability determined to be non-exploitable in target configs..."
              value={withdrawalNotice}
              onChange={(e) => setWithdrawalNotice(e.target.value)}
              className="w-full border-2 border-[#0b0c0c] p-2 govuk-!-font-size-16 focus:bg-[#ffdd00] focus:outline-none"
            />
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowWithdrawDialog(false)}
                className="bg-white border border-[#b1b4b6] px-4 py-2 govuk-!-font-size-16 font-bold text-[#0b0c0c]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={isSaving}
                className="bg-[#d4351c] text-white px-5 py-2 govuk-!-font-size-16 font-bold"
              >
                Confirm withdrawal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
