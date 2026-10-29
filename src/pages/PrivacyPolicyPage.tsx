import { useEffect } from "react";
import { PageNavigation } from "@/components/PageNavigation";

interface PrivacyPolicyPageProps {
  onNavigate: (path: string) => void;
}

const PRIVACY_NAV_ITEMS = [
  { id: "overview", label: "Overview and DPA compliance" },
  { id: "information-collected", label: "Information we collect" },
  { id: "how-we-use-data", label: "How we use your information" },
  { id: "sharing-coordination", label: "Incident coordination and sharing" },
  { id: "security-retention", label: "Data security and retention" },
  { id: "cookies-and-browser-storage", label: "Cookies and browser storage" },
  { id: "your-rights", label: "Your rights under the DPA" },
  { id: "contact-dpa", label: "Contact and data protection enquiries" },
];

export function PrivacyPolicyPage({ onNavigate }: PrivacyPolicyPageProps) {
  useEffect(() => {
    const targetId = decodeURIComponent(window.location.hash.slice(1));
    if (targetId) {
      document.getElementById(targetId)?.scrollIntoView({ block: "start" });
    }
  }, []);

  return (
    <div className="govuk-grid-row app-page-grid-row">
      <PageNavigation navItems={PRIVACY_NAV_ITEMS} />

      <div className="govuk-grid-column-two-thirds app-page-content">
        <h1 className="govuk-heading-xl" id="privacy-main-heading">
          Privacy policy and data protection
        </h1>

        <p className="govuk-body-l">
          How the Trinidad and Tobago Cyber Security Incident Response Team (TT-CSIRT) collects, handles, and protects personal and incident data in accordance with the Data Protection Act (DPA).
        </p>

        <section id="overview" aria-labelledby="overview-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="overview-heading">
            Overview and DPA compliance
          </h2>
          <p className="govuk-body">
            TT-CSIRT, operating under the Ministry of Homeland Security, is dedicated to protecting the privacy and confidentiality of individuals, public bodies, and private enterprises submitting incident notifications or interacting with our services.
          </p>
          <p className="govuk-body">
            All handling of personal data is conducted in strict compliance with the Data Protection Act Chap. 22:04 of Trinidad and Tobago (DPA 2011) and international cybersecurity ethics and confidentiality frameworks (including the Traffic Light Protocol - TLP).
          </p>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="information-collected" aria-labelledby="collected-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="collected-heading">
            Information we collect
          </h2>
          <p className="govuk-body">
            Depending on how you interact with TT-CSIRT, we may collect and process:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            <li>
              <strong>Incident report submissions:</strong> Contact names, official telephone numbers, email addresses, organization name, and technical descriptions of the incident.
            </li>
            <li>
              <strong>Technical network telemetry:</strong> IP addresses, domain names, log extracts, hashes, and malware samples submitted for analysis.
            </li>
            <li>
              <strong>General enquiries:</strong> Information provided when contacting us via email or official correspondence channels.
            </li>
          </ul>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="how-we-use-data" aria-labelledby="use-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="use-heading">
            How we use your information
          </h2>
          <p className="govuk-body">
            TT-CSIRT utilizes collected data exclusively for national cybersecurity and incident management purposes:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            <li>Triaging and coordinating response to active cybersecurity incidents.</li>
            <li>Providing technical containment advice and remediation guidance.</li>
            <li>Publishing anonymised threat intelligence alerts and security advisories.</li>
            <li>Compiling aggregated, non-attributable national cyber incident statistics.</li>
          </ul>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="sharing-coordination" aria-labelledby="sharing-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="sharing-heading">
            Incident coordination and sharing
          </h2>
          <p className="govuk-body">
            TT-CSIRT treats all incident notifications as confidential. We apply the FIRST Traffic Light Protocol (TLP) standard to all information exchanges:
          </p>
          <div className="govuk-inset-text">
            Incident reports and organization identities are never shared publicly or with third parties without explicit authorization, except where disclosure is mandated by law or necessary to mitigate an imminent national critical infrastructure threat.
          </div>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="security-retention" aria-labelledby="security-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="security-heading">
            Data security and retention
          </h2>
          <p className="govuk-body">
            All incident records and confidential submissions are stored in secure government facilities with role-based access control, cryptographic protection, and audit logging.
          </p>
          <p className="govuk-body">
            Sensitive technical submissions may also be encrypted using our official PGP key (Key ID: <code>4801845A</code>).
          </p>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="cookies-and-browser-storage" aria-labelledby="cookies-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="cookies-heading">
            Cookies and browser storage
          </h2>
          <p className="govuk-body">
            The incident reporting service uses a security cookie to help verify report submissions. The cookie is marked HttpOnly and SameSite=Strict, and Secure when the site is served over HTTPS. Its associated security token expires after two hours.
          </p>
          <p className="govuk-body">
            The site may also store published advisory information and aggregate statistics in your browser so recent public information can remain available if a later connection fails. This cache can be removed through your browser's site-data settings; the site may need to retrieve the information again.
          </p>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="your-rights" aria-labelledby="rights-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="rights-heading">
            Your rights under the DPA
          </h2>
          <p className="govuk-body">
            Under the Data Protection Act of Trinidad and Tobago, you have rights regarding your personal information, including the right to request access to personal data held about you and the right to request correction of inaccurate records.
          </p>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="contact-dpa" aria-labelledby="contact-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="contact-heading">
            Contact and data protection enquiries
          </h2>
          <p className="govuk-body">
            For questions about this privacy policy, data protection practices, or to exercise your rights under the Data Protection Act:
          </p>
          <div className="govuk-inset-text">
            <p className="govuk-body govuk-!-margin-bottom-1">
              <strong>Email:</strong>{" "}
              <a href="mailto:contacts@ttcsirt.gov.tt" className="govuk-link">
                contacts@ttcsirt.gov.tt
              </a>
            </p>
            <p className="govuk-body govuk-!-margin-bottom-0">
              <strong>Postal:</strong> Ministry of Homeland Security, Port of Spain, Trinidad and Tobago
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
