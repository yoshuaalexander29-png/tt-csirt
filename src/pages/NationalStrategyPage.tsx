import { PageNavigation } from "@/components/PageNavigation";

interface NationalStrategyPageProps {
  onNavigate: (path: string) => void;
}

const STRATEGY_NAV_ITEMS = [
  { id: "context", label: "Historical policy context" },
  { id: "vision-objectives", label: "Strategic vision and objectives" },
  { id: "csirt-mandate", label: "Establishment of TT-CSIRT" },
  { id: "key-pillars", label: "Core policy pillars" },
  { id: "document-access", label: "Official document and references" },
];

export function NationalStrategyPage({ onNavigate }: NationalStrategyPageProps) {
  return (
    <div className="govuk-grid-row app-page-grid-row">
      <PageNavigation navItems={STRATEGY_NAV_ITEMS} />

      <div className="govuk-grid-column-two-thirds app-page-content">
        <h1 className="govuk-heading-xl" id="strategy-main-heading">
          National Cyber Security Strategy
        </h1>

        <p className="govuk-body-l">
          The foundational policy framework approved by Cabinet in 2012 that established national cyber resilience objectives and authorized the creation of the national CSIRT.
        </p>

        <div className="govuk-inset-text">
          <p className="govuk-body govuk-!-margin-bottom-1">
            <strong>Historical document notice:</strong> The National Cyber Security Strategy was formally approved by the Government of the Republic of Trinidad and Tobago in December 2012.
          </p>
          <p className="govuk-body govuk-!-margin-bottom-0">
            While operational threat response and technical services have evolved significantly, this document remains the foundational statutory basis for national cybersecurity governance and inter-agency collaboration.
          </p>
        </div>

        <section id="context" aria-labelledby="context-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="context-heading">
            Historical policy context
          </h2>
          <p className="govuk-body">
            Recognizing the rapid expansion of telecommunications infrastructure, digital government services, and e-commerce across Trinidad and Tobago, an Inter-Ministerial Committee was constituted to develop a comprehensive national strategy to safeguard critical cyber infrastructure from malicious disruption.
          </p>
          <p className="govuk-body">
            The resulting National Cyber Security Strategy (2012) articulated a cross-sector approach involving the Ministry of National Security (now Ministry of Homeland Security), the Ministry of Public Administration, the Trinidad and Tobago Police Service, and international technical bodies.
          </p>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="vision-objectives" aria-labelledby="vision-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="vision-heading">
            Strategic vision and objectives
          </h2>
          <p className="govuk-body">
            The strategy established the national vision: <em>"To secure Trinidad and Tobago's cyberspace for the socio-economic development of the nation."</em>
          </p>
          <p className="govuk-body">
            Key strategic goals included:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            <li>Promoting cyber security awareness across all sectors of society</li>
            <li>Protecting government digital assets and critical national infrastructure</li>
            <li>Enhancing technical capacity and institutional readiness to respond to incidents</li>
            <li>Fostering legal and regulatory frameworks compatible with international cyber standards</li>
            <li>Strengthening regional and international cooperation with partner CSIRTs and law enforcement</li>
          </ul>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="csirt-mandate" aria-labelledby="mandate-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="mandate-heading">
            Establishment of TT-CSIRT
          </h2>
          <p className="govuk-body">
            A central mandate of the 2012 Strategy was the formal establishment of a National Computer Security Incident Response Team to serve as the single authoritative point of contact for cyber threats affecting the nation.
          </p>
          <p className="govuk-body">
            Following Cabinet authorization and technical assistance from the Organization of American States (OAS) and the International Telecommunication Union (ITU), TT-CSIRT commenced operational service in November 2015 under the designated security ministry.
          </p>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="key-pillars" aria-labelledby="pillars-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="pillars-heading">
            Core policy pillars
          </h2>
          <p className="govuk-body">
            The strategy is organized across four foundational pillars:
          </p>
          <div className="govuk-summary-card govuk-!-margin-bottom-4">
            <div className="govuk-summary-card__title-wrapper">
              <h3 className="govuk-summary-card__title">Pillar 1: Governance</h3>
            </div>
            <div className="govuk-summary-card__content">
              <p className="govuk-body">
                Defines institutional leadership, inter-ministerial coordination, and the national cybersecurity governance structure.
              </p>
            </div>
          </div>

          <div className="govuk-summary-card govuk-!-margin-bottom-4">
            <div className="govuk-summary-card__title-wrapper">
              <h3 className="govuk-summary-card__title">Pillar 2: Technical and Operational Capability</h3>
            </div>
            <div className="govuk-summary-card__content">
              <p className="govuk-body">
                Focuses on CSIRT operationalisation, telemetry sharing, emergency incident handling, and vulnerability assessments.
              </p>
            </div>
          </div>

          <div className="govuk-summary-card govuk-!-margin-bottom-4">
            <div className="govuk-summary-card__title-wrapper">
              <h3 className="govuk-summary-card__title">Pillar 3: Legal and Regulatory Framework</h3>
            </div>
            <div className="govuk-summary-card__content">
              <p className="govuk-body">
                Aligns domestic cybercrime legislation, data privacy standards (Data Protection Act), and electronic evidence admissibility.
              </p>
            </div>
          </div>

          <div className="govuk-summary-card govuk-!-margin-bottom-6">
            <div className="govuk-summary-card__title-wrapper">
              <h3 className="govuk-summary-card__title">Pillar 4: Culture and Awareness</h3>
            </div>
            <div className="govuk-summary-card__content">
              <p className="govuk-body">
                Cultivates public cyber awareness, youth digital hygiene, and workforce training programmes across both public and private sectors.
              </p>
            </div>
          </div>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="document-access" aria-labelledby="doc-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="doc-heading">
            Official document and references
          </h2>
          <p className="govuk-body">
            The full approved National Cyber Security Strategy document is maintained in the national repository:
          </p>
          <div className="govuk-inset-text">
            <p className="govuk-body govuk-!-margin-bottom-1">
              <strong>Publication title:</strong> Trinidad and Tobago National Cyber Security Strategy
            </p>
            <p className="govuk-body govuk-!-margin-bottom-1">
              <strong>Approval body:</strong> Cabinet of the Republic of Trinidad and Tobago
            </p>
            <p className="govuk-body govuk-!-margin-bottom-1">
              <strong>Date of publication:</strong> December 2012
            </p>
            <p className="govuk-body govuk-!-margin-bottom-0">
              <strong>Authoritative source:</strong>{" "}
              <a
                href="/documents/national-cyber-security-strategy-2012.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="govuk-link"
              >
                View the National Cyber Security Strategy (PDF)
              </a>
            </p>
          </div>
          <p className="govuk-body">
            <a
              href="/about"
              className="govuk-link"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("/about");
              }}
            >
              Return to About TT-CSIRT governance and partnerships
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
