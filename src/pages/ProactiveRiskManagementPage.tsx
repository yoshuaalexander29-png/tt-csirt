import { Notice } from "@/components/Notice";
import { PageNavigation } from "@/components/PageNavigation";
import { RiskReadinessExperience } from "@/components/RiskReadinessExperience";

interface ProactiveRiskManagementPageProps {
  onNavigate: (path: string) => void;
}

const NAV_ITEMS = [
  { id: "understand-risk", label: "Understand your cyber security risk" },
  { id: "reduce-weaknesses", label: "Reduce common weaknesses" },
  { id: "prepare-organisation", label: "Prepare your organisation" },
  { id: "get-support", label: "Get support from TT-CSIRT" },
];

const RISK_DOORMATS = [
  {
    href: "/guidance/assessing-and-managing-vulnerabilities",
    title: "Assess your systems for security weaknesses",
    description: "Learn how organisations can identify weaknesses, assess vulnerabilities and decide which issues need attention.",
  },
  {
    href: "/advisories",
    title: "Check threats and vulnerabilities affecting your organisation",
    description: "Read current TT-CSIRT alerts and advisories, including information about threats, vulnerabilities and recommended actions.",
  },
  {
    href: "/guidance/understanding-your-exposure",
    title: "Understand your organisation's exposed systems",
    description: "Learn how internet-facing systems, services and unnecessary exposure can create opportunities for attackers.",
  },
];

const PREPARE_DOORMATS = [
  {
    href: "/training",
    title: "Build cyber security skills and test your response",
    description: "Find TT-CSIRT training, awareness activities, workshops and exercises for organisations and their teams.",
  },
  {
    href: "/guidance/business-continuity-and-cyber-recovery",
    title: "Prepare for disruption and recovery",
    description: "Prepare for cyber disruption with continuity planning, recovery priorities, backups and clear responsibilities.",
  },
];

const SUPPORT_DOORMATS = [
  {
    href: "/contact",
    title: "Discuss a security assessment or vulnerability concern",
    description: "Contact TT-CSIRT to discuss an assessment, vulnerability concern or other proactive security support.",
  },
  {
    href: "/guidance",
    title: "Read TT-CSIRT cyber security guidance",
    description: "Find TT-CSIRT guidance on preventing, responding to and managing common cyber security risks.",
  },
];

function DoormatList({
  items,
  onNavigate,
  label,
}: {
  items: typeof RISK_DOORMATS;
  onNavigate: (path: string) => void;
  label: string;
}) {
  return (
    <ul className="advisory-document-list" aria-label={label}>
      {items.map((item) => (
        <li className="gem-c-document-list__item" key={item.href}>
          <h3 className="gem-c-document-list__item-title">
            <a href={item.href} className="govuk-link" onClick={(event) => {
              event.preventDefault();
              onNavigate(item.href);
            }}>
              {item.title}
            </a>
          </h3>
          <p className="gem-c-document-list__item-description">{item.description}</p>
        </li>
      ))}
    </ul>
  );
}

