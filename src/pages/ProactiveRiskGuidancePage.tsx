import type { ReactNode } from "react";
import { PageNavigation } from "@/components/PageNavigation";

interface ProactiveRiskGuidancePageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

function InternalLink({ href, onNavigate, children }: { href: string; onNavigate: (path: string) => void; children: ReactNode }) {
  return <a className="govuk-link" href={href} onClick={(event) => { event.preventDefault(); onNavigate(href); }}>{children}</a>;
}

function GuidePage({
  title,
  lead,
  sections,
  onNavigate,
}: {
  title: string;
  lead: string;
  sections: { id: string; title: string; content: ReactNode }[];
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="govuk-grid-row app-page-grid-row">
      <PageNavigation navItems={sections.map(({ id, title }) => ({ id, label: title }))} />
      <div className="govuk-grid-column-two-thirds app-page-content">
        <a href="/guidance" className="govuk-back-link" onClick={(event) => { event.preventDefault(); onNavigate("/guidance"); }}>
          Back to cyber security guidance
        </a>
        <h1 className="govuk-heading-xl govuk-!-margin-top-4">{title}</h1>
        <p className="govuk-body-l">{lead}</p>
        {sections.map((section, index) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`} className="govuk-!-margin-bottom-8">
            {index > 0 && <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />}
            <h2 className="govuk-heading-l" id={`${section.id}-heading`}>{section.title}</h2>
            {section.content}
          </section>
        ))}
      </div>
    </div>
  );
}

export function ProactiveRiskGuidancePage({ slug, onNavigate }: ProactiveRiskGuidancePageProps) {
  if (slug === "assessing-and-managing-vulnerabilities") {
    return <GuidePage
      title="Assess and manage security weaknesses"
      lead="Use a planned process to find weaknesses in the systems your organisation depends on, understand their likely effect and decide what to address first."
      onNavigate={onNavigate}
      sections={[
        { id: "set-the-scope", title: "Set the scope", content: <>
          <p className="govuk-body">Start with the services, information and systems that matter most to your organisation. Record the devices, software, cloud services and suppliers that support them, who owns each item, and how it connects to other systems. A current inventory makes it easier to assess what is exposed and who can take action.</p>
          <p className="govuk-body">Decide what kind of assessment is suitable. Reviewing configuration and update records can find known issues; a vulnerability scan can identify possible technical weaknesses; a security assessment may examine controls, processes and how systems are used. Match the method to your question and get approval before testing systems, including those managed by a supplier.</p>
        </> },
        { id: "assess-findings", title: "Assess findings", content: <>
          <p className="govuk-body">A finding needs context. Confirm which asset is affected, whether the weakness is present, whether it is reachable, and what information or service could be affected. Consider known exploitation, exposure to the internet, the importance of the system and the safeguards already in place. A severity score is useful evidence, but it does not by itself decide your organisation&apos;s priority.</p>
          <p className="govuk-body">Not every vulnerability can be fixed at once. Give particular attention to issues known to be exploited in the wild. The <a className="govuk-link" href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog" target="_blank" rel="noopener noreferrer">CISA Known Exploited Vulnerabilities Catalog</a> is one source organisations can use when prioritising vulnerability work. CISA describes the catalogue as an input to prioritisation; US federal remediation deadlines do not apply to organisations in Trinidad and Tobago.</p>
        </> },
        { id: "plan-remediation", title: "Plan and verify improvements", content: <>
          <p className="govuk-body">Agree an owner, next action and review point for each priority issue. Actions may include applying a vendor fix, changing a configuration, restricting access, removing an unnecessary service or accepting a risk for a recorded reason. Where an immediate fix is not practical, consider temporary safeguards and set a date to review them.</p>
          <p className="govuk-body">After a change, check that it worked and did not disrupt another service. Keep a record of what was tested, what changed and any remaining risk. Use the results to improve your asset inventory and repeat assessments when systems or threats change.</p>
          <p className="govuk-body">For current threat and vulnerability information, check <InternalLink href="/advisories" onNavigate={onNavigate}>TT-CSIRT alerts and advisories</InternalLink>. If you need to discuss a security assessment or vulnerability concern, <InternalLink href="/contact" onNavigate={onNavigate}>contact TT-CSIRT</InternalLink> to ask what support is available. Do not use this route to report an active incident; use the <InternalLink href="/report-an-incident" onNavigate={onNavigate}>incident reporting service</InternalLink>.</p>
        </> },
      ]}
    />;
  }

  if (slug === "understanding-your-exposure") {
    return <GuidePage
      title="Understand your organisation's internet-facing systems"
      lead="Know which systems and services people can reach from the internet, why they are available and who is responsible for keeping them secure."
      onNavigate={onNavigate}
      sections={[
        { id: "what-is-exposed", title: "What is an internet-facing asset?", content: <>
          <p className="govuk-body">An internet-facing asset is a device, service or resource that can be reached from the public internet. Examples include websites, email gateways, remote access services, cloud applications, domain name records and public-facing application programming interfaces. Some assets are intended to be public; others may be exposed because of a forgotten test system, old supplier connection or configuration change.</p>
          <p className="govuk-body">The collection of places where an organisation can be reached is often called its attack surface. The UK National Cyber Security Centre (NCSC) describes external attack surface management (EASM) as identifying, monitoring and reducing vulnerabilities in assets accessible from the internet. This is a technical approach and may involve dedicated products; it is not a service that TT-CSIRT claims to provide continuously.</p>
          <p className="govuk-body">Read the <a className="govuk-link" href="https://www.ncsc.gov.uk/guidance/external-attack-surface-management-buyers-guide" target="_blank" rel="noopener noreferrer">NCSC external attack surface management guidance</a> for more detail about the concept and how EASM products can support vulnerability management.</p>
        </> },
        { id: "build-inventory", title: "Build an accurate inventory", content: <>
          <p className="govuk-body">Start with records you already have: domain names, internet protocol addresses, cloud accounts, supplier services, certificates and system owners. Ask technology teams and suppliers to confirm what is live, what it supports and who can approve changes. Compare the records with what you can observe from outside your network, then investigate assets you cannot identify.</p>
          <p className="govuk-body">An inventory is most useful when it is maintained as systems change. Include an owner and purpose for each asset, identify dependencies, and record how to retire or remove it safely. Protect the inventory because it describes important parts of your organisation&apos;s technology.</p>
        </> },
        { id: "review-exposure", title: "Review what needs to be exposed", content: <>
          <p className="govuk-body">For each public service, confirm that internet access is needed and limited to the intended function. Remove or restrict services that are no longer required. Review remote administration, authentication, software updates and access to sensitive data. Ask suppliers what they expose on your behalf and how they will tell you about changes or security issues.</p>
          <p className="govuk-body">A vulnerability assessment checks for known weaknesses in selected systems. Threat information helps you understand which weaknesses or services may be receiving attention from attackers. These activities complement an asset inventory; neither alone provides a complete picture of risk.</p>
        </> },
        { id: "choose-next-steps", title: "Choose your next steps", content: <>
          <p className="govuk-body">You can review systems using existing records and suitably authorised technical checks. Larger organisations with many public services may consider whether an EASM product fits their needs, skills and budget. A product can help find assets, but your organisation still needs to confirm ownership, assess business impact and decide what to change.</p>
          <p className="govuk-body">Use <InternalLink href="/advisories" onNavigate={onNavigate}>TT-CSIRT advisories</InternalLink> to check current alerts and recommendations. For help discussing a vulnerability or security assessment, <InternalLink href="/contact" onNavigate={onNavigate}>contact TT-CSIRT</InternalLink>. If you discover an active compromise, report it through the <InternalLink href="/report-an-incident" onNavigate={onNavigate}>incident reporting service</InternalLink>.</p>
        </> },
      ]}
    />;
  }

  if (slug === "cyber-security-baseline") {
    return <GuidePage
      title="Cyber security baseline for organisations"
      lead="Use this baseline to identify practical measures your organisation can take to reduce common cyber security risks."
      onNavigate={onNavigate}
      sections={[
        { id: "know-assets", title: "Know what you have", content: <>
          <p className="govuk-body">Keep an inventory of devices, software, important services, cloud services and internet-facing systems. Record who owns each item, what it supports and how to contact the person responsible. Use the inventory to identify outdated or unneeded systems and to understand which services depend on them.</p>
          <p className="govuk-body">The Government of Canada&apos;s <a className="govuk-link" href="https://www.getcybersafe.gc.ca/en/resources/get-cyber-safe-guide-small-businesses" target="_blank" rel="noopener noreferrer">Get Cyber Safe guide for small businesses</a> includes an asset inventory among its practical steps. It is comparative guidance, not local law or TT-CSIRT policy.</p>
        </> },
        { id: "protect-accounts", title: "Protect accounts", content: <>
          <p className="govuk-body">Require multi-factor authentication (MFA) for important accounts, especially email, remote access, cloud administration and other privileged access. Use separate administrator accounts for administrative work, give people only the access they need, and remove accounts promptly when someone changes role or leaves. Avoid shared accounts where individual accounts are practical.</p>
          <p className="govuk-body">Use strong, unique passwords and a password manager where appropriate. Keep recovery methods secure and make sure more than one authorised person can regain access to critical services if an account is locked.</p>
        </> },
        { id: "updates", title: "Keep software and systems updated", content: <>
          <p className="govuk-body">Enable automatic updates where appropriate and keep operating systems, applications, network equipment and security tools supported and patched. Plan how to test important updates and restore service if an update causes a problem. Replace or isolate systems that no longer receive security fixes.</p>
          <p className="govuk-body">Prioritise vulnerabilities that are known to be exploited when deciding which fixes need attention first. The <a className="govuk-link" href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog" target="_blank" rel="noopener noreferrer">CISA Known Exploited Vulnerabilities Catalog</a> can inform that decision. It is an input, not a complete priority list; CISA federal deadlines do not apply in Trinidad and Tobago.</p>
        </> },
        { id: "secure-services", title: "Secure devices and services", content: <>
          <p className="govuk-body">Use supported devices and secure configurations. Remove software and services you do not need, restrict administrative interfaces to authorised users and networks, and review default settings before putting a system into use. Apply appropriate endpoint protection and collect enough logs to investigate suspicious activity.</p>
          <p className="govuk-body">For public-facing systems, confirm that exposed services are intentional and maintained. See <InternalLink href="/guidance/understanding-your-exposure" onNavigate={onNavigate}>how to understand your organisation&apos;s internet-facing systems</InternalLink>.</p>
        </> },
        { id: "backups", title: "Back up important information", content: <>
          <p className="govuk-body">Back up information and configurations needed to restore important services. Protect backup accounts and copies from changes by ordinary user accounts and from the same disruption that could affect production systems. Test restoration periodically so you know what can be recovered and how long the process takes.</p>
        </> },
        { id: "prepare-response", title: "Prepare to respond", content: <>
          <p className="govuk-body">Write down who makes decisions, who handles technical response and who communicates with staff, customers, suppliers and other stakeholders. Record how to contact these people if normal email or collaboration tools are unavailable. Keep an incident response plan that fits your organisation and exercise it with relevant staff.</p>
          <p className="govuk-body">If you need to plan continuity and recovery, see <InternalLink href="/guidance/business-continuity-and-cyber-recovery" onNavigate={onNavigate}>prepare for cyber disruption and recovery</InternalLink>.</p>
        </> },
        { id: "review-improve", title: "Review and improve", content: <>
          <p className="govuk-body">Review this baseline when your services, systems, suppliers or responsibilities change. Choose actions based on the likely effect on your organisation, assign owners and record what remains to be done. The <a className="govuk-link" href="https://www.nist.gov/publications/nist-cybersecurity-framework-csf-20" target="_blank" rel="noopener noreferrer">NIST Cybersecurity Framework 2.0</a> offers a flexible way to describe and communicate cyber security outcomes; it is not a certification or a TT-CSIRT requirement.</p>
        </> },
        { id: "contact-ttcsirt", title: "When to contact TT-CSIRT", content: <>
          <p className="govuk-body">If you need help understanding a vulnerability, assessing a system or responding to a security concern, <InternalLink href="/contact" onNavigate={onNavigate}>contact TT-CSIRT</InternalLink> to discuss the support available. This guidance does not promise a particular assessment or service.</p>
          <p className="govuk-body">If your organisation is already experiencing an incident, use the <InternalLink href="/report-an-incident" onNavigate={onNavigate}>TT-CSIRT incident reporting service</InternalLink>. For current threats and recommended actions, check <InternalLink href="/advisories" onNavigate={onNavigate}>TT-CSIRT alerts and advisories</InternalLink>.</p>
        </> },
      ]}
    />;
  }

  return <GuidePage
    title="Prepare for cyber disruption and recovery"
    lead="Plan how your organisation will continue operating and recover if a cyber security incident disrupts systems, services or data."
    onNavigate={onNavigate}
    sections={[
      { id: "identify-priorities", title: "Identify what must continue", content: <>
        <p className="govuk-body">List the services your organisation needs to deliver and the information and systems each service relies on. Consider the effect on people who depend on the service, legal or contractual commitments, safety, finances and public trust. Ask service owners what can continue manually for a short time and what would stop without technology.</p>
        <p className="govuk-body">Map important dependencies such as staff, buildings, suppliers, cloud services, network connections and data. A disruption in one supplier or shared system can affect more than one service, so include dependencies outside your organisation&apos;s direct control.</p>
      </> },
      { id: "set-recovery-order", title: "Set recovery priorities", content: <>
        <p className="govuk-body">Agree which services should be restored first and who can make that decision during an incident. Consider what each service needs before it can resume, including clean devices, restored data, supplier access and trained staff. Record assumptions and dependencies so teams do not restore systems in an order that blocks more important work.</p>
        <p className="govuk-body">Choose recovery objectives that reflect your service needs and capacity. There is no single recovery time or data-loss target that suits every organisation. Explain the trade-offs to decision-makers and review them when the service or its risks change.</p>
      </> },
      { id: "protect-backups", title: "Protect and test backups", content: <>
        <p className="govuk-body">Identify what data and configurations are needed to restore priority services, how often they change and who is responsible for backups. Restrict access to backup systems and protect at least one recoverable copy from compromise of everyday accounts or production systems.</p>
        <p className="govuk-body">Test restoring selected data and systems in a safe way. Confirm that the backup is usable, that the people responsible know the steps and that restored systems can reconnect to the services they depend on. Use test results to update recovery priorities and identify gaps.</p>
      </> },
      { id: "roles-contacts", title: "Define roles and contacts", content: <>
        <p className="govuk-body">Name an incident lead, a technical lead and a business decision-maker. Agree who handles staff and customer communications, who contacts suppliers and who keeps a record of decisions. Give each role a deputy and maintain contact details somewhere that remains available if your normal systems are down.</p>
        <p className="govuk-body">Include the organisations you may need to contact, such as technology providers, insurers, legal advisers and TT-CSIRT. Confirm what information each party needs and the best way to reach them. Do not put sensitive credentials in a contact list.</p>
      </> },
      { id: "exercise-plan", title: "Exercise the plan", content: <>
        <p className="govuk-body">Run a tabletop exercise using a realistic disruption, such as loss of access to email, ransomware affecting shared files or an unavailable supplier. Ask participants to explain what they would do, who they would contact and how they would make decisions when information is incomplete.</p>
        <p className="govuk-body">Exercises should help people practise and reveal gaps, not assign blame. Record actions, owners and review dates. Where practical, test technical restoration separately so the exercise does not put live services at risk.</p>
        <p className="govuk-body">TT-CSIRT lists training and exercises on its <InternalLink href="/training" onNavigate={onNavigate}>training and education page</InternalLink>; consult it for current activities and enquiries.</p>
      </> },
      { id: "review-plan", title: "Review the plan", content: <>
        <p className="govuk-body">Review the plan after exercises, incidents, major system changes, supplier changes and changes in staff responsibilities. Check that contact details, service priorities, backup instructions and dependencies remain accurate. Share relevant parts with the people who may need them and control access to sensitive technical details.</p>
        <p className="govuk-body">For practical preventive measures, see the <InternalLink href="/guidance/cyber-security-baseline" onNavigate={onNavigate}>cyber security baseline for organisations</InternalLink>. For active incidents, use the <InternalLink href="/report-an-incident" onNavigate={onNavigate}>TT-CSIRT incident reporting service</InternalLink>.</p>
      </> },
      { id: "incident-support", title: "Need incident response support?", content: <>
        <p className="govuk-body">If you are already dealing with a cyber security incident, use the <InternalLink href="/report-an-incident" onNavigate={onNavigate}>TT-CSIRT incident reporting service</InternalLink>. This recovery guide is for preparation and does not replace incident reporting or provide a live response channel.</p>
      </> },
    ]}
  />;
}
