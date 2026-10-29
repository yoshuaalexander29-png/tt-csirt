/**
 * @fileoverview Development Test Identity Login View (GOV.UK Transaction Service Pattern)
 * Route: /publishing/dev-login
 *
 * CRITICAL SAFETY INVARIANT:
 * This view is mechanically unavailable when development authentication is disabled
 * or in production environments.
 * It strictly uses the server allowlist and never permits arbitrary roles or user IDs.
 */

import React, { useState } from 'react';
import { useStaffAuth } from '../context/AuthContext.tsx';
import { GdsHeader } from '../components/GdsHeader.tsx';
import { PublishingFooter } from '../PublishingApp.tsx';

interface Props {
  onNavigate: (path: string) => void;
}

export const DevLoginView: React.FC<Props> = ({ onNavigate }) => {
  const { devAuthEnabled, availableUsers, login } = useStaffAuth();
  const [selectedKey, setSelectedKey] = useState<string>('author-1');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // If dev auth is disabled, show standard GOV.UK 404 message
  if (!devAuthEnabled) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <a href="#main-content" className="govuk-skip-link">
          Skip to main content
        </a>

        <GdsHeader />

        <div className="govuk-width-container" style={{ flex: 1 }}>
          <main id="main-content" className="govuk-main-wrapper" role="main">
            <div className="govuk-grid-row">
              <div className="govuk-grid-column-full">
                <h1 className="govuk-heading-l">Page not found</h1>
                <p className="govuk-body">
                  The page you requested is not available.
                </p>
                <p className="govuk-body">
                  Return to staff sign-in to continue.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('/publishing')}
                  className="govuk-button"
                  data-module="govuk-button"
                >
                  Return to staff sign-in
                </button>
              </div>
            </div>
          </main>
        </div>

        <PublishingFooter />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKey) {
      setErrorMessage('Select a staff identity to continue.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login(selectedKey);
      onNavigate('/publishing');
    } catch (err: any) {
      setErrorMessage('Sign-in was unsuccessful. Try again.');
      setIsSubmitting(false);
    }
  };

  const identityDescriptions: Record<string, { roleTitle: string; permissions: string; note: string }> = {
    'author-1': {
      roleTitle: 'Author',
      permissions: 'Draft creation, metadata editing, section authoring, submission for peer review.',
      note: 'Enforces two-person integrity: cannot self-approve or publish own advisories.',
    },
    'reviewer-1': {
      roleTitle: 'Reviewer',
      permissions: 'Advisory inspection, editorial peer review, technical feedback, change requests.',
      note: 'Cannot publish advisories without independent approver authorization.',
    },
    'approver-1': {
      roleTitle: 'Approver',
      permissions: 'Independent two-person integrity approval, cryptographic snapshot publication, formal withdrawal.',
      note: 'Cannot approve advisories authored by themselves.',
    },
    'admin-1': {
      roleTitle: 'Administrator',
      permissions: 'Full operational governance, emergency override, and comprehensive audit ledger inspection.',
      note: 'Holds author, reviewer, approver, and admin role privileges.',
    },
    'reader-1': {
      roleTitle: 'Reader',
      permissions: 'Read-only access to advisories, worklists, version history, and audit ledger.',
      note: 'Cannot create, edit, review, approve, or publish any advisory content.',
    },
    'test-user': {
      roleTitle: 'Publishing officer',
      permissions: 'Advisory authoring, review, approval and record management.',
      note: '',
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <a href="#main-content" className="govuk-skip-link">
        Skip to main content
      </a>

      <GdsHeader />

      <div className="govuk-width-container ttcsirt-publishing-page-container" style={{ flex: 1 }}>
        <a
          href="/publishing"
          className="govuk-back-link"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('/publishing');
          }}
        >
          Back to staff sign-in
        </a>

        <main id="main-content" className="govuk-main-wrapper ttcsirt-publishing-main" role="main">
          <div className="govuk-grid-row">
            <div className="govuk-grid-column-full">
              {errorMessage && (
                <div
                  className="govuk-error-summary"
                  role="alert"
                  tabIndex={-1}
                  aria-labelledby="error-summary-heading"
                  data-module="govuk-error-summary"
                >
                  <h2 id="error-summary-heading" className="govuk-error-summary__title">
                    There is a problem
                  </h2>
                  <div className="govuk-error-summary__body">
                    <ul className="govuk-list govuk-error-summary__list">
                      <li>
                        <a href="#dev-identity-author-1">{errorMessage}</a>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className={`govuk-form-group ${errorMessage ? 'govuk-form-group--error' : ''}`}>
                  <fieldset className="govuk-fieldset" aria-describedby="dev-identity-hint">
                    <legend className="govuk-fieldset__legend govuk-fieldset__legend--l">
                      <h1 className="govuk-fieldset__heading">
                        Select a staff identity
                      </h1>
                    </legend>
                    <div id="dev-identity-hint" className="govuk-hint">
                      Choose the staff role for this session.
                    </div>

                    {errorMessage && (
                      <p className="govuk-error-message">
                        <span className="govuk-visually-hidden">Error:</span> {errorMessage}
                      </p>
                    )}

                    <div className="govuk-radios" data-module="govuk-radios">
                      {Object.entries(availableUsers).map(([key, user]) => {
                        const isSelected = selectedKey === key;
                        const desc = identityDescriptions[key] || {
                          roleTitle: user.roles.join(', '),
                          permissions: 'Standard staff operations',
                          note: '',
                        };
                        const radioId = `dev-identity-${key}`;
                        const hintId = `dev-identity-${key}-hint`;

                        return (
                          <div key={key} className="govuk-radios__item">
                            <input
                              id={radioId}
                              className="govuk-radios__input"
                              type="radio"
                              name="dev-identity"
                              value={key}
                              checked={isSelected}
                              onChange={() => setSelectedKey(key)}
                              disabled={isSubmitting}
                              aria-describedby={hintId}
                            />
                            <label className="govuk-label govuk-radios__label" htmlFor={radioId}>
                              <strong>{key === 'test-user' ? 'Publishing officer' : user.displayName}</strong> — {desc.roleTitle} ({user.department})
                            </label>
                            <div id={hintId} className="govuk-hint govuk-radios__hint">
                              {desc.permissions} {desc.note}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </fieldset>
                </div>

                <div className="govuk-button-group ttcsirt-sign-in-actions">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="govuk-button"
                    data-module="govuk-button"
                  >
                    {isSubmitting ? 'Signing in...' : 'Continue'}
                  </button>

                  <a
                    href="/publishing"
                    className="govuk-link"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('/publishing');
                    }}
                  >
                    Return to staff sign-in
                  </a>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>

      <PublishingFooter />
    </div>
  );
};