export function ProactiveRiskManagementPage({ onNavigate }: ProactiveRiskManagementPageProps) {
  const incidentLink = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onNavigate("/report-an-incident");
  };
  const trainingLink = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onNavigate("/training");
  };

  return (
    <div className="govuk-grid-row app-page-grid-row">
      <PageNavigation navItems={NAV_ITEMS} />

      <div className="govuk-grid-column-two-thirds app-page-content">
        <h1 className="govuk-heading-xl" id="proactive-main-heading">
          Reduce your organisation&apos;s cyber security risk
        </h1>
        <p className="govuk-body-l">
          TT-CSIRT&apos;s proactive risk exposure management service helps organisations identify weaknesses, understand relevant threats and take action to reduce cyber security risk before an incident.
        </p>

        <Notice type="info" title="Responding to an active incident" titleAs="h2">
          <p className="govuk-body govuk-!-margin-bottom-0">
            If your organisation is already experiencing a cyber security incident, use the{" "}
            <a href="/report-an-incident" className="govuk-link" onClick={incidentLink}>
              TT-CSIRT incident reporting service
            </a>.
          </p>
        </Notice>

        <section id="understand-risk" aria-labelledby="understand-risk-heading" className="govuk-!-margin-top-8 govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="understand-risk-heading">Understand your cyber security risk</h2>
          <p className="govuk-body">
            Effective cyber security starts with understanding what you need to protect, which weaknesses could affect it and which threats are most relevant to your organisation. Include the systems and information your organisation depends on, the people who need access, and the effect a disruption could have on customers, staff and essential work.
          </p>
          <p className="govuk-body">
            Risk management is not a single checklist. The <a className="govuk-link" href="https://www.nist.gov/publications/nist-cybersecurity-framework-csf-20" target="_blank" rel="noopener noreferrer">NIST Cybersecurity Framework (CSF) 2.0</a> offers a common way to understand, assess, prioritise and communicate cyber security efforts. It does not prescribe one method, and TT-CSIRT does not require organisations to use it. Choose actions that fit your organisation&apos;s services, resources and risks.
          </p>
          <p className="govuk-body">
            Begin with a reliable picture of your devices, software, cloud services, suppliers and internet-facing systems. Compare that picture with current threat information, then decide which weaknesses could affect important services. The following guidance can help you work through those questions.
          </p>
          <DoormatList items={RISK_DOORMATS} onNavigate={onNavigate} label="Understand and assess cyber security risk" />
        </section>

        <RiskReadinessExperience />

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="reduce-weaknesses" aria-labelledby="reduce-weaknesses-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="reduce-weaknesses-heading">Reduce common weaknesses</h2>
          <p className="govuk-body">
            You do not need to solve every cyber security problem at once. Start with controls that reduce common and preventable risks: know what devices and services you use, protect important accounts, install security updates, limit access to systems, keep recoverable backups and agree how your organisation will respond to an incident.
          </p>
          <p className="govuk-body">
            For small organisations, the Government of Canada&apos;s <a className="govuk-link" href="https://www.getcybersafe.gc.ca/en/resources/get-cyber-safe-guide-small-businesses" target="_blank" rel="noopener noreferrer">Get Cyber Safe guide for small businesses</a> is a comparative example of practical steps such as taking stock of assets, securing accounts and devices, backing up information, training staff and planning for incidents. It is general guidance from another country, not Trinidad and Tobago law or TT-CSIRT policy.
          </p>
          <p className="govuk-body">
            Not every vulnerability can be fixed at once. Prioritise issues that present the greatest risk to your organisation and give particular attention to vulnerabilities known to be exploited in the wild. You can use the <a className="govuk-link" href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog" target="_blank" rel="noopener noreferrer">CISA Known Exploited Vulnerabilities Catalog</a> as one input when deciding which fixes need attention first. CISA&apos;s federal remediation deadlines apply to US federal agencies; they are not requirements for organisations in Trinidad and Tobago.
          </p>
          <p className="govuk-body">
            A baseline makes it easier to decide what to do first and review progress over time. It should support your organisation&apos;s risk decisions, not be treated as a certification or a promise that incidents cannot happen.
          </p>
          <DoormatList items={[{
            href: "/guidance/cyber-security-baseline",
            title: "Start with a cyber security baseline",
            description: "Work through a practical baseline covering accounts, devices, updates, backups, access control and incident planning.",
          }]} onNavigate={onNavigate} label="Reduce common cyber security weaknesses" />
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="prepare-organisation" aria-labelledby="prepare-organisation-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="prepare-organisation-heading">Prepare your organisation</h2>
          <p className="govuk-body">
            Cyber security is also about being able to continue operating when something goes wrong. Training, exercises and recovery planning help people understand what to do before an incident happens. Agree who can make decisions, who will handle technical work and how staff, customers and suppliers will receive updates.
          </p>
          <p className="govuk-body">
            TT-CSIRT describes training, education, awareness and structured business continuity and disaster recovery planning as part of its capacity-building services. The current <a href="/training" className="govuk-link" onClick={trainingLink}>TT-CSIRT training and education page</a> lists its programmes and activities; check it for the actual opportunities available.
          </p>
          <p className="govuk-body">
            Regional programmes such as the <a className="govuk-link" href="https://www.oas.org/ext/en/security/prog-cyber" target="_blank" rel="noopener noreferrer">OAS CICTE Cybersecurity Program</a> support member states in building capacity to prevent, identify, respond to and recover from cyber incidents. This provides regional context for readiness, exercises and information sharing; it does not mean OAS directs TT-CSIRT or that TT-CSIRT delivers every OAS programme.
          </p>
          <p className="govuk-body">
            A recovery plan should reflect the services your organisation needs to keep running and the systems those services rely on. Test whether staff can find the plan, reach the right people and restore the information they need. Record what did not work and update the plan as responsibilities, systems and suppliers change.
          </p>
          <DoormatList items={PREPARE_DOORMATS} onNavigate={onNavigate} label="Prepare for cyber security incidents and recovery" />
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="get-support" aria-labelledby="get-support-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="get-support-heading">Get support from TT-CSIRT</h2>
          <p className="govuk-body">
            TT-CSIRT&apos;s current service information lists security assessments, vulnerability management, alerts and advisories, threat intelligence, training and capacity-building support. Its services are described as available to public and private sector entities in Trinidad and Tobago at no cost. The appropriate support depends on your concern and what TT-CSIRT can provide.
          </p>
          <p className="govuk-body">
            The Government of Trinidad and Tobago&apos;s <a className="govuk-link" href="https://www.printery.gov.tt/e-gazette/2025/Gazette/Gazette_No._81_of_2025.pdf" target="_blank" rel="noopener noreferrer">May 2025 assignment of ministerial responsibilities</a> lists cyber-security and TT-CSIRT under the Ministry of Homeland Security. An <a className="govuk-link" href="https://printery.gov.tt/e-gazette/2025/Gazette/Gazette_No._146_of_2025.pdf" target="_blank" rel="noopener noreferrer">October 2025 amended schedule</a> retains both. These documents provide institutional context; they do not make TT-CSIRT a regulator or establish services beyond those the team currently publishes.
          </p>
          <p className="govuk-body">
            If you need help understanding a vulnerability, discussing an assessment or finding relevant guidance, use the contact route or browse the guidance library. If an incident is already affecting your organisation, use the incident reporting service above.
          </p>
          <DoormatList items={SUPPORT_DOORMATS} onNavigate={onNavigate} label="Contact TT-CSIRT and find cyber security guidance" />
          <p className="govuk-body">
            The <a href="/national-cyber-security-strategy" className="govuk-link" onClick={(event) => { event.preventDefault(); onNavigate("/national-cyber-security-strategy"); }}>National Cyber Security Strategy</a> provides historical context for national risk assessment, information sharing, continuity planning and incident response. It was published in 2012, so it should not be read as proof of every current operational capability.
          </p>
          <p className="govuk-body">
            Organisational cyber security is also an enterprise risk question: disruption can affect service delivery, finances, people and public trust, not only information technology. A <a className="govuk-link" href="https://www.ttparliament.org/wp-content/uploads/2022/01/phs20231211.pdf" target="_blank" rel="noopener noreferrer">2023 parliamentary hearing summary on cyber attacks</a> discussed this framing and the need to assess readiness. That record supports the organisational-risk perspective here; it does not establish a current TT-CSIRT service. The steps on this page help you identify relevant risks, make proportionate improvements, prepare for disruption and find the right route for support.
          </p>
        </section>
      </div>
    </div>
  );
}
