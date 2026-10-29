import { PageNavigation } from "@/components/PageNavigation";

interface ServicesHubPageProps {
  onNavigate: (path: string) => void;
}

const SERVICES_NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "incident-response", label: "Incident response" },
  { id: "proactive-risk", label: "Proactive risk exposure management" },
  { id: "capacity-building", label: "Capacity building" },
  { id: "cyber-threat-intelligence", label: "Cyber threat intelligence" },
  { id: "security-assessments", label: "Security assessments" },
  { id: "contact", label: "Contact and reporting" },
];

export function ServicesHubPage({ onNavigate }: ServicesHubPageProps) {
  return (
    <div className="govuk-grid-row app-page-grid-row">
      <PageNavigation navItems={SERVICES_NAV_ITEMS} />

      <div className="govuk-grid-column-two-thirds app-page-content">
        <h1 className="govuk-heading-xl" id="services-main-heading">
          Cyber security services
        </h1>

        <p className="govuk-body-l">
          TT-CSIRT helps public and private organisations across Trinidad and Tobago prepare for, respond to and recover from cyber incidents.
        </p>

        <section id="overview" aria-labelledby="overview-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="overview-heading">
            Overview
          </h2>
          <p className="govuk-body">
            TT-CSIRT's services align with the Forum of Incident Response and Security Teams (FIRST) CSIRT Services Framework. Services are provided at no cost to government ministries, departments, statutory bodies, critical national infrastructure operators, and private sector organisations within the national jurisdiction.
          </p>
          <p className="govuk-body">
            We respond to active incidents and help organisations reduce future risks.
          </p>
        </section>

        <section id="incident-response" aria-labelledby="ir-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="ir-heading">
            Incident response
          </h2>
          <p className="govuk-body">
            When an organisation faces an unauthorised intrusion, ransomware attack, data breach or denial-of-service attack, TT-CSIRT can help assess the incident, contain it, preserve evidence and plan recovery.
          </p>
          <p className="govuk-body">
            Our response ranges from advice to hands-on technical support. We tailor it to the incident's severity and the organisation's needs.
          </p>
          <p className="govuk-body">
            <a href="/report-an-incident" className="govuk-link" onClick={(e) => { e.preventDefault(); onNavigate("/report-an-incident"); }}>Report an incident to TT-CSIRT</a> to start the response process.
          </p>
        </section>

        <section id="proactive-risk" aria-labelledby="proactive-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="proactive-heading">
            Proactive risk exposure management
          </h2>
          <p className="govuk-body">
            Preventive steps help organisations find and fix weaknesses before attackers exploit them. These include checking public-facing systems and reviewing security settings.
          </p>
          <p className="govuk-body">
            For help identifying and reducing cyber security risks before an incident occurs, see our{" "}
            <a
              href="/services/proactive-risk-management"
              className="govuk-link"
              onClick={(e) => { e.preventDefault(); onNavigate("/services/proactive-risk-management"); }}
            >
              proactive risk exposure management service
            </a>.
          </p>
        </section>

        <section id="capacity-building" aria-labelledby="capacity-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="capacity-heading">
            Capacity building
          </h2>
          <p className="govuk-body">
            Strengthening human cyber readiness across government, critical sectors, and education. TT-CSIRT delivers:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            <li>
              <strong>School Education Program:</strong> Direct outreach to secondary schools across Trinidad and Tobago to foster cyber hygiene and encourage youth cyber career pathways.
            </li>
            <li>
              <strong>Cyber Paths Training Program:</strong> Targeted workforce development in partnership with the Organization of American States (OAS) and Citi Foundation.
            </li>
            <li>
              <strong>Tabletop Exercises (TTX):</strong> Executive and operational crisis simulations testing organisational incident response plans against realistic threat scenarios.
            </li>
          </ul>
          <p className="govuk-body">
            <a href="/training" className="govuk-link" onClick={(e) => { e.preventDefault(); onNavigate("/training"); }}>See training programmes and workshops</a> for current learning opportunities.
          </p>
        </section>

        <section id="cyber-threat-intelligence" aria-labelledby="threat-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="threat-heading">
            Cyber threat intelligence
          </h2>
          <p className="govuk-body">
            Collection, correlation, and dissemination of actionable threat intelligence. TT-CSIRT monitors global and regional telemetry, analyzing malware campaigns, zero-day vulnerabilities, and active threat actor infrastructure targeting the Caribbean and Trinidad and Tobago.
          </p>
          <p className="govuk-body">
            Threat alerts and vulnerability advisories are published continually to enable prompt mitigation by system administrators.
          </p>
        </section>

        <section id="security-assessments" aria-labelledby="assessments-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="assessments-heading">
            Security assessments
          </h2>
          <p className="govuk-body">
            Technical evaluations of digital assets, networks, and web applications conducted for public sector bodies. Assessments identify configuration flaws, unpatched software, and perimeter weaknesses, accompanied by actionable remediation roadmaps.
          </p>
        </section>

        <section id="contact" aria-labelledby="contact-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="contact-heading">
            Contact and reporting
          </h2>
          <p className="govuk-body">
            If your organisation is experiencing an active incident or requires security engagement:
          </p>
          <div className="govuk-inset-text">
            <p className="govuk-body govuk-!-margin-bottom-1">
              <strong>Emergency hotlines:</strong> +1 (868) 625-7937 or +1 (868) 299-8827
            </p>
            <p className="govuk-body govuk-!-margin-bottom-0">
              <strong>General enquiries:</strong>{" "}
              <a href="mailto:contacts@ttcsirt.gov.tt" className="govuk-link">
                contacts@ttcsirt.gov.tt
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
