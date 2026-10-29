import { PageNavigation } from "@/components/PageNavigation";

interface ContactPageProps {
  onNavigate: (path: string) => void;
}

const CONTACT_NAV_ITEMS = [
  { id: "emergency-lines", label: "Emergency reporting lines" },
  { id: "email-channels", label: "Email reporting channels" },
  { id: "office-location", label: "Office location and hours" },
  { id: "pgp-key", label: "PGP encryption key" },
  { id: "law-enforcement", label: "Law enforcement (TTPS)" },
];

export function ContactPage({ onNavigate }: ContactPageProps) {
  return (
    <div className="govuk-grid-row app-page-grid-row">
      <PageNavigation navItems={CONTACT_NAV_ITEMS} />

      <div className="govuk-grid-column-two-thirds app-page-content">
        <h1 className="govuk-heading-xl" id="contact-main-heading">
          Contact TT-CSIRT
        </h1>

        <p className="govuk-body-l">
          Authoritative contact points, emergency incident hotlines, and secure reporting channels for TT-CSIRT.
        </p>

        <section id="emergency-lines" aria-labelledby="emergency-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="emergency-heading">
            Emergency reporting lines
          </h2>
          <p className="govuk-body">
            For urgent cyber security incidents requiring active triage or coordination:
          </p>
          <div className="govuk-inset-text">
            <p className="govuk-body govuk-!-margin-bottom-1">
              <strong>Hotline 1:</strong> +1 (868) 625-7937
            </p>
            <p className="govuk-body govuk-!-margin-bottom-0">
              <strong>Hotline 2:</strong> +1 (868) 299-8827
            </p>
          </div>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="email-channels" aria-labelledby="email-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="email-heading">
            Email reporting channels
          </h2>
          <ul className="govuk-list govuk-list--bullet">
            <li>
              <strong>General enquiries and capacity building:</strong>{" "}
              <a href="mailto:contacts@ttcsirt.gov.tt" className="govuk-link">
                contacts@ttcsirt.gov.tt
              </a>
            </li>
          </ul>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="office-location" aria-labelledby="office-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="office-heading">
            Office location and hours
          </h2>
          <p className="govuk-body">
            <strong>Parent Ministry:</strong> Ministry of Homeland Security
          </p>
          <p className="govuk-body">
            <strong>Location:</strong> Port of Spain, Trinidad and Tobago
          </p>
          <p className="govuk-body">
            <strong>Operational hours:</strong> Monday to Friday, 8:00 AM – 4:00 PM AST (with emergency on-call technical readiness for critical national infrastructure incidents).
          </p>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="pgp-key" aria-labelledby="pgp-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="pgp-heading">
            PGP encryption key
          </h2>
          <p className="govuk-body">
            For transmitting sensitive indicators of compromise, vulnerability reports, or confidential network telemetry:
          </p>
          <div className="govuk-inset-text">
            <p className="govuk-body govuk-!-margin-bottom-1">
              <strong>Key ID:</strong> 4801845A
            </p>
            <p className="govuk-body govuk-!-margin-bottom-0">
              <strong>Fingerprint:</strong> <code>1113 D6E7 CF37 B0CF 19D8 E0DC 75DC BF9D 4801 845A</code>
            </p>
          </div>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="law-enforcement" aria-labelledby="law-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="law-heading">
            Law enforcement (TTPS)
          </h2>
          <p className="govuk-body">
            If you wish to initiate a formal criminal investigation or report cyber fraud:
          </p>
          <p className="govuk-body">
            <strong>Trinidad and Tobago Police Service Cyber and Social Media Unit (TTPS CSMU)</strong>
            <br />
            <strong>Email:</strong>{" "}
            <a href="mailto:cybercrime@ttps.gov.tt" className="govuk-link">
              cybercrime@ttps.gov.tt
            </a>
            <br />
            <strong>Telephone:</strong> +1 (868) 612-0742 or +1 (868) 715-2072
          </p>
        </section>
      </div>
    </div>
  );
}
