import { PageNavigation } from "@/components/PageNavigation";

interface AboutPageProps {
  onNavigate: (path: string) => void;
}

const ABOUT_NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "background", label: "Establishment and background" },
  { id: "mission-vision", label: "Mission and vision" },
  { id: "role-mandate", label: "Role and mandate" },
  { id: "institutional-relationships", label: "Institutional partnerships" },
  { id: "policy-context", label: "National policy and strategy" },
  { id: "governance-confidentiality", label: "Confidentiality and data ethics" },
  { id: "related-documents", label: "Related documents and PGP" },
  { id: "contact", label: "Contact information" },
];

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="govuk-grid-row app-page-grid-row">
      <PageNavigation navItems={ABOUT_NAV_ITEMS} />

      <div className="govuk-grid-column-two-thirds app-page-content">
        <h1 className="govuk-heading-xl" id="about-main-heading">
          About TT-CSIRT
        </h1>

        <p className="govuk-body-l">
          The Trinidad and Tobago Cyber Security Incident Response Team (TT-CSIRT) is the national cyber security coordination agency operating under the Ministry of Homeland Security.
        </p>

        <section id="overview" aria-labelledby="overview-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="overview-heading">
            Overview
          </h2>
          <p className="govuk-body">
            TT-CSIRT serves as the national focal point for cyber security incident handling, vulnerability coordination, threat intelligence analysis, and national cyber resilience.
          </p>
          <p className="govuk-body">
            Our mandate spans government ministries and agencies, critical national infrastructure providers, private sector enterprises, and the wider citizenry of Trinidad and Tobago.
          </p>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="background" aria-labelledby="background-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="background-heading">
            Establishment and background
          </h2>
          <p className="govuk-body">
            TT-CSIRT was established by the Government of the Republic of Trinidad and Tobago (GoRTT) and formally launched in November 2015.
          </p>
          <p className="govuk-body">
            Its operationalisation was carried out with specialised technical assistance and capacity-building support from the Organization of American States (OAS) Inter-American Committee against Terrorism (CICTE) and the International Telecommunication Union (ITU).
          </p>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="mission-vision" aria-labelledby="mission-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="mission-heading">
            Mission and vision
          </h2>
          <div className="govuk-summary-card govuk-!-margin-bottom-4">
            <div className="govuk-summary-card__title-wrapper">
              <h3 className="govuk-summary-card__title">Our Mission</h3>
            </div>
            <div className="govuk-summary-card__content">
              <p className="govuk-body">
                To build national cyber resilience through specialised incident response, proactive threat mitigation, actionable cyber threat intelligence, and targeted capacity building to safeguard Trinidad and Tobago's digital sovereignty.
              </p>
            </div>
          </div>

          <div className="govuk-summary-card govuk-!-margin-bottom-6">
            <div className="govuk-summary-card__title-wrapper">
              <h3 className="govuk-summary-card__title">Our Vision</h3>
            </div>
            <div className="govuk-summary-card__content">
              <p className="govuk-body">
                A secure, resilient, and trusted cyberspace empowering the socio-economic advancement and digital transformation of Trinidad and Tobago.
              </p>
            </div>
          </div>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="role-mandate" aria-labelledby="role-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="role-heading">
            Role and mandate
          </h2>
          <p className="govuk-body">
            As the national technical coordinator, TT-CSIRT executes five core statutory responsibilities:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            <li>
              <strong>National incident coordination:</strong> Receiving, triaging, and responding to cyber attack reports from government entities, financial institutions, critical infrastructure, and commercial businesses.
            </li>
            <li>
              <strong>Vulnerability and advisory management:</strong> Continuously tracking emerging software weaknesses and publishing authoritative advisories and alerts to defend national networks.
            </li>
            <li>
              <strong>Cyber threat intelligence:</strong> Correlating telemetry and tracking threat actor infrastructure targeting the Caribbean region.
            </li>
            <li>
              <strong>Workforce and youth development:</strong> Implementing specialised training programmes, tabletop simulation exercises, and secondary school educational outreach.
            </li>
            <li>
              <strong>Inter-agency technical liaison:</strong> Supporting regulatory and law enforcement investigations with technical digital evidence and forensic analysis.
            </li>
          </ul>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="institutional-relationships" aria-labelledby="partnerships-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="partnerships-heading">
            Institutional partnerships
          </h2>
          <p className="govuk-body">
            TT-CSIRT collaborates closely with local and international institutions:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            <li>
              <strong>Ministry of Homeland Security (MHS):</strong> Parent executive ministry providing statutory oversight and resource governance.
            </li>
            <li>
              <strong>Telecommunications Authority of Trinidad and Tobago (TATT):</strong> Bound by a formal bilateral Memorandum of Understanding (MOU) to exchange regulatory telemetry and protect critical telecommunications networks.
            </li>
            <li>
              <strong>Trinidad and Tobago Police Service (TTPS):</strong> Close cooperation with the Cyber and Social Media Unit (CSMU) for the criminal prosecution of cybercrime.
            </li>
            <li>
              <strong>FIRST (Forum of Incident Response and Security Teams):</strong> Accredited full member of the premier international global incident response collective, adhering to international CSIRT service standards.
            </li>
            <li>
              <strong>OAS &amp; CSIRTAmericas:</strong> Active participation in hemispheric incident-sharing and capacity-building networks across the Americas.
            </li>
          </ul>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="policy-context" aria-labelledby="policy-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="policy-heading">
            National policy and strategy
          </h2>
          <p className="govuk-body">
            TT-CSIRT's operational mandate was formally authorized under the National Cyber Security Strategy approved by Cabinet in December 2012.
          </p>
          <p className="govuk-body">
            <a
              href="/national-cyber-security-strategy"
              className="govuk-link"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("/national-cyber-security-strategy");
              }}
            >
              Read the historical National Cyber Security Strategy document and context
            </a>
          </p>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="governance-confidentiality" aria-labelledby="confidentiality-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="confidentiality-heading">
            Confidentiality and data ethics
          </h2>
          <p className="govuk-body">
            Information submitted to TT-CSIRT is treated with the highest degree of operational confidentiality:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            <li>All victim and reporting organisation information is held securely with restricted access controls.</li>
            <li>Data is never disclosed to external parties or the public without the express written permission of the client organisation.</li>
            <li>National incident reports are aggregated and anonymised in statistical publications to protect organisational identities.</li>
          </ul>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="related-documents" aria-labelledby="docs-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="docs-heading">
            Related documents and PGP
          </h2>
          <p className="govuk-body">
            Key institutional resources and secure communication credentials:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            <li>
              <a
                href="/national-cyber-security-strategy"
                className="govuk-link"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate("/national-cyber-security-strategy");
                }}
              >
                Trinidad and Tobago National Cyber Security Strategy (Cabinet Approved)
              </a>
            </li>
            <li>
              <a
                href="/guidance"
                className="govuk-link"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate("/guidance");
                }}
              >
                Data Protection Act (DPA) General Privacy Principles
              </a>
            </li>
            <li>
              <a
                href="/statistics"
                className="govuk-link"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate("/statistics");
                }}
              >
                National Cyber Security Incident Taxonomy and Annual Statistics
              </a>
            </li>
            <li>
              <strong>TT-CSIRT PGP Public Key:</strong> Key Fingerprint: <code>1113 D6E7 CF37 B0CF 19D8 E0DC 75DC BF9D 4801 845A</code> (available for encrypted incident submissions).
            </li>
          </ul>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="contact" aria-labelledby="contact-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="contact-heading">
            Contact information
          </h2>
          <div className="govuk-inset-text">
            <p className="govuk-body govuk-!-margin-bottom-1">
              <strong>Emergency hotline:</strong> +1 (868) 625-7937
            </p>
            <p className="govuk-body govuk-!-margin-bottom-1">
              <strong>Secondary hotline:</strong> +1 (868) 299-8827
            </p>
            <p className="govuk-body govuk-!-margin-bottom-1">
              <strong>General enquiries:</strong>{" "}
              <a href="mailto:contacts@ttcsirt.gov.tt" className="govuk-link">
                contacts@ttcsirt.gov.tt
              </a>
            </p>
            <p className="govuk-body govuk-!-margin-bottom-0">
              <strong>Ministry:</strong> Ministry of Homeland Security, Port of Spain, Trinidad and Tobago
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
