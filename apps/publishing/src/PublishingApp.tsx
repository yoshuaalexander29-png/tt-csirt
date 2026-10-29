import React, { useState, useEffect } from 'react';
import coatOfArmsFooter from '@/assets/coat_of_arms_footer.svg';
import { AuthProvider, useStaffAuth } from './context/AuthContext.tsx';
import { GdsHeader } from './components/GdsHeader.tsx';
import { WorklistView } from './views/WorklistView.tsx';
import { AuditHistoryView } from './views/AuditHistoryView.tsx';
import { StaffSignInView } from './views/StaffSignInView.tsx';
import { DevLoginView } from './views/DevLoginView.tsx';

const AuthoringWizardView = React.lazy(() =>
  import('./views/AuthoringWizardView.tsx').then((module) => ({ default: module.AuthoringWizardView })),
);
const PreviewModal = React.lazy(() =>
  import('./views/PreviewModal.tsx').then((module) => ({ default: module.PreviewModal })),
);

export const PublishingFooter: React.FC = () => (
  <footer className="govuk-footer ttcsirt-footer ttcsirt-publishing-footer" role="contentinfo">
    <div className="govuk-width-container">
      <div className="govuk-footer__meta">
        <div className="govuk-footer__meta-item govuk-footer__meta-item--grow">
          <h2 className="govuk-visually-hidden">Support links</h2>
          <ul className="govuk-footer__inline-list">
            <li className="govuk-footer__inline-list-item">
              <a className="govuk-footer__link govuk-link govuk-link--inverse" href="/">
                TT-CSIRT public portal
              </a>
            </li>
            <li className="govuk-footer__inline-list-item">
              <a className="govuk-footer__link govuk-link govuk-link--inverse" href="/advisories">
                Cyber security advisories
              </a>
            </li>
            <li className="govuk-footer__inline-list-item">
              <a className="govuk-footer__link govuk-link govuk-link--inverse" href="/accessibility-statement">
                Accessibility statement
              </a>
            </li>
            <li className="govuk-footer__inline-list-item">
              <a className="govuk-footer__link govuk-link govuk-link--inverse" href="/privacy-policy">
                Privacy policy (DPA)
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="ttcsirt-footer__emblem-section">
        <div className="ttcsirt-footer__emblem-slot">
          <img
            src={coatOfArmsFooter}
            alt=""
            aria-hidden="true"
            className="ttcsirt-footer__coat"
          />
        </div>
        <div className="govuk-footer__licence-description govuk-body-s">
          © 2026 Government of the Republic of Trinidad and Tobago. All rights reserved.
        </div>
      </div>
    </div>
  </footer>
);

export const PublishingAppContent: React.FC = () => {
  const { currentUser, isLoading } = useStaffAuth();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentView, setCurrentView] = useState<'worklist' | 'wizard' | 'new-advisory' | 'audit'>('worklist');
  const [selectedAdvisoryId, setSelectedAdvisoryId] = useState<string | null>(null);
  const [previewAdvisoryId, setPreviewAdvisoryId] = useState<string | null>(null);
  const [route, setRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '/publishing';
  });

  useEffect(() => {
    const handlePopState = () => {
      setRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      setRoute(path);
    }
  };

  useEffect(() => {
    if (currentUser && route === '/publishing/dev-login') {
      navigate('/publishing');
    }
  }, [currentUser, route]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between">
        <a href="#main-content" className="govuk-skip-link">
          Skip to main content
        </a>
        <GdsHeader />
        <div className="govuk-width-container" style={{ flex: 1 }}>
          <main id="main-content" className="govuk-main-wrapper" role="main">
            <p className="govuk-body" role="status" aria-live="polite">
              Checking staff credentials...
            </p>
          </main>
        </div>
        <PublishingFooter />
      </div>
    );
  }

  if (!currentUser) {
    if (route === '/publishing/dev-login' || route.startsWith('/publishing/dev-login/')) {
      return <DevLoginView onNavigate={navigate} />;
    }
    return <StaffSignInView onNavigate={navigate} />;
  }

  const handleSelectAdvisory = (advisoryId: string, action?: 'edit' | 'review' | 'preview') => {
    if (action === 'preview') {
      setPreviewAdvisoryId(advisoryId);
    } else {
      setSelectedAdvisoryId(advisoryId);
      setCurrentView('wizard');
    }
  };

  const handleCreateNew = () => {
    setSelectedAdvisoryId(null);
    setCurrentView('wizard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <a href="#main-content" className="govuk-skip-link">
        Skip to main content
      </a>

      <GdsHeader
        currentView={currentView}
        hasUnsavedChanges={hasUnsavedChanges}
        onUnsavedChangesChange={setHasUnsavedChanges}
        onNavigate={(view) => {
          if (view === 'new-advisory') {
            setSelectedAdvisoryId(null);
            setCurrentView('wizard');
          } else {
            setCurrentView(view as any);
          }
        }}
      />

      <div className="govuk-width-container ttcsirt-publishing-page-container" style={{ flex: 1 }}>
        {currentView === 'audit' && (
          <nav className="govuk-breadcrumbs ttcsirt-publishing-breadcrumbs" aria-label="Breadcrumb">
            <ol className="govuk-breadcrumbs__list">
              <li className="govuk-breadcrumbs__list-item">
                <a
                  href="/publishing"
                  className="govuk-breadcrumbs__link"
                  onClick={(event) => {
                    event.preventDefault();
                    setCurrentView('worklist');
                  }}
                >
                  Publishing
                </a>
              </li>
              <li className="govuk-breadcrumbs__list-item" aria-current="page">
                Audit history
              </li>
            </ol>
          </nav>
        )}
        <main id="main-content" className="govuk-main-wrapper ttcsirt-publishing-main" role="main">
          {currentView === 'worklist' && (
            <WorklistView
              onSelectAdvisory={handleSelectAdvisory}
              onCreateNew={handleCreateNew}
            />
          )}

          {currentView === 'wizard' && (
            <React.Suspense fallback={<p className="govuk-body" role="status">Loading advisory editor...</p>}>
              <AuthoringWizardView
                advisoryId={selectedAdvisoryId}
                onBackToWorklist={() => setCurrentView('worklist')}
                onOpenPreview={(id) => setPreviewAdvisoryId(id)}
                onUnsavedChangesChange={setHasUnsavedChanges}
              />
            </React.Suspense>
          )}

          {currentView === 'audit' && <AuditHistoryView />}
        </main>
      </div>

      {previewAdvisoryId && (
        <React.Suspense fallback={null}>
          <PreviewModal
            advisoryId={previewAdvisoryId}
            onClose={() => setPreviewAdvisoryId(null)}
          />
        </React.Suspense>
      )}

      <PublishingFooter />
    </div>
  );
};

export const PublishingApp: React.FC = () => {
  return (
    <AuthProvider>
      <PublishingAppContent />
    </AuthProvider>
  );
};
