import { PageNavigation } from "@/components/PageNavigation";

interface TrainingPageProps {
  onNavigate: (path: string) => void;
}

const TRAINING_NAV_ITEMS = [
  { id: "overview", label: "Capacity building overview" },
  { id: "school-education", label: "School Education Program" },
  { id: "cyber-paths", label: "Cyber Paths Training Program" },
  { id: "oas-challenge", label: "OAS Cyber Challenge" },
  { id: "shesecures", label: "SheSecures Trinidad and Tobago" },
  { id: "workshops-ttx", label: "Technical workshops & tabletop exercises" },
  { id: "registration-contact", label: "Registration and enquiries" },
];

export function TrainingPage({ onNavigate }: TrainingPageProps) {
  return (
    <div className="govuk-grid-row app-page-grid-row">
      <PageNavigation navItems={TRAINING_NAV_ITEMS} />

      <div className="govuk-grid-column-two-thirds app-page-content">
        <h1 className="govuk-heading-xl" id="training-main-heading">
          Cyber training and education
        </h1>

        <p className="govuk-body-l">
          TT-CSIRT works with local and international partners to train the cyber workforce, support schools and help organisations practise their response to cyber incidents.
        </p>

        <section id="overview" aria-labelledby="overview-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="overview-heading">
            Capacity building overview
          </h2>
          <p className="govuk-body">
            Developing national cyber resilience requires a skilled and vigilant population. Under the national mandate, TT-CSIRT leads workforce education, youth awareness programmes, and technical simulation exercises designed to expand cyber security expertise across Trinidad and Tobago.
          </p>
          <p className="govuk-body">
            Programmes are delivered in partnership with the Organization of American States (OAS), the Citi Foundation, FIRST, academic institutions, and regional CSIRTs.
          </p>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="school-education" aria-labelledby="school-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l govuk-!-margin-top-0" id="school-heading">
            School education programme
          </h2>
          <p className="govuk-body">
            <strong>Audience:</strong> Secondary school students, teachers, and school administrators across Trinidad and Tobago.
          </p>
          <p className="govuk-body">
            <strong>Purpose:</strong> Cultivating early digital hygiene, cyberbullying awareness, safe online behaviour, and inspiring young citizens to pursue career pathways in computer science and cyber defence.
          </p>
          <p className="govuk-body">
            <strong>Recent engagements:</strong> TT-CSIRT has conducted in-person interactive awareness sessions at institutions including Speyside High School in Tobago, Bishop Anstey High School East, and other schools across both islands.
          </p>
          <p className="govuk-body">
            <strong>Status:</strong> Active and ongoing throughout academic terms.
          </p>
          <p className="govuk-body-s">
            <a
              href="/training/school-education-program-outreach"
              className="govuk-link"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("/training/school-education-program-outreach");
              }}
            >
              Read programme details and school outreach overview
            </a>
          </p>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="cyber-paths" aria-labelledby="paths-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l govuk-!-margin-top-0" id="paths-heading">
            Cyber paths training program
          </h2>
          <p className="govuk-body">
            <strong>Audience:</strong> University students, recent graduates, early-career IT professionals, and citizens seeking specialised cyber security qualifications.
          </p>
          <p className="govuk-body">
            <strong>Purpose:</strong> An intensive, sponsored training initiative implemented by the Organization of American States (OAS) Cybersecurity Program with funding from the Citi Foundation, in close partnership with TT-CSIRT. The curriculum provides recognised professional credentials, hands-on lab training, and direct career readiness mentoring.
          </p>
          <p className="govuk-body">
            <strong>Status:</strong> Cohort registrations open periodically. Announcements are published via the TT-CSIRT portal and official channels.
          </p>
          <p className="govuk-body-s">
            <a
              href="/training/cyber-paths-training-program"
              className="govuk-link"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("/training/cyber-paths-training-program");
              }}
            >
              Read program requirements and registration overview
            </a>
          </p>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="oas-challenge" aria-labelledby="oas-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l govuk-!-margin-top-0" id="oas-heading">
            OAS Cyber Challenge Trinidad and Tobago
          </h2>
          <p className="govuk-body">
            <strong>Audience:</strong> Cybersecurity practitioners, university teams, ethical hackers, and technical defenders.
          </p>
          <p className="govuk-body">
            <strong>Purpose:</strong> A national hands-on capture-the-flag (CTF) competition testing practical capabilities in digital forensics, reverse engineering, web application penetration testing, cryptography, and network traffic analysis.
          </p>
          <p className="govuk-body">
            <strong>Status:</strong> Annual national competition.
          </p>
          <p className="govuk-body-s">
            <a
              href="/events/oas-cyber-challenge-trinidad-and-tobago-2026"
              className="govuk-link"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("/events/oas-cyber-challenge-trinidad-and-tobago-2026");
              }}
            >
              View OAS Cyber Challenge details and competition schedule
            </a>
          </p>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="shesecures" aria-labelledby="shesecures-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l govuk-!-margin-top-0" id="shesecures-heading">
            SheSecures Trinidad and Tobago
          </h2>
          <p className="govuk-body">
            <strong>Audience:</strong> Women students, graduates, and professionals interested in cybersecurity.
          </p>
          <p className="govuk-body">
            <strong>Purpose:</strong> A targeted challenge and workshop designed to break barriers and expand female representation in cybersecurity leadership and technical roles across Trinidad and Tobago.
          </p>
          <p className="govuk-body">
            <strong>Status:</strong> Annual event coordinated with the Inter-American Commission of Women (CIM) and the OAS.
          </p>
          <p className="govuk-body-s">
            <a
              href="/events/shesecures-trinidad-and-tobago"
              className="govuk-link"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("/events/shesecures-trinidad-and-tobago");
              }}
            >
              View SheSecures initiative details and participant criteria
            </a>
          </p>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="workshops-ttx" aria-labelledby="workshops-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="workshops-heading">
            Technical workshops &amp; tabletop exercises
          </h2>
          <p className="govuk-body">
            TT-CSIRT organizes focused technical capacity-building workshops for public and private sector administrators:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            <li>
              <strong>
                <a
                  href="/news/tabletop-exercises-enhancing-national-resilience"
                  className="govuk-link"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate("/news/tabletop-exercises-enhancing-national-resilience");
                  }}
                >
                  Tabletop Exercises (TTX)
                </a>
                :
              </strong>{" "}
              Executive crisis simulations evaluating coordination between executive management, legal teams, communications officers, and IT defenders during a simulated major cyber incident.
            </li>
            <li>
              <strong>
                <a
                  href="/events/cyber-threat-intelligence-crisis-communication-workshop"
                  className="govuk-link"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate("/events/cyber-threat-intelligence-crisis-communication-workshop");
                  }}
                >
                  Cyber Threat Intelligence &amp; Crisis Communication
                </a>
                :
              </strong>{" "}
              Conducted in collaboration with FIRST and international partners.
            </li>
            <li>
              <strong>Web Application Security &amp; Defense:</strong> Developer-focused training on mitigating OWASP Top 10 vulnerabilities.
            </li>
          </ul>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="registration-contact" aria-labelledby="reg-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="reg-heading">
            Registration and enquiries
          </h2>
          <p className="govuk-body">
            To register interest in upcoming training cohorts, request a school awareness presentation, or enquire about corporate tabletop simulations:
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
      </div>
    </div>
  );
}
