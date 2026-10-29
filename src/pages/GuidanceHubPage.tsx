import { PageNavigation } from "@/components/PageNavigation";
import { Button } from "@/components/gcds/Button";
import familySafetyImg from "@/assets/illustrations/family-safety.jpg";
import businessTrainingImg from "@/assets/illustrations/business-training.jpg";
import commonwealthMeetingImg from "@/assets/illustrations/commonwealth-meeting-mr-bachu.jpg";
import ttcsirtHeroTeamImg from "@/assets/illustrations/ttcsirt-hero-team.png";
import {
  getGuidanceSummariesByCategory,
  getGuidanceSummaryBySlug,
  GuidanceSummary,
} from "@/services/guidanceContent";

interface GuidanceHubPageProps {
  onNavigate: (path: string) => void;
}

const CYBER_SECURE_URL = "https://be-safe-online-react.vercel.app/";

const GUIDANCE_NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "start-here", label: "Start here" },
  { id: "audience-selector", label: "Browse by audience" },
  { id: "individuals-families", label: "Individuals and families" },
  { id: "organisations-businesses", label: "Organisations and businesses" },
  { id: "government-cni", label: "Government and critical infrastructure" },
  { id: "technical-standards", label: "Technical guidance and standards" },
  { id: "assistance-reporting", label: "Assistance and reporting" },
];

interface StartHereTask {
  task: string;
  slug: string;
}

const START_HERE_TASKS: StartHereTask[] = [
  {
    task: "Protect your accounts",
    slug: "account-security",
  },
  {
    task: "Protect your organisation",
    slug: "cyber-security-baseline",
  },
  {
    task: "Prepare for ransomware",
    slug: "ransomware-prevention-response",
  },
  {
    task: "Prepare for a cyber incident",
    slug: "incident-response-planning",
  },
  {
    task: "Secure your systems",
    slug: "secure-configuration",
  },
];

function formatDocumentCount(count: number): string {
  return `${count} ${count === 1 ? "guidance document" : "guidance documents"}`;
}

function GuidanceDocumentItem({
  item,
  sectionHeading,
  onNavigate,
}: {
  item: GuidanceSummary;
  sectionHeading: string;
  onNavigate: (path: string) => void;
}) {
  const showAudienceAttribute =
    item.audienceLabel.trim().toLowerCase() !== sectionHeading.trim().toLowerCase();

  return (
    <li className="gem-c-document-list__item">
      <h3 className="gem-c-document-list__item-title">
        <a
          href={`/guidance/${item.slug}`}
          className="govuk-link"
          onClick={(e) => {
            e.preventDefault();
            onNavigate(`/guidance/${item.slug}`);
          }}
        >
          {item.title}
        </a>
      </h3>

      <p className="gem-c-document-list__item-description">
        {item.summary}
      </p>

      <ul className="gem-c-document-list__item-metadata" aria-label={`Metadata for ${item.title}`}>
        <li className="gem-c-document-list__attribute">
          Last reviewed: {item.lastReviewed}
        </li>
        <li className="gem-c-document-list__attribute">
          {item.readingTimeMinutes} minute read
        </li>
        {showAudienceAttribute && (
          <li className="gem-c-document-list__attribute">
            Relevant to: {item.audienceLabel}
          </li>
        )}
      </ul>
    </li>
  );
}

