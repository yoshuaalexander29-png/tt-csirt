import { lazy, Suspense, useState, useEffect, useLayoutEffect, useRef, useId, FormEvent } from "react";
import coatOfArms from "@/assets/coat-of-arms-mof.webp";
import coatOfArmsFooter from "@/assets/coat_of_arms_mono_black.png";
import ttcsirtLogo from "@/assets/ttcsirt-logo-horizontal.png";
import govttLogo from "@/assets/govtt-logo.png";
import familySafetyImg from "@/assets/illustrations/family-safety.jpg";
import businessTrainingImg from "@/assets/illustrations/business-training.jpg";
import commonwealthMeetingImg from "@/assets/illustrations/commonwealth-meeting-mr-bachu.jpg";
import ttcsirtHeroTeamImg from "@/assets/illustrations/ttcsirt-hero-team.png";
const HomeAdvisoriesSection = lazy(() => import("@/components/HomeAdvisoriesSection").then((module) => ({ default: module.HomeAdvisoriesSection })));
const AdvisoriesPage = lazy(() => import("@/pages/AdvisoriesPage").then((module) => ({ default: module.AdvisoriesPage })));
import { PageNavigation } from "@/components/PageNavigation";
import { HyperlinkList } from "@/components/HyperlinkList";
const AdvisoryDetailPage = lazy(() => import("@/pages/AdvisoryDetailPage").then((module) => ({ default: module.AdvisoryDetailPage })));
const StatisticsPage = lazy(() => import("@/pages/StatisticsPage").then((module) => ({ default: module.StatisticsPage })));
const ServicesHubPage = lazy(() => import("@/pages/ServicesHubPage").then((module) => ({ default: module.ServicesHubPage })));
const IncidentResponsePage = lazy(() => import("@/pages/IncidentResponsePage").then((module) => ({ default: module.IncidentResponsePage })));
const ReportIncidentPage = lazy(() => import("@/pages/ReportIncidentPage").then((module) => ({ default: module.ReportIncidentPage })));
const ProactiveRiskManagementPage = lazy(() => import("@/pages/ProactiveRiskManagementPage").then((module) => ({ default: module.ProactiveRiskManagementPage })));
const GuidanceHubPage = lazy(() => import("@/pages/GuidanceHubPage").then((module) => ({ default: module.GuidanceHubPage })));
const GuidanceDetailPage = lazy(() => import("@/pages/GuidanceDetailPage").then((module) => ({ default: module.GuidanceDetailPage })));
const ProactiveRiskGuidancePage = lazy(() => import("@/pages/ProactiveRiskGuidancePage").then((module) => ({ default: module.ProactiveRiskGuidancePage })));
const NewsEventsPage = lazy(() => import("@/pages/NewsEventsPage").then((module) => ({ default: module.NewsEventsPage })));
const EditorialDetailPage = lazy(() => import("@/pages/EditorialDetailPage").then((module) => ({ default: module.EditorialDetailPage })));
const TrainingPage = lazy(() => import("@/pages/TrainingPage").then((module) => ({ default: module.TrainingPage })));
const AboutPage = lazy(() => import("@/pages/AboutPage").then((module) => ({ default: module.AboutPage })));
const NationalStrategyPage = lazy(() => import("@/pages/NationalStrategyPage").then((module) => ({ default: module.NationalStrategyPage })));
const ContactPage = lazy(() => import("@/pages/ContactPage").then((module) => ({ default: module.ContactPage })));
const AccessibilityStatementPage = lazy(() => import("@/pages/AccessibilityStatementPage").then((module) => ({ default: module.AccessibilityStatementPage })));
const PrivacyPolicyPage = lazy(() => import("@/pages/PrivacyPolicyPage").then((module) => ({ default: module.PrivacyPolicyPage })));
const SearchPage = lazy(() => import("@/pages/SearchPage").then((module) => ({ default: module.SearchPage })));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage })));
import TtcsirtNavigation, { NAVIGATION } from "@/components/TtcsirtNavigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Details } from "@/components/gcds/Details";
import { Button } from "@/components/gcds/Button";
import { Route, resolveRoute, getDocumentTitle, getCanonicalPath } from "@/routing/routes";
import { getSynchronousStatistics, getResilientStatistics } from "./services/statisticsCache";
import { FALLBACK_STATISTICS, IncidentStatistics } from "./services/statistics";
import "@/styles/homepage.css";

interface TtcsirtHeaderProps {
  currentPath: string;
  onNavigate: (path: string, hash?: string) => void;
}

