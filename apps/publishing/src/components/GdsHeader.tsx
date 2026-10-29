/**
 * @fileoverview TT-CSIRT Production Masthead & Advisory Publishing Service Navigation
 * Uses the canonical TT-CSIRT / Ministry of Homeland Security masthead markup
 * paired with GOV.UK-compatible service navigation and phase banner.
 */

import React from 'react';
import coatOfArms from '@/assets/Coat_of_arms_MoF.png';
import { useStaffAuth } from '../context/AuthContext.tsx';

interface Props {
  currentView?: string;
  onNavigate?: (view: string) => void;
  hasUnsavedChanges?: boolean;
  onUnsavedChangesChange?: (hasUnsavedChanges: boolean) => void;
}

export const GdsHeader: React.FC<Props> = ({ currentView, onNavigate, hasUnsavedChanges = false, onUnsavedChangesChange }) => {
  const { currentUser, logout, switchUser, availableUsers, devAuthEnabled, isAuthor } = useStaffAuth();
  const confirmNavigation = () => {
    if (!hasUnsavedChanges) return true;
    const leave = window.confirm('You have unsaved changes. Leave this advisory without saving?');
    if (leave) onUnsavedChangesChange?.(false);
    return leave;
  };
  const handleMastheadNavigation = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      !onNavigate || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
    ) return;
    event.preventDefault();
    if (confirmNavigation()) onNavigate('worklist');
  };

  return (
    <>
      <header
        className="govuk-generic-header"
        data-module="govuk-generic-header"
      >
        <div className="govuk-generic-header__container govuk-width-container">
          <div className="government-lockup">
            <a
              href="/publishing"
              className="govuk-generic-header__homepage-link"
              onClick={handleMastheadNavigation}
            >
              <div className="government-masthead__emblem-slot">
                <img
                  src={coatOfArms}
                  alt="Coat of Arms of the Republic of Trinidad and Tobago"
                  className="government-masthead__coat"
                />
              </div>

              <div className="government-masthead__title-top">
                Government of the Republic of Trinidad and Tobago
              </div>

              <div className="government-masthead__title-mid">
                Ministry of Homeland Security
              </div>
            </a>

            <div className="government-masthead__service-row">
              <a
                href="/publishing"
                className="government-masthead__service-link"
                onClick={handleMastheadNavigation}
              >
                <span className="government-masthead__title-service">
                  Trinidad and Tobago Cyber Security Incident Response Team
                </span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* GOV.UK Service Navigation & Phase Bar */}
      <div className="ttcsirt-publishing-service-bar">
        <div className="govuk-width-container">
          {currentUser && onNavigate && (
            <div className="ttcsirt-publishing-service-bar__inner">
              <nav aria-label="Advisory publishing navigation">
                <ul className="ttcsirt-publishing-nav">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirmNavigation()) onNavigate('worklist');
                      }}
                      aria-current={currentView === 'worklist' ? 'page' : undefined}
                      className={`ttcsirt-publishing-nav__link ${
                        currentView === 'worklist' ? 'ttcsirt-publishing-nav__link--active' : ''
                      }`}
                    >
                      Advisories worklist
                    </button>
                  </li>
                  {isAuthor && currentView !== 'worklist' && currentView !== 'wizard' && (
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirmNavigation()) onNavigate('new-advisory');
                        }}
                        aria-current={currentView === 'new-advisory' || currentView === 'wizard' ? 'page' : undefined}
                        className={`ttcsirt-publishing-nav__link ${
                          currentView === 'new-advisory' || currentView === 'wizard'
                            ? 'ttcsirt-publishing-nav__link--active'
                            : ''
                        }`}
                      >
                        Create new advisory draft
                      </button>
                    </li>
                  )}
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirmNavigation()) onNavigate('audit');
                      }}
                      aria-current={currentView === 'audit' ? 'page' : undefined}
                      className={`ttcsirt-publishing-nav__link ${
                        currentView === 'audit' ? 'ttcsirt-publishing-nav__link--active' : ''
                      }`}
                    >
                      Audit trail
                    </button>
                  </li>
                </ul>
              </nav>

              <div className="ttcsirt-publishing-service-bar__account-actions" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '15px' }}>
                {devAuthEnabled && (
                  <div className="ttcsirt-publishing-service-bar__identity" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <label
                      htmlFor="publishing-role-switcher"
                      className="govuk-label govuk-!-margin-bottom-0"
                      style={{ fontWeight: 700 }}
                    >
                      Signed in as:
                    </label>
                    <select
                      id="publishing-role-switcher"
                      value={
                        Object.keys(availableUsers).find((k) => availableUsers[k].id === currentUser.id) || 'author-1'
                      }
                      onChange={(e) => {
                        if (!hasUnsavedChanges || window.confirm('Switching identity may affect your ability to save these changes. Continue?')) {
                          void switchUser(e.target.value);
                        }
                      }}
                      className="govuk-select"
                      aria-label="Change staff identity"
                    >
                      {Object.entries(availableUsers).map(([key, u]) => (
                        <option key={key} value={key}>
                          {key === 'test-user' ? 'Publishing officer' : u.displayName} ({u.roles.join(', ')})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {!devAuthEnabled && (
                  <span className="govuk-body-s govuk-!-margin-bottom-0">
                    <strong>{currentUser.displayName}</strong> ({currentUser.roles.join(', ')})
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (confirmNavigation()) void logout();
                  }}
                  className="govuk-button govuk-button--secondary govuk-!-margin-bottom-0"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