export function GuidanceHubPage({ onNavigate }: GuidanceHubPageProps) {
  const individualDocs = getGuidanceSummariesByCategory("personal-cyber-safety");
  const orgDocs = getGuidanceSummariesByCategory("enterprise-defence");
  const govDocs = getGuidanceSummariesByCategory("critical-infrastructure");
  const techDocs = getGuidanceSummariesByCategory("technical-standards");

  const startHereItems = START_HERE_TASKS.map((entry) => ({
    ...entry,
    doc: getGuidanceSummaryBySlug(entry.slug),
  })).filter((entry): entry is StartHereTask & { doc: GuidanceSummary } => Boolean(entry.doc));

  return (
    <div className="govuk-grid-row app-page-grid-row">
      <PageNavigation navItems={GUIDANCE_NAV_ITEMS} />

      <div className="govuk-grid-column-two-thirds app-page-content">
        {/* 1. Concise Page Introduction */}
        <section id="overview" aria-labelledby="guidance-main-heading" className="govuk-!-margin-bottom-8">
          <h1 className="govuk-heading-xl" id="guidance-main-heading">
            Cyber security guidance
          </h1>

          <p className="govuk-body-l">
            Practical guidance from TT-CSIRT to help individuals, businesses, government agencies, and technical teams protect devices, networks, and data.
          </p>

          <p className="govuk-body govuk-!-margin-bottom-0">
            Start with a common security task below, or browse the catalogue by your role. Each guide provides practical guidance for its intended audience.
          </p>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        {/* 2. Start here: task discovery entry points */}
        <section id="start-here" aria-labelledby="start-here-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="start-here-heading">
            Start here
          </h2>
          <p className="govuk-body">
            Choose a task to go straight to the relevant guidance:
          </p>

          <ul className="govuk-list govuk-list--spaced guidance-start-list">
            {startHereItems.map(({ task, doc }) => (
              <li key={doc.slug}>
                <a className="govuk-link" href={`/guidance/${doc.slug}`}>
                  {task}
                </a>
              </li>
            ))}
            <li>
              <a className="govuk-link" href={CYBER_SECURE_URL}>
                Get everyday online safety tips from Cyber Secure
              </a>
            </li>
          </ul>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        {/* 3. Browse by Audience */}
        <section id="audience-selector" aria-labelledby="audience-selector-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="audience-selector-heading">
            Browse by audience
          </h2>
          <p className="govuk-body">
            Select the group that matches your role to jump to that section of the catalogue:
          </p>

          <div className="gem-c-cards guidance-audience-cards govuk-!-margin-bottom-6">
            <ul className="gem-c-cards__list gem-c-cards__list--two-column" data-module="gem-cards">
              <li className="gem-c-cards__list-item">
                <div className="guidance-audience-card__media">
                  <img
                    src={familySafetyImg}
                    alt=""
                    className="guidance-audience-card__image guidance-audience-card__image--individuals"
                    loading="lazy"
                  />
                </div>
                <div className="gem-c-cards__list-item-wrapper">
                  <h3 className="gem-c-cards__sub-heading govuk-heading-s">
                    <a href="#individuals-families" className="govuk-link gem-c-cards__link">
                      Individuals and families
                    </a>
                  </h3>
                  <p className="govuk-body gem-c-cards__description">
                    Protect personal accounts, home Wi-Fi, mobile phones, and family devices from phishing and unauthorised access.
                  </p>
                  <p className="govuk-body-s gem-c-document-list__item-context govuk-!-margin-top-1 govuk-!-margin-bottom-0">
                    {formatDocumentCount(individualDocs.length)}
                  </p>
                </div>
              </li>

              <li className="gem-c-cards__list-item">
                <div className="guidance-audience-card__media">
                  <img
                    src={businessTrainingImg}
                    alt=""
                    className="guidance-audience-card__image guidance-audience-card__image--organisations"
                    loading="lazy"
                  />
                </div>
                <div className="gem-c-cards__list-item-wrapper">
                  <h3 className="gem-c-cards__sub-heading govuk-heading-s">
                    <a href="#organisations-businesses" className="govuk-link gem-c-cards__link">
                      Organisations and businesses
                    </a>
                  </h3>
                  <p className="govuk-body gem-c-cards__description">
                    Set up baseline security controls, manage vulnerabilities, protect personal data, and prepare for ransomware.
                  </p>
                  <p className="govuk-body-s gem-c-document-list__item-context govuk-!-margin-top-1 govuk-!-margin-bottom-0">
                    {formatDocumentCount(orgDocs.length)}
                  </p>
                </div>
              </li>

              <li className="gem-c-cards__list-item">
                <div className="guidance-audience-card__media">
                  <img
                    src={commonwealthMeetingImg}
                    alt=""
                    className="guidance-audience-card__image guidance-audience-card__image--government"
                    loading="lazy"
                  />
                </div>
                <div className="gem-c-cards__list-item-wrapper">
                  <h3 className="gem-c-cards__sub-heading govuk-heading-s">
                    <a href="#government-cni" className="govuk-link gem-c-cards__link">
                      Government and critical infrastructure
                    </a>
                  </h3>
                  <p className="govuk-body gem-c-cards__description">
                    Apply public sector security baselines, protect operational technology, secure public gateways, and report incidents.
                  </p>
                  <p className="govuk-body-s gem-c-document-list__item-context govuk-!-margin-top-1 govuk-!-margin-bottom-0">
                    {formatDocumentCount(govDocs.length)}
                  </p>
                </div>
              </li>

              <li className="gem-c-cards__list-item">
                <div className="guidance-audience-card__media">
                  <img
                    src={ttcsirtHeroTeamImg}
                    alt=""
                    className="guidance-audience-card__image guidance-audience-card__image--technical"
                    loading="lazy"
                  />
                </div>
                <div className="gem-c-cards__list-item-wrapper">
                  <h3 className="gem-c-cards__sub-heading govuk-heading-s">
                    <a href="#technical-standards" className="govuk-link gem-c-cards__link">
                      Technical guidance and standards
                    </a>
                  </h3>
                  <p className="govuk-body gem-c-cards__description">
                    Apply system configuration baselines and classify cyber incidents using the incident taxonomy.
                  </p>
                  <p className="govuk-body-s gem-c-document-list__item-context govuk-!-margin-top-1 govuk-!-margin-bottom-0">
                    {formatDocumentCount(techDocs.length)}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        {/* 4a. Individuals and Families */}
        <section id="individuals-families" aria-labelledby="individuals-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="individuals-heading">
            Individuals and families
          </h2>
          <p className="govuk-body">
            Guidance for citizens, households, parents, and students on securing personal accounts, devices, and home networks.
          </p>

          <ul className="gem-c-document-list" aria-label="Guidance for individuals and families">
            {individualDocs.map((item) => (
              <GuidanceDocumentItem
                key={item.slug}
                item={item}
                sectionHeading="Individuals and families"
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        {/* 4b. Organisations and Businesses */}
        <section id="organisations-businesses" aria-labelledby="orgs-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="orgs-heading">
            Organisations and businesses
          </h2>
          <p className="govuk-body">
            Guidance for commercial enterprises, small and medium-sized businesses (SMEs), and non-profit organisations on protecting systems, staff, and data.
          </p>

          <ul className="gem-c-document-list" aria-label="Guidance for organisations and businesses">
            {orgDocs.map((item) => (
              <GuidanceDocumentItem
                key={item.slug}
                item={item}
                sectionHeading="Organisations and businesses"
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        {/* 4c. Government and Critical Infrastructure */}
        <section id="government-cni" aria-labelledby="gov-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="gov-heading">
            Government and critical infrastructure
          </h2>
          <p className="govuk-body">
            Guidance for ministries, statutory agencies, and critical infrastructure operators on baseline controls, public gateways, logging, and incident escalation.
          </p>

          <ul className="gem-c-document-list" aria-label="Guidance for government and critical infrastructure">
            {govDocs.map((item) => (
              <GuidanceDocumentItem
                key={item.slug}
                item={item}
                sectionHeading="Government and critical infrastructure"
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        {/* 4d. Technical Guidance and Standards */}
        <section id="technical-standards" aria-labelledby="tech-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="tech-heading">
            Technical guidance and standards
          </h2>
          <p className="govuk-body">
            Configuration baselines and incident classification standards for system administrators, network engineers, and security analysts.
          </p>

          <ul className="gem-c-document-list" aria-label="Technical guidance and standards">
            {techDocs.map((item) => (
              <GuidanceDocumentItem
                key={item.slug}
                item={item}
                sectionHeading="Technical guidance and standards"
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        {/* Assistance and Reporting */}
        <section id="assistance-reporting" aria-labelledby="assistance-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="assistance-heading">
            Assistance and incident reporting
          </h2>
          <div className="govuk-inset-text">
            <h3 className="govuk-heading-m govuk-!-margin-bottom-2">
              Experiencing an active cyber incident?
            </h3>
            <p className="govuk-body">
              If your organisation is experiencing active ransomware, server compromise, or a data breach, contact the TT-CSIRT incident response team immediately.
            </p>
            <p className="govuk-body">
              <strong>Emergency hotline:</strong>{" "}
              <a href="tel:+18686257937" className="govuk-link">
                +1 (868) 625-7937
              </a>
              {" "}or{" "}
              <a href="tel:+18682998827" className="govuk-link">
                +1 (868) 299-8827
              </a>
            </p>
            <p className="govuk-body">
              <strong>Online reporting:</strong> Submit incident details or indicators of compromise through the incident reporting service.
            </p>
            <div className="govuk-!-margin-top-4">
              <Button
                type="link"
                role="primary"
                className="govuk-!-margin-bottom-0"
                href="/report-an-incident"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate("/report-an-incident");
                }}
              >
                Report an incident to TT-CSIRT
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