function TtcsirtHeader({ currentPath, onNavigate }: TtcsirtHeaderProps) {

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [authenticityOpen, setAuthenticityOpen] = useState(false);
  const searchPanelId = useId();
  const searchInputId = useId();
  const mobileMenuId = useId();
  const authenticityPanelId = useId();
  const authenticityPanelRef = useRef<HTMLDivElement>(null);
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const authenticityToggleRef = useRef<HTMLButtonElement>(null);

  // Close panels on route changes
  useEffect(() => {
    setSearchOpen(false);
    setNavOpen(false);
    setAuthenticityOpen(false);
  }, [currentPath]);

  // Focus the visible search field in the same commit that opens its panel.
  useLayoutEffect(() => {
    if (!searchOpen) return;
    searchInputRef.current?.focus();
  }, [searchOpen]);

  useLayoutEffect(() => {
    if (authenticityPanelRef.current) {
      authenticityPanelRef.current.inert = !authenticityOpen;
    }
  }, [authenticityOpen]);

  // Keep the disclosure keyboard-operable without changing the Menu/Search focus flows.
  useEffect(() => {
    if (!authenticityOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setAuthenticityOpen(false);
        authenticityToggleRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [authenticityOpen]);

  // Handle Escape key: close search and return focus to toggle button
  useEffect(() => {
    if (!searchOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSearchOpen(false);
        searchToggleRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [searchOpen]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      onNavigate(`/search?q=${encodeURIComponent(trimmed)}`);
      setSearchOpen(false);
    } else {
      searchInputRef.current?.focus();
    }
  };

  return (
    <header className="govuk-generic-header" data-module="govuk-generic-header">
      <div className="government-masthead__government-band">
        <div className="govuk-generic-header__container govuk-width-container">
          <div className="government-masthead__identity-row">
            <a
              href="https://homelandsecurity.gov.tt/"
              className="govuk-generic-header__homepage-link"
              aria-label="Ministry of Homeland Security homepage, Government of the Republic of Trinidad and Tobago"
            >
              <span className="government-masthead__identity">
                <span className="government-masthead__emblem-slot">
                  <img
                    src={coatOfArms}
                    alt="Coat of arms of Trinidad and Tobago"
                    className="government-masthead__coat"
                  />
                </span>
                <span className="government-masthead__government-copy">
                  <span className="government-masthead__title-top">
                    Government of the Republic of Trinidad and Tobago
                  </span>
                  <span className="government-masthead__title-mid">
                    Ministry of Homeland Security
                  </span>
                </span>
              </span>
            </a>

            <div className="government-masthead__supporting-identity">
              <button
                ref={authenticityToggleRef}
                type="button"
                className="government-masthead__authenticity-toggle"
                aria-controls={authenticityPanelId}
                aria-expanded={authenticityOpen}
                onClick={() => {
                  if (!authenticityOpen) {
                    setSearchOpen(false);
                    setNavOpen(false);
                  }
                  setAuthenticityOpen((open) => !open);
                }}
              >
                <span className="government-masthead__authenticity-label-full">
                  Here's how you know
                </span>
                <span className="government-masthead__authenticity-label-short">
                  Here's how you know
                </span>
                <svg
                  className="government-masthead__authenticity-chevron"
                  viewBox="0 0 16 16"
                  width="16"
                  height="16"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m3 6 5 5 5-5" />
                </svg>
              </button>

              <a
                href="https://www.gov.tt/"
                className="government-masthead__digital-government-link"
                aria-label="GOVTT"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={govttLogo}
                  alt="GOVTT"
                  className="government-masthead__digital-government-logo"
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={authenticityPanelRef}
        id={authenticityPanelId}
        className={`government-masthead__authenticity-panel${
          authenticityOpen ? " government-masthead__authenticity-panel--open" : ""
        }`}
        aria-hidden={!authenticityOpen}
      >
        <div className="government-masthead__authenticity-panel-inner">
          <div className="govuk-width-container government-masthead__authenticity-content">
            <div className="government-masthead__authenticity-card">
              <svg
                className="government-masthead__authenticity-icon"
                viewBox="0 0 40 40"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 35h30M8 35V13l12-8 12 8v22M13 35V23h14v12M13 15h4m6 0h4m-14 4h4m6 0h4" />
              </svg>
              <div>
                <p className="government-masthead__authenticity-heading">
                  <strong>Official websites use .gov.tt</strong>
                </p>
                <p className="government-masthead__authenticity-copy">
                  A .gov.tt address means the site belongs to a real government organisation in Trinidad and Tobago.
                </p>
              </div>
            </div>

            <div className="government-masthead__authenticity-card">
              <svg
                className="government-masthead__authenticity-icon"
                viewBox="0 0 40 40"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  className="government-masthead__lock-shackle"
                  d="M12 18v-5a8 8 0 0 1 16 0v5"
                />
                <rect x="8" y="18" width="24" height="17" rx="2" />
                <circle cx="20" cy="26" r="1.5" />
                <path d="M20 27.5v3" />
              </svg>
              <div>
                <p className="government-masthead__authenticity-heading">
                  <strong>Secure sites use HTTPS</strong>
                </p>
                <p className="government-masthead__authenticity-copy">
                  A padlock or https:// at the start of the address means your connection is protected. Only share sensitive information on sites like this.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="government-masthead__service-band">
        <div className="govuk-generic-header__container govuk-width-container">
          <div className="government-masthead__service-row">
            <div className="government-masthead__service-identity">
              <a
                href="/"
                className="government-masthead__service-link"
              >
                <img
                  src={ttcsirtLogo}
                  alt=""
                  className="government-masthead__service-logo"
                />
                <span className="government-masthead__service-name">
                  <span className="government-masthead__service-context">
                    Trinidad and Tobago
                  </span>
                  <span className="government-masthead__service-title">
                    Cyber Security Incident Response Team
                  </span>
                </span>
              </a>
            </div>

            <div className="ttcsirt-header-utility-group">
              <button
                type="button"
                className="ttcsirt-header-menu-toggle"
                aria-controls={mobileMenuId}
                aria-expanded={navOpen}
                aria-label={navOpen ? "Hide navigation menu" : "Show navigation menu"}
                onClick={() => {
                  setAuthenticityOpen(false);
                  setNavOpen((prev) => {
                    if (!prev) setSearchOpen(false);
                    return !prev;
                  });
                }}
              >
                <span className="ttcsirt-header-menu-toggle__text">Menu</span>
                <span
                  className={`ttcsirt-header-menu-toggle__chevron${
                    navOpen ? " ttcsirt-header-menu-toggle__chevron--open" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>

              <button
                ref={searchToggleRef}
                type="button"
                className="ttcsirt-header-search-toggle"
                aria-controls={searchPanelId}
                aria-expanded={searchOpen}
                aria-label={searchOpen ? "Close search" : "Search TT-CSIRT"}
                title={searchOpen ? "Close search" : "Search"}
                onClick={() => {
                  setAuthenticityOpen(false);
                  setSearchOpen((prev) => {
                    if (!prev) setNavOpen(false);
                    return !prev;
                  });
                }}
              >
                <span className="govuk-visually-hidden">
                  {searchOpen ? "Close search" : "Search"}
                </span>
                {searchOpen ? (
                  <svg
                    className="ttcsirt-header-search-toggle__icon"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    aria-hidden="true"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : (
                  <svg
                    className="ttcsirt-header-search-toggle__icon"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    aria-hidden="true"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <TtcsirtNavigation
        currentPath={currentPath}
        onNavigate={(path) => onNavigate(path)}
        mobileOpen={navOpen}
        onMobileToggle={() => setNavOpen((prev) => !prev)}
        mobileMenuId={mobileMenuId}
      />

      <div
        id={searchPanelId}
        className="ttcsirt-header-search-panel"
        hidden={!searchOpen}
      >
        <div className="govuk-width-container">
          <form
            role="search"
            className="ttcsirt-header-search-form"
            onSubmit={handleSearch}
          >
            <label
              htmlFor={searchInputId}
              className="ttcsirt-header-search-label"
            >
              Search
            </label>
            <div className="ttcsirt-header-search-input-wrapper">
              <input
                id={searchInputId}
                ref={searchInputRef}
                className="ttcsirt-header-search-input"
                name="q"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="submit"
                className="ttcsirt-header-search-submit"
              >
                <span className="govuk-visually-hidden">Search</span>
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </header>
  );
}

function PageHeader({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <>
      <h1 id="main-page-heading" className="govuk-heading-xl">
        Cyber security in Trinidad and Tobago
      </h1>
      <p className="govuk-body-l">
        TT-CSIRT is Trinidad and Tobago's national cyber security incident response team. Use this site to report an incident, check current advisories and find practical guidance for individuals, businesses and public services.
      </p>
    </>
  );
}

function WhatWeDoSection({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <section id="what-we-do" aria-labelledby="what-we-do-heading">
      <h2 className="govuk-heading-l" id="what-we-do-heading">
        About TT-CSIRT
      </h2>
      <p className="govuk-body">
        TT-CSIRT coordinates cyber incident response and shares guidance to help protect Trinidad and Tobago's digital services. The team operates under the Ministry of Homeland Security.
        {" "}Read about{" "}
        <a
          href="/about"
          className="govuk-link"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("/about");
          }}
        >
          TT-CSIRT's role and mandate
        </a>
        .
      </p>
    </section>
  );
}

function EmergencySupportSection({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <section id="emergency-support" aria-labelledby="emergency-support-heading" className="govuk-!-margin-bottom-9">
      <div className="govuk-inset-text emergency-support-inset">
        <h2 id="emergency-support-heading" className="govuk-heading-l">
          Need support?
        </h2>
        <p className="govuk-body">
          If your organisation is under cyber attack, affected by ransomware, or suspects a data breach, contact TT-CSIRT now.
        </p>

        <p className="govuk-body">
          Received a suspicious message? Read our guidance on{" "}
          <a href="/guidance/phishing-scams" className="govuk-link" onClick={(event) => {
            event.preventDefault();
            onNavigate("/guidance/phishing-scams");
          }}>
            identifying and handling phishing scams
          </a>
          .
        </p>
        
        <h3 className="govuk-heading-m">
          Phone
        </h3>
        <p className="govuk-body">
          <a href="tel:+18686257937" className="govuk-link">
            +1 868 625 7937
          </a>
          {" "}or{" "}
          <a href="tel:+18682998827" className="govuk-link">
            +1 868 299 8827
          </a>
        </p>


        <div className="govuk-!-margin-top-4">
          <Button
            role="primary"
            type="link"
            className="ttcsirt-primary-cta"
            href="/report-an-incident"
            id="homepage-report-cta"
            onClick={(event) => {
              event.preventDefault();
              onNavigate("/report-an-incident");
            }}
          >
            <span className="ttcsirt-primary-cta__content">
              <span>Report a cyber incident</span>
              <svg className="ttcsirt-primary-cta__chevron" aria-hidden="true" focusable="false" viewBox="0 0 16 20">
                <path fill="currentColor" d="M2 1h5l8 9-8 9H2l8-9z" />
              </svg>
            </span>
          </Button>
        </div>
      </div>

      <Details title="What happens when you report an incident to TT-CSIRT?">
          <p className="govuk-body">
            Our incident handling team assesses reported incidents according to verified response levels: Consultative, Incident Handling, and Incident Management. We provide technical mitigation advice, containment strategies, and coordination with law enforcement or international CSIRTs where appropriate.
          </p>
          <p className="govuk-body">
            All reports are handled under strict confidentiality protocols in accordance with the National Cyber Security Framework.
          </p>
      </Details>
    </section>
  );
}

function GuidanceSection({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <section id="cyber-security-guidance" aria-labelledby="cyber-security-guidance-heading" className="govuk-!-margin-bottom-9">
      <h2 id="cyber-security-guidance-heading" className="govuk-heading-l">
        Find guidance for your role
      </h2>

      <p className="govuk-body">
        Find practical advice on common cyber security risks, from protecting personal information to securing critical services.{" "}
        <a
          href="/guidance"
          className="govuk-link"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("/guidance");
          }}
        >
          Explore all guidance and procedural frameworks
        </a>.
      </p>

      <ul className="homepage-audience-grid">
      {/* Individuals and families */}
      <li className="guidance-audience-block">
        <div className="editorial-image-container">
          <img 
            src={familySafetyImg} 
            alt="Family using digital devices safely at home" 
            className="editorial-editorial-image" 
            loading="lazy" 
          />
        </div>

        <h3 className="govuk-heading-m">
          Individuals and families
        </h3>

        <p className="govuk-body">
          Worried about scams or keeping your accounts safe? Find out how to spot{" "}
          <a
            className="govuk-link"
            href="/guidance/phishing-scams"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("/guidance/phishing-scams");
            }}
          >
            phishing and social engineering
          </a>
          , protect{" "}
          <a
            className="govuk-link"
            href="/guidance/account-security"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("/guidance/account-security");
            }}
          >
            your personal information and accounts
          </a>
          , and secure{" "}
          <a
            className="govuk-link"
            href="/guidance/cyber-safety-basics"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("/guidance/cyber-safety-basics");
            }}
          >
            your devices and home Wi-Fi
          </a>
          .
        </p>
      </li>

      {/* Organisations and businesses */}
      <li className="guidance-audience-block">
        <div className="editorial-image-container">
          <img
            src={businessTrainingImg}
            alt="Illustration of colleagues taking part in cyber security training"
            className="editorial-editorial-image"
            loading="lazy"
          />
        </div>

        <h3 className="govuk-heading-m">Organisations and businesses</h3>
        <p className="govuk-body">
          Find guidance to help your organisation protect its systems, staff and information, including advice on{" "}
          <a className="govuk-link" href="/guidance/cyber-security-baseline" onClick={(e) => { e.preventDefault(); onNavigate("/guidance/cyber-security-baseline"); }}>
            establishing a security baseline
          </a>{" "}
          and preparing for incidents with a{" "}
          <a className="govuk-link" href="/guidance/ransomware-prevention-response" onClick={(e) => { e.preventDefault(); onNavigate("/guidance/ransomware-prevention-response"); }}>
            ransomware response plan
          </a>.
        </p>
      </li>

      {/* Government and critical infrastructure */}
      <li className="guidance-audience-block">
        <div className="editorial-image-container">
          <img 
            src={commonwealthMeetingImg} 
            alt="" 
            className="editorial-editorial-image homepage-government-image" 
            loading="lazy" 
          />
        </div>

        <h3 
          id="public-sector-heading"
          className="govuk-heading-m"
        >
          Government and critical infrastructure
        </h3>

        <p className="govuk-body">
          Find guidance to help government and critical infrastructure teams{" "}
          <a
            className="govuk-link"
            href="/services/proactive-risk-management"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("/services/proactive-risk-management");
            }}
          >
            understand and manage cyber security risks
          </a>
          ,{" "}
          <a
            className="govuk-link"
            href="/guidance/government-cyber-security-baseline"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("/guidance/government-cyber-security-baseline");
            }}
          >
            protect the services and information you work with
          </a>
          , and{" "}
          <a
            className="govuk-link"
            href="/guidance/ransomware-prevention-response"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("/guidance/ransomware-prevention-response");
            }}
          >
            respond to active ransomware incidents
          </a>
          .
        </p>
      </li>

      {/* Technical guidance and standards */}
      <li className="guidance-audience-block">
        <div className="editorial-image-container">
          <img
            src={ttcsirtHeroTeamImg}
            alt=""
            className="editorial-editorial-image"
            loading="lazy"
          />
        </div>
        <h3 className="govuk-heading-m">Technical guidance and standards</h3>
        <p className="govuk-body">
          For system administrators and incident handlers, use the guidance on{" "}
          <a className="govuk-link" href="/guidance/secure-configuration" onClick={(e) => { e.preventDefault(); onNavigate("/guidance/secure-configuration"); }}>
            secure system configuration
          </a>{" "}
          and the{" "}
          <a className="govuk-link" href="/guidance/national-cyber-security-incident-taxonomy" onClick={(e) => { e.preventDefault(); onNavigate("/guidance/national-cyber-security-incident-taxonomy"); }}>
            national incident taxonomy
          </a>.
        </p>
      </li>
      </ul>
    </section>
  );
}

function IncidentStatisticsSection({
  onNavigateToStatistics,
  onNavigateToGuidance,
}: {
  onNavigateToStatistics: () => void;
  onNavigateToGuidance: () => void;
}) {
  const initialCache = getSynchronousStatistics();
  const [stats, setStats] = useState<IncidentStatistics>(initialCache ? initialCache.data : FALLBACK_STATISTICS);

  useEffect(() => {
    let isMounted = true;
    getResilientStatistics().then(res => {
      if (isMounted) setStats(res.data);
    });
    return () => { isMounted = false; };
  }, []);

  const isPartialYear = stats.updatedAt.includes(`${stats.latestYear}`) && !stats.updatedAt.includes(`${stats.latestYear}-12-31`);
  const leadingCategory = [...stats.categories]
    .map((category) => ({
      name: category.name,
      count: category.values[stats.years.length - 1] ?? 0,
    }))
    .sort((a, b) => b.count - a.count)[0];
  const dataThrough = /^\d{4}-\d{2}-\d{2}$/.test(stats.updatedAt)
    ? new Intl.DateTimeFormat("en-TT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${stats.updatedAt}T00:00:00Z`))
    : stats.updatedAt;

  return (
    <section id="incident-statistics" aria-labelledby="incidents-now-heading" className="govuk-!-margin-bottom-9">
      <h2 className="govuk-heading-l" id="incidents-now-heading">
        National cyber incident statistics
      </h2>
      <p className="govuk-body">
        Verified incident notifications received by TT-CSIRT through {dataThrough}. These are reports to the team, not a count of every incident in the country.
      </p>

      {/* High-Level Summary (Stat Blocks) */}
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-one-third">
          <div className="govuk-!-margin-bottom-4">
            <span className="govuk-heading-xl govuk-!-margin-bottom-1 govuk-!-display-block govuk-!-font-tabular-numbers">
              {stats.latestStats.total}
            </span>
            <p className="govuk-body">
              Verified notifications received in {stats.latestYear}{isPartialYear ? " (year to date)" : ""}
            </p>
          </div>
        </div>
        <div className="govuk-grid-column-one-third">
          <div className="govuk-!-margin-bottom-4">
            <span className="govuk-heading-xl govuk-!-margin-bottom-1 govuk-!-display-block govuk-!-font-tabular-numbers">
              {stats.latestStats.phishing}
            </span>
            <p className="govuk-body">
              Phishing notifications in {stats.latestYear}{isPartialYear ? " (year to date)" : ""}
            </p>
          </div>
        </div>
        <div className="govuk-grid-column-one-third">
          <div className="govuk-!-margin-bottom-4">
            <span className="govuk-heading-xl govuk-!-margin-bottom-1 govuk-!-display-block govuk-!-font-tabular-numbers">
              {stats.latestStats.dataBreach}
            </span>
            <p className="govuk-body">
              Data breach notifications in {stats.latestYear}{isPartialYear ? " (year to date)" : ""}
            </p>
          </div>
        </div>
      </div>

      {leadingCategory && leadingCategory.count > 0 && (
        <p className="govuk-body">
          {leadingCategory.name} is the most frequently reported category for this period. {leadingCategory.name.toLowerCase().includes("phishing") && (
            <>For practical steps, read our <a href="/guidance/phishing-scams" className="govuk-link" onClick={(e) => { e.preventDefault(); onNavigateToGuidance(); }}>guidance on identifying and handling phishing scams</a>.</>
          )}
        </p>
      )}
      <p className="govuk-body govuk-!-margin-bottom-0">
        <a href="/statistics" onClick={(e) => { e.preventDefault(); onNavigateToStatistics(); }} className="govuk-link">Explore the national incident statistics, trends and methodology</a>.
      </p>
    </section>
  );
}

function ServicesSection({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <section id="services" aria-labelledby="services-heading" className="govuk-!-margin-bottom-9">
      <h2 className="govuk-heading-l" id="services-heading">Cyber security services</h2>
      <p className="govuk-body">Choose the kind of support your organisation needs.</p>
      <HyperlinkList
        ariaLabel="Cyber security services"
        onNavigate={onNavigate}
        items={[
          {
            href: "/services/proactive-risk-management",
            label: "Proactive risk management",
            description: "Identify weaknesses in public-facing systems and review security settings before attackers exploit them.",
          },
          {
            href: "/training",
            label: "Training and education",
            description: "Explore school outreach, workforce training and tabletop exercises to build practical cyber readiness.",
          },
        ]}
      />
      <p className="govuk-body"><a className="govuk-link" href="/services" onClick={(e) => { e.preventDefault(); onNavigate("/services"); }}>View all TT-CSIRT services</a></p>
    </section>
  );
}

function Footer({ hasSidebar, onNavigate }: { hasSidebar?: boolean; onNavigate: (path: string, hash?: string) => void }) {
  return (
    <footer className={`govuk-footer ttcsirt-footer${hasSidebar ? " ttcsirt-footer--no-margin" : ""}`} role="contentinfo">
      <div className="govuk-width-container">
        {/* Navigation Grid mirrored from Menu NAVIGATION data */}
        <div className="govuk-footer__navigation">
          {NAVIGATION.map((section) => (
            <div key={section.id} className="govuk-footer__section govuk-grid-column-one-quarter">
              <h2 className="govuk-footer__heading govuk-heading-s">
                {section.title}
              </h2>
              <ul className="govuk-footer__list">
                {section.links.map((link) => (
                  <li key={link.href} className="govuk-footer__list-item">
                    <a
                      className="govuk-footer__link govuk-link govuk-link--inverse"
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(link.href);
                      }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <hr className="govuk-footer__section-break" />

        {/* Meta / Legal Section */}
        <div className="govuk-footer__meta">
          <div className="govuk-footer__meta-item govuk-footer__meta-item--grow">
            <h2 className="govuk-visually-hidden">Support links</h2>
            <ul className="govuk-footer__inline-list">
              <li className="govuk-footer__inline-list-item">
                <a
                  className="govuk-footer__link govuk-link govuk-link--inverse"
                  href="/accessibility-statement"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate("/accessibility-statement");
                  }}
                >
                  Accessibility statement
                </a>
              </li>
              <li className="govuk-footer__inline-list-item">
                <a
                  className="govuk-footer__link govuk-link govuk-link--inverse"
                  href="/privacy-policy"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate("/privacy-policy");
                  }}
                >
                  Privacy policy (DPA)
                </a>
              </li>
              <li className="govuk-footer__inline-list-item">
                <a
                  className="govuk-footer__link govuk-link govuk-link--inverse"
                  href="/privacy-policy#cookies-and-browser-storage"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate("/privacy-policy", "cookies-and-browser-storage");
                  }}
                >
                  Cookies
                </a>
              </li>
              <li className="govuk-footer__inline-list-item">
                <a
                  className="govuk-footer__link govuk-link govuk-link--inverse"
                  href="/national-cyber-security-strategy"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate("/national-cyber-security-strategy");
                  }}
                >
                  National Cyber Security Strategy
                </a>
              </li>
              <li className="govuk-footer__inline-list-item">
                <a
                  className="govuk-footer__link govuk-link govuk-link--inverse"
                  href="/contact"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate("/contact");
                  }}
                >
                  Contact &amp; emergency reporting
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Centred Monochrome Coat of Arms and Copyright */}
        <div className="ttcsirt-footer__emblem-section">
          <div className="ttcsirt-footer__emblem-slot">
            <img
              src={coatOfArmsFooter}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="ttcsirt-footer__coat"
            />
          </div>
          <div className="govuk-footer__licence-description">
            © 2026 Government of the Republic of Trinidad and Tobago. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      const fullPath = pathname + (window.location.search || "");
      if (pathname !== "/") {
        return fullPath;
      }
      const hash = window.location.hash;
      if (hash.startsWith("#/")) {
        return hash.replace("#", "");
      }
      if (hash.includes("advisories-page") || hash === "#advisories") {
        return "/advisories";
      }
      if (hash === "#statistics") {
        return "/statistics";
      }
    }
    return "/";
  });

  useEffect(() => {
    // Disable automatic browser scroll restoration for SPA navigation so routes manage their own viewport position
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      try {
        window.history.scrollRestoration = "manual";
      } catch {
        // Safe fallback for restricted environments
      }
    }

    const handleLocationChange = () => {
      const pathname = window.location.pathname;
      const fullPath = pathname + (window.location.search || "");
      if (pathname !== "/") {
        setCurrentPath(fullPath);
      } else {
        const hash = window.location.hash;
        if (hash.startsWith("#/")) {
          setCurrentPath(hash.replace("#", ""));
        } else if (hash.includes("advisories-page") || hash === "#advisories") {
          setCurrentPath("/advisories");
        } else if (hash === "#statistics") {
          setCurrentPath("/statistics");
        } else {
          setCurrentPath("/");
        }
      }
    };

    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("hashchange", handleLocationChange);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("hashchange", handleLocationChange);
    };
  }, []);

  // Non-blocking background hydration of full advisory corpus for search index
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hydrateSearch = () => {
      void import("./services/siteSearch").then(({ hydrateSearchCorpus }) => {
        hydrateSearchCorpus();
      }).catch(() => undefined);
    };
    const timer = setTimeout(() => {
      if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback(hydrateSearch, { timeout: 3000 });
      } else {
        hydrateSearch();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const currentRoute = resolveRoute(currentPath);

  // Route-aware document title and viewport positioning
  useLayoutEffect(() => {
    if (typeof window !== "undefined") {
      // Synchronize alias paths to canonical paths seamlessly
      const canonicalPath = getCanonicalPath(currentRoute);
      if (
        (currentPath === "/about/national-cyber-security-strategy" ||
          currentPath === "/about/strategy" ||
          currentPath === "/strategy") &&
        currentPath !== canonicalPath
      ) {
        window.history.replaceState({}, "", canonicalPath);
        setCurrentPath(canonicalPath);
      } else if (
        currentPath === "/report" &&
        currentPath !== canonicalPath
      ) {
        window.history.replaceState({}, "", canonicalPath);
        setCurrentPath(canonicalPath);
      }

      const hash = window.location.hash;
      const cleanHash = hash.replace("#/", "").replace("#", "");
      const isSpecialRouteHash = hash.startsWith("#/advisories") || hash.includes("advisories-page") || hash === "#statistics";
      
      if (currentRoute.type === "home" && !cleanHash) {
        window.scrollTo(0, 0);
      } else if (!cleanHash || isSpecialRouteHash) {
        window.scrollTo(0, 0);
      }
    }

    if (typeof document !== "undefined") {
      document.title = getDocumentTitle(currentRoute);
    }
  }, [currentPath, currentRoute]);

  const navigateTo = (path: string, hash?: string) => {
    setCurrentPath(path);
    try {
      if (path !== "/") {
        window.history.pushState({}, "", path + (hash ? `#${hash}` : ""));
      } else {
        const targetUrl = hash ? `/#${hash}` : "/";
        window.history.pushState({}, "", targetUrl);
      }
      
      // Dispatch popstate so components like AdvisoriesPage can react to query param changes
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch {
      // In sandboxed environments if pushState fails, fallback gracefully
    }

    if (hash) {
      setTimeout(() => {
        const elem = document.getElementById(hash);
        if (elem) {
          elem.scrollIntoView({ behavior: "smooth" });
        }
      }, 50);
    } else {
      setTimeout(() => {
        window.scrollTo(0, 0);
        if (!hash) {
          document.getElementById("main-content")?.focus({ preventScroll: true });
        }
      }, 50);
    }
  };

  const hasSidebar = currentRoute.type !== "not-found";
  const isIncidentReportingPage = currentRoute.type === "report-incident";
  const usesContentsLayout = hasSidebar && !isIncidentReportingPage;

  return (
    <>
      <a href="#main-content" className="govuk-skip-link" data-module="govuk-skip-link">
        Skip to main content
      </a>

      <TtcsirtHeader currentPath={currentPath} onNavigate={navigateTo} />
      
      {/* Breadcrumbs */}
      {currentRoute.type !== "home" && (
        <div className="app-breadcrumb-bar">
          <div className="govuk-width-container">
            <Breadcrumbs currentRoute={currentRoute} onNavigate={navigateTo} />
          </div>
        </div>
      )}

      <div className={`app-page-wrapper${usesContentsLayout ? " app-page-wrapper--with-sidebar" : ""}${isIncidentReportingPage ? " app-page-wrapper--incident-reporting" : ""}`}>
        <div className="govuk-width-container">
          <main className={`govuk-main-wrapper govuk-main-wrapper--auto-spacing${usesContentsLayout ? " app-main-wrapper--with-sidebar" : ""}`} id="main-content" role="main" tabIndex={-1}>
            <Suspense fallback={<p className="govuk-body govuk-!-margin-top-6" role="status">Loading page</p>}>
            {(() => {
              switch (currentRoute.type) {
                case "services":
                  return <ServicesHubPage onNavigate={navigateTo} />;
                case "service-incident-response":
                  return <IncidentResponsePage onNavigate={navigateTo} />;
                case "report-incident":
                  return <ReportIncidentPage onNavigate={navigateTo} />;
                case "service-proactive-risk":
                  return <ProactiveRiskManagementPage onNavigate={navigateTo} />;
                case "service-detail":
                  return <IncidentResponsePage onNavigate={navigateTo} />;
                case "guidance":
                  return <GuidanceHubPage onNavigate={navigateTo} />;
                case "guidance-detail":
                  if (["assessing-and-managing-vulnerabilities", "understanding-your-exposure", "cyber-security-baseline", "business-continuity-and-cyber-recovery"].includes(currentRoute.slug)) {
                    return <ProactiveRiskGuidancePage slug={currentRoute.slug} onNavigate={navigateTo} />;
                  }
                  return <GuidanceDetailPage slug={currentRoute.slug} onNavigate={navigateTo} />;
                case "news-events":
                case "news":
                case "events":
                  return (
                    <NewsEventsPage
                      onNavigate={navigateTo}
                      initialFilter={currentRoute.type === "news" ? "news" : currentRoute.type === "events" ? "event" : "all"}
                    />
                  );
                case "news-detail":
                case "event-detail":
                case "training-detail":
                case "workshop-detail":
                  return <EditorialDetailPage slug={currentRoute.slug} onNavigate={navigateTo} />;
                case "training":
                  return <TrainingPage onNavigate={navigateTo} />;
                case "statistics":
                  return <StatisticsPage onNavigateHome={() => navigateTo("/")} />;
                case "advisories":
                  return (
                    <AdvisoriesPage
                      onNavigateHome={() => navigateTo("/")}
                      onNavigateToDetail={(idOrSlug) => navigateTo(`/advisories/${idOrSlug}`)}
                      onNavigate={navigateTo}
                    />
                  );
                case "advisory-detail":
                  return (
                    <AdvisoryDetailPage
                      advisoryIdOrSlug={currentRoute.id}
                      onNavigateBack={() => {
                        const preservedUrl = typeof window !== "undefined" ? sessionStorage.getItem("ttcsirt_advisories_url") : null;
                        navigateTo(preservedUrl || "/advisories");
                      }}
                      onNavigate={navigateTo}
                    />
                  );
                case "about":
                  return <AboutPage onNavigate={navigateTo} />;
                case "strategy":
                  return <NationalStrategyPage onNavigate={navigateTo} />;
                case "contact":
                  return <ContactPage onNavigate={navigateTo} />;
                case "accessibility-statement":
                  return <AccessibilityStatementPage onNavigate={navigateTo} />;
                case "privacy-policy":
                  return <PrivacyPolicyPage onNavigate={navigateTo} />;
                case "search":
                  return <SearchPage initialQuery={currentRoute.query || ""} onNavigate={navigateTo} />;
                case "not-found":
                  return <NotFoundPage onNavigate={navigateTo} />;
                case "home":
                  return (
                    <div className="govuk-grid-row app-page-grid-row">
                      <PageNavigation 
                        navItems={[
                          { id: "emergency-support", label: "Need support?" },
                          { id: "cyber-security-advisories", label: "Cyber security advisories" },
                          { id: "cyber-security-guidance", label: "Guidance by audience" },
                          { id: "services", label: "Cyber security services" },
                          { id: "incident-statistics", label: "National cyber incident statistics" },
                          { id: "what-we-do", label: "About TT-CSIRT" },
                        ]}
                      />
                      <div className="govuk-grid-column-two-thirds app-page-content">
                        <PageHeader onNavigate={navigateTo} />
                        <EmergencySupportSection onNavigate={navigateTo} />
                        <Suspense fallback={<p className="govuk-body" role="status">Loading advisories</p>}>
                          <HomeAdvisoriesSection
                            onNavigateToAdvisories={() => navigateTo("/advisories")}
                            onNavigateToDetail={(idOrSlug) => navigateTo(`/advisories/${idOrSlug}`)}
                          />
                        </Suspense>
                        <GuidanceSection onNavigate={navigateTo} />
                        <ServicesSection onNavigate={navigateTo} />
                        <IncidentStatisticsSection
                          onNavigateToStatistics={() => navigateTo("/statistics")}
                          onNavigateToGuidance={() => navigateTo("/guidance/phishing-scams")}
                        />
                        <WhatWeDoSection onNavigate={navigateTo} />
                      </div>
                    </div>
                  );
              }
            })()}
            </Suspense>
          </main>
        </div>
      </div>

      <Footer hasSidebar={usesContentsLayout} onNavigate={navigateTo} />
    </>
  );
}
