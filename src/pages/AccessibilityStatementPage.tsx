import { PageNavigation } from "@/components/PageNavigation";

interface AccessibilityStatementPageProps {
  onNavigate: (path: string) => void;
}

const ACCESSIBILITY_NAV_ITEMS = [
  { id: "commitment", label: "Accessibility commitment" },
  { id: "compliance-status", label: "Compliance status" },
  { id: "accessible-features", label: "Accessible features" },
  { id: "known-limitations", label: "Known limitations" },
  { id: "reporting-issues", label: "Reporting accessibility issues" },
  { id: "enforcement", label: "Enforcement procedure" },
];

export function AccessibilityStatementPage({ onNavigate }: AccessibilityStatementPageProps) {
  return (
    <div className="govuk-grid-row app-page-grid-row">
      <PageNavigation navItems={ACCESSIBILITY_NAV_ITEMS} />

      <div className="govuk-grid-column-two-thirds app-page-content">
        <h1 className="govuk-heading-xl" id="accessibility-main-heading">
          Accessibility statement for TT-CSIRT
        </h1>

        <p className="govuk-body-l">
          TT-CSIRT is committed to making its digital services accessible to all citizens of Trinidad and Tobago, in accordance with international digital accessibility standards.
        </p>

        <section id="commitment" aria-labelledby="commitment-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="commitment-heading">
            Accessibility commitment
          </h2>
          <p className="govuk-body">
            This accessibility statement applies to the TT-CSIRT national portal. We want as many people as possible to be able to use this website. For example, that means you should be able to:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            <li>Navigate most of the website using just a keyboard.</li>
            <li>Zoom in up to 300% without the text spilling off the screen.</li>
            <li>Navigate using speech recognition software.</li>
            <li>Listen to most of the website using a screen reader.</li>
            <li>Experience clear visual focus indicators with high contrast across interactive elements.</li>
          </ul>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="compliance-status" aria-labelledby="compliance-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="compliance-heading">
            Compliance status
          </h2>
          <p className="govuk-body">
            This website is partially compliant with the Web Content Accessibility Guidelines version 2.2 AA standard.
          </p>
          <div className="govuk-inset-text">
            All core pages, cybersecurity advisory feeds, guidance documents, and incident reporting pathways undergo regular automated and manual accessibility audits to maintain AA compliance.
          </div>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="accessible-features" aria-labelledby="features-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="features-heading">
            Accessible features
          </h2>
          <p className="govuk-body">
            Our portal implements the following core accessibility provisions:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            <li>
              <strong>Skip to main content:</strong> A skip link is provided at the very top of every page allowing keyboard users to bypass header navigation.
            </li>
            <li>
              <strong>Semantic document structure:</strong> Strict single-h1 hierarchy, structured landmarks, and labelled navigation blocks.
            </li>
            <li>
              <strong>High-contrast focus rings:</strong> Standard GDS-compliant yellow focus rings with black borders for all active controls.
            </li>
            <li>
              <strong>Accessible tables and lists:</strong> Tables include column headers and structured scopes; data lists maintain semantic tags.
            </li>
          </ul>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="known-limitations" aria-labelledby="limitations-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="limitations-heading">
            Known limitations
          </h2>
          <p className="govuk-body">
            Some legacy PDF documents published prior to 2024 may not be fully accessible to screen reader software. Where possible, we provide plain text or HTML equivalents for critical cybersecurity guidance.
          </p>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="reporting-issues" aria-labelledby="reporting-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="reporting-heading">
            Reporting accessibility issues
          </h2>
          <p className="govuk-body">
            We are always looking to improve the accessibility of this website. If you find any problems not listed on this page or think we are not meeting accessibility requirements, please contact us:
          </p>
          <div className="govuk-inset-text">
            <p className="govuk-body govuk-!-margin-bottom-1">
              <strong>Email:</strong>{" "}
              <a href="mailto:contacts@ttcsirt.gov.tt" className="govuk-link">
                contacts@ttcsirt.gov.tt
              </a>
            </p>
            <p className="govuk-body govuk-!-margin-bottom-0">
              <strong>Telephone:</strong> +1 (868) 625-7937
            </p>
          </div>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="enforcement" aria-labelledby="enforcement-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="enforcement-heading">
            Enforcement procedure
          </h2>
          <p className="govuk-body">
            TT-CSIRT operates under the Ministry of Homeland Security. If you contact us about accessibility and are not satisfied with our response, you can escalate your enquiry via the Ministry of Homeland Security administrative channels.
          </p>
        </section>
      </div>
    </div>
  );
}
