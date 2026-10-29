import { PageNavigation } from "@/components/PageNavigation";
import { Button } from "@/components/gcds/Button";

interface IncidentResponsePageProps {
  onNavigate: (path: string) => void;
}

const IR_NAV_ITEMS = [
  { id: "what-is-ir", label: "What incident response is" },
  { id: "who-service-is-for", label: "Who this service is for" },
  { id: "what-ttcsirt-does", label: "What TT-CSIRT does" },
  { id: "response-levels", label: "Response levels" },
  { id: "how-to-report", label: "How to report" },
  { id: "information-to-provide", label: "Information you should provide" },
  { id: "confidentiality-privacy", label: "Confidentiality and privacy" },
  { id: "related-guidance", label: "Related guidance" },
  { id: "contact", label: "Contact and hotlines" },
];

export function IncidentResponsePage({ onNavigate }: IncidentResponsePageProps) {
  return (
    <div className="govuk-grid-row app-page-grid-row">
      <PageNavigation navItems={IR_NAV_ITEMS} />

      <div className="govuk-grid-column-two-thirds app-page-content">
        <h1 className="govuk-heading-xl" id="ir-main-heading">
          Incident response service
        </h1>

        <p className="govuk-body-l">
          TT-CSIRT assists organisations across Trinidad and Tobago in responding to cyber security incidents, mitigating unauthorised access, preserving critical forensic evidence, and recovering safely from cyber attacks.
        </p>

        <section id="what-is-ir" aria-labelledby="what-is-ir-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="what-is-ir-heading">
            What incident response is
          </h2>
          <p className="govuk-body">
            Incident response is the structured methodology used to address and manage the aftermath of a cyber security breach or cyber attack. The goal is to handle the situation in a way that limits damage, reduces recovery time, and prevents future occurrences.
          </p>
          <p className="govuk-body">
            Common incidents handled by TT-CSIRT include ransomware outbreaks, unauthorised access to systems or databases, email compromises (such as business email compromise), malicious code infections, and web application defacements.
          </p>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="who-service-is-for" aria-labelledby="who-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="who-heading">
            Who this service is for
          </h2>
          <p className="govuk-body">
            As the national CSIRT, TT-CSIRT serves:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            <li>
              <strong>Government ministries, departments, and agencies:</strong> Coordinating national response and securing state infrastructure.
            </li>
            <li>
              <strong>Critical National Infrastructure (CNI) operators:</strong> Including energy, telecommunications, financial services, utilities, health, and transport.
            </li>
            <li>
              <strong>Private sector businesses:</strong> Commercial enterprises operating within Trinidad and Tobago requiring technical triage.
            </li>
            <li>
              <strong>Citizens and civil society:</strong> Providing guidance on cybercrime reporting and personal device remediation.
            </li>
          </ul>
          <p className="govuk-body">
            Services are provided by the Government of Trinidad and Tobago at no cost to victim organisations.
          </p>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="what-ttcsirt-does" aria-labelledby="what-does-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="what-does-heading">
            What TT-CSIRT does
          </h2>
          <p className="govuk-body">
            When an incident is reported, TT-CSIRT technical responders:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            <li>Conduct rapid triage to establish the nature, scope, and technical severity of the incident</li>
            <li>Provide immediate containment recommendations to prevent lateral movement or ongoing data exfiltration</li>
            <li>Guide evidence preservation (memory snapshots, disk images, firewall and authentication logs) so that investigation is not compromised</li>
            <li>Analyze malware samples, command-and-control indicators, and indicators of compromise (IOCs)</li>
            <li>Liaise, where criminal investigation is requested, with the Trinidad and Tobago Police Service Cyber and Social Media Unit (TTPS CSMU)</li>
            <li>Assist with post-incident analysis and remediation roadmaps to harden perimeter defences</li>
          </ul>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="response-levels" aria-labelledby="levels-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="levels-heading">
            Response levels
          </h2>
          <p className="govuk-body">
            TT-CSIRT provides different tiers of incident response depending on the operational need, internal technical maturity, and resource capacity of the victim organisation:
          </p>

          <div className="govuk-summary-card govuk-!-margin-bottom-4">
            <div className="govuk-summary-card__title-wrapper">
              <h3 className="govuk-summary-card__title">1. Consultative</h3>
            </div>
            <div className="govuk-summary-card__content">
              <p className="govuk-body">
                Gives advice and technical guidance to the organization's internal Incident Response Team (IRT). Suitable for entities with established IT security personnel who require external verification, indicator matching, or strategic remediation counsel.
              </p>
            </div>
          </div>

          <div className="govuk-summary-card govuk-!-margin-bottom-4">
            <div className="govuk-summary-card__title-wrapper">
              <h3 className="govuk-summary-card__title">2. Incident Handling</h3>
            </div>
            <div className="govuk-summary-card__content">
              <p className="govuk-body">
                Coordinates the incident response process and advises the organization's IRT throughout active containment, analysis, and recovery phases. TT-CSIRT assists directly with telemetry analysis and structured task tracking.
              </p>
            </div>
          </div>

          <div className="govuk-summary-card govuk-!-margin-bottom-6">
            <div className="govuk-summary-card__title-wrapper">
              <h3 className="govuk-summary-card__title">3. Incident Management</h3>
            </div>
            <div className="govuk-summary-card__content">
              <p className="govuk-body">
                Coordinates the overall incident response process, leads the organization's IRT, and deploys TT-CSIRT's technical personnel and resources on-site or remotely to directly resolve severe or critical national security compromises.
              </p>
            </div>
          </div>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="how-to-report" aria-labelledby="report-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="report-heading">
            How to report
          </h2>
          <p className="govuk-body">
            You can report an incident to TT-CSIRT using our secure online intake service, or contact our direct emergency lines:
          </p>

          <div className="govuk-!-margin-top-4 govuk-!-margin-bottom-6">
            <Button role="start" id="start-incident-report-button" onClick={() => onNavigate("/report-an-incident")}>
              Report a cyber incident online
            </Button>
          </div>

          <div className="govuk-inset-text">
            <p className="govuk-body govuk-!-margin-bottom-2">
              <strong>Emergency hotline:</strong> +1 (868) 625-7937
            </p>
            <p className="govuk-body govuk-!-margin-bottom-2">
              <strong>Secondary hotline:</strong> +1 (868) 299-8827
            </p>
            <p className="govuk-body govuk-!-margin-bottom-0">
              <strong>Law enforcement (criminal investigations):</strong> TTPS Cyber and Social Media Unit at{" "}
              <a href="mailto:cybercrime@ttps.gov.tt" className="govuk-link">
                cybercrime@ttps.gov.tt
              </a>{" "}
              or +1 (868) 612-0742 / +1 (868) 715-2072
            </p>
          </div>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="information-to-provide" aria-labelledby="info-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="info-heading">
            Information you should provide
          </h2>
          <p className="govuk-body">
            To expedite technical triage, please prepare the following details if safely available:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            <li>
              <strong>Organisation and contact:</strong> Name of entity, sector, primary technical contact, and out-of-band communication channel (e.g. mobile phone).
            </li>
            <li>
              <strong>Timeline:</strong> When the incident was first detected and estimated duration of anomalous activity.
            </li>
            <li>
              <strong>Impacted systems:</strong> Number of affected workstations, servers, domain controllers, cloud tenants, or network segments.
            </li>
            <li>
              <strong>Observed symptoms:</strong> Ransom notes, file extensions, unusual outbound network traffic, compromised administrative credentials, or service disruption.
            </li>
            <li>
              <strong>Containment actions taken:</strong> Whether network cables were unplugged, Wi-Fi disabled, systems powered off, or accounts reset.
            </li>
            <li>
              <strong>Preserved artifacts:</strong> Available forensic images, firewall logs, memory dumps, or malware samples.
            </li>
          </ul>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="confidentiality-privacy" aria-labelledby="privacy-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="privacy-heading">
            Confidentiality and privacy
          </h2>
          <p className="govuk-body">
            TT-CSIRT operates under strict statutory and institutional non-disclosure standards:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            <li>
              Information provided to TT-CSIRT is protected in the same way we protect our own confidential information: held securely, with limited, authorized access.
            </li>
            <li>
              Your information will not be disclosed or shared with third parties without the explicit consent of the client organization.
            </li>
            <li>
              Incident data held by TT-CSIRT is anonymised and depicted exclusively in high-level aggregated national statistics.
            </li>
          </ul>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="related-guidance" aria-labelledby="guidance-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="guidance-heading">
            Related guidance
          </h2>
          <p className="govuk-body">
            Prepare your organization using authoritative guidance:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            <li>
              <a
                href="/guidance/ransomware-prevention-response"
                className="govuk-link"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate("/guidance/ransomware-prevention-response");
                }}
              >
                Ransomware response guide and five-phase procedural checklist
              </a>
            </li>
            <li>
              <a
                href="/advisories"
                className="govuk-link"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate("/advisories");
                }}
              >
                Published security advisories and critical vulnerability alerts
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
                Review national incident statistics and threat vectors
              </a>
            </li>
          </ul>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="contact" aria-labelledby="contact-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="contact-heading">
            Contact and hotlines
          </h2>
          <p className="govuk-body">
            TT-CSIRT responds during business intake hours with on-call technical readiness for critical national infrastructure incidents:
          </p>
          <p className="govuk-body govuk-!-margin-bottom-1">
            <strong>Hotline 1:</strong> +1 (868) 625-7937
          </p>
          <p className="govuk-body govuk-!-margin-bottom-1">
            <strong>Hotline 2:</strong> +1 (868) 299-8827
          </p>
          <p className="govuk-body govuk-!-margin-bottom-0">
            <strong>Physical address:</strong> Ministry of Homeland Security, Port of Spain, Trinidad and Tobago
          </p>
        </section>
      </div>
    </div>
  );
}
