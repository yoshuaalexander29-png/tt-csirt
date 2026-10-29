/**
 * @fileoverview Staff Sign-In View (GOV.UK Transaction Service Pattern)
 * Displays canonical entry-point authentication experience for /publishing
 * using the TT-CSIRT Production Masthead and GOV.UK Frontend components.
 */

import React from 'react';
import { useStaffAuth } from '../context/AuthContext.tsx';
import { GdsHeader } from '../components/GdsHeader.tsx';
import { PublishingFooter } from '../PublishingApp.tsx';

interface Props {
  onNavigate: (path: string) => void;
}

export const StaffSignInView: React.FC<Props> = ({ onNavigate }) => {
  const { devAuthEnabled } = useStaffAuth();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <a href="#main-content" className="govuk-skip-link">
        Skip to main content
      </a>

      <GdsHeader />

      <div className="govuk-width-container ttcsirt-publishing-page-container" style={{ flex: 1 }}>
        <main id="main-content" className="govuk-main-wrapper ttcsirt-publishing-main ttcsirt-sign-in-main" role="main">
          <div className="govuk-grid-row">
            <div className="govuk-grid-column-two-thirds">
              <h1 className="govuk-heading-l">Sign in to the TT-CSIRT advisory publishing service</h1>

              <p className="govuk-body">
                Create, review, approve and publish cyber security advisories and alerts for Trinidad and Tobago.
              </p>

              <div className="govuk-inset-text">
                Access is restricted to authorised TT-CSIRT personnel. Editorial changes, approvals and releases are recorded in the audit history.
              </div>

              {devAuthEnabled ? (
                <section className="govuk-!-margin-top-6 govuk-!-margin-bottom-7" aria-labelledby="dev-auth-heading">
                  <h2 id="dev-auth-heading" className="govuk-heading-m">
                    Staff sign-in
                  </h2>
                  <p className="govuk-body">
                    Select your staff identity to continue.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('/publishing/dev-login')}
                    className="govuk-button"
                    data-module="govuk-button"
                  >
                    Continue to staff sign-in
                  </button>
                </section>
              ) : (
                <section className="govuk-!-margin-top-6 govuk-!-margin-bottom-7" aria-labelledby="prod-sso-heading">
                  <h2 id="prod-sso-heading" className="govuk-heading-m">
                    Staff single sign-on
                  </h2>
                  <p className="govuk-body">
                    Sign in using your TT-CSIRT Microsoft Entra ID account and multi-factor authentication. Staff sign-in is currently unavailable; contact service support.
                  </p>
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="govuk-button govuk-button--disabled"
                    data-module="govuk-button"
                  >
                    Continue with TT-CSIRT single sign-on
                  </button>
                </section>
              )}

              <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

              <h2 className="govuk-heading-m">Service standards</h2>
              <dl className="govuk-summary-list">
                <div className="govuk-summary-list__row">
                  <dt className="govuk-summary-list__key">Independent approval</dt>
                  <dd className="govuk-summary-list__value">
                    Authors cannot approve their own submissions.
                  </dd>
                </div>
                <div className="govuk-summary-list__row">
                  <dt className="govuk-summary-list__key">Submission checks</dt>
                  <dd className="govuk-summary-list__value">
                    Required advisory content and metadata are checked before review and publication.
                  </dd>
                </div>
                <div className="govuk-summary-list__row">
                  <dt className="govuk-summary-list__key">Audit history</dt>
                  <dd className="govuk-summary-list__value">
                    Editorial decisions and releases are recorded for accountability.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </main>
      </div>

      <PublishingFooter />
    </div>
  );
};
