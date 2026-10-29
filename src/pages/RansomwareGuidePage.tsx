import { PageNavigation } from "@/components/PageNavigation";
import { Notice } from "@/components/Notice";

interface RansomwareGuidePageProps {
  onNavigate: (path: string) => void;
}

const RANSOMWARE_NAV_ITEMS = [
  { id: "overview", label: "Overview and immediate actions" },
  { id: "phase-1", label: "Phase 1: Detection and analysis" },
  { id: "phase-2", label: "Phase 2: Containment" },
  { id: "phase-3", label: "Phase 3: Extended analysis" },
  { id: "phase-4", label: "Phase 4: Recovery" },
  { id: "phase-5", label: "Phase 5: Reporting and support" },
  { id: "ransom-payment", label: "Position on ransom payments" },
  { id: "contacts", label: "Emergency reporting contacts" },
];

export function RansomwareGuidePage({ onNavigate }: RansomwareGuidePageProps) {
  return (
    <div className="govuk-grid-row app-page-grid-row">
      <PageNavigation navItems={RANSOMWARE_NAV_ITEMS} />

      <div className="govuk-grid-column-two-thirds app-page-content">
        <h1 className="govuk-heading-xl" id="ransomware-main-heading">
          Ransomware response guide
        </h1>

        <p className="govuk-body-l">
          A procedural five-phase response guide and technical checklist for organisations in Trinidad and Tobago experiencing an active ransomware outbreak.
        </p>

        <div className="govuk-inset-text">
          <p className="govuk-body govuk-!-margin-bottom-1">
            <strong>Active emergency?</strong> If systems are actively encrypting right now, isolate network connections immediately (unplug Ethernet cables and turn off Wi-Fi). Do not power off servers without memory capture if technical staff are present.
          </p>
          <p className="govuk-body govuk-!-margin-bottom-0">
            Call TT-CSIRT immediately: <strong>+1 (868) 625-7937</strong> or <strong>+1 (868) 299-8827</strong>.
          </p>
        </div>

        <section id="overview" aria-labelledby="overview-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="overview-heading">
            Overview and immediate actions
          </h2>
          <p className="govuk-body">
            Ransomware is malicious software designed to deny access to a computer system or data until a ransom is paid. Modern ransomware operations typically combine data encryption with data exfiltration (double extortion).
          </p>
          <p className="govuk-body">
            This guide provides technical teams and incident response leads with a sequential procedural checklist adapted from TT-CSIRT and international cybersecurity frameworks.
          </p>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="phase-1" aria-labelledby="p1-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="p1-heading">
            Phase 1: Detection and analysis
          </h2>
          <p className="govuk-body">
            Quickly confirm the nature, scope, and strain of the ransomware infection:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            <li>
              <strong>Locate the ransom note:</strong> Preserve a copy of the ransom note file (e.g. <code>.txt</code> or <code>.html</code> file on desktops) to identify the threat group and victim identifier.
            </li>
            <li>
              <strong>Identify affected file extensions:</strong> Check which files have appended extensions to assist in strain identification.
            </li>
            <li>
              <strong>Determine initial access vector:</strong> Investigate whether access originated via exposed Remote Desktop Protocol (RDP), VPN credentials, phished email attachments, or unpatched internet-facing servers.
            </li>
            <li>
              <strong>Map scope of impact:</strong> Identify which subnets, virtual machines, domain controllers, and cloud shares are affected versus unaffected.
            </li>
          </ul>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="phase-2" aria-labelledby="p2-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="p2-heading">
            Phase 2: Containment
          </h2>
          <p className="govuk-body">
            Prevent the malware from spreading laterally to unaffected machines or secondary sites:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            <li>
              <strong>Disconnect from the network:</strong> Unplug Ethernet cables and disable Wi-Fi on all impacted and suspect machines.
            </li>
            <li>
              <strong>Sever site-to-site VPNs and cloud links:</strong> Immediately terminate VPN tunnels connecting branch offices, remote workers, or cloud infrastructure to stop lateral propagation.
            </li>
            <li>
              <strong>Protect backups:</strong> Immediately disconnect, air-gap, or power down storage devices and backup repositories that are not yet encrypted. Ensure backup credentials are not cached on compromised devices.
            </li>
            <li>
              <strong>Preserve system state:</strong> If feasible, take virtual machine snapshots or capture volatile memory (RAM) before turning off devices, as memory contains valuable encryption keys and volatile artifacts.
            </li>
            <li>
              <strong>Disable administrative shares:</strong> Block SMB port 445 and RPC port 135 across internal network boundaries.
            </li>
          </ul>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="phase-3" aria-labelledby="p3-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="p3-heading">
            Phase 3: Extended analysis
          </h2>
          <p className="govuk-body">
            Establish the full forensic timeline to ensure the threat actor is completely evicted before attempting recovery:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            <li>
              <strong>Investigate data exfiltration:</strong> Inspect egress firewall logs, cloud sync logs, and file transfer records for large outbound data transfers indicating data theft.
            </li>
            <li>
              <strong>Locate persistence mechanisms:</strong> Look for scheduled tasks, new local or domain administrator accounts, modified Group Policy Objects (GPOs), and unauthorised remote management tools (e.g. AnyDesk, ScreenConnect).
            </li>
            <li>
              <strong>Reset all domain and service credentials:</strong> Enforce a complete Kerberos ticket-granting ticket (krbtgt) password reset (twice) and reset all active directory passwords from a clean, isolated management workstation.
            </li>
          </ul>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="phase-4" aria-labelledby="p4-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="p4-heading">
            Phase 4: Recovery
          </h2>
          <p className="govuk-body">
            Restore systems in a planned, prioritised order following clean verification:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            <li>
              <strong>Rebuild from trusted media:</strong> Rebuild operating systems from authoritative golden images rather than trusting repaired compromised installations.
            </li>
            <li>
              <strong>Verify backup integrity:</strong> Scan and verify backups in an isolated staging sandbox before reconnecting them to production environments.
            </li>
            <li>
              <strong>Patch vulnerabilities before reconnecting:</strong> Apply all required security patches and enforce Multi-Factor Authentication (MFA) on all access channels prior to restoring internet connectivity.
            </li>
            <li>
              <strong>Continuous monitoring:</strong> Deploy endpoint detection and response (EDR) sensors to watch for any resurgence of threat actor tooling.
            </li>
          </ul>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="phase-5" aria-labelledby="p5-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="p5-heading">
            Phase 5: Reporting and support
          </h2>
          <p className="govuk-body">
            Report the incident to national authorities to coordinate containment, obtain technical analysis, and support law enforcement investigation:
          </p>
          <div className="govuk-summary-card govuk-!-margin-bottom-4">
            <div className="govuk-summary-card__title-wrapper">
              <h3 className="govuk-summary-card__title">1. Report to TT-CSIRT</h3>
            </div>
            <div className="govuk-summary-card__content">
              <p className="govuk-body">
                TT-CSIRT provides technical incident triage, malware reverse-engineering, indicator matching, and recovery advisory support at no cost.
              </p>
              <p className="govuk-body govuk-!-margin-bottom-0">
                <strong>Hotline:</strong> +1 (868) 625-7937
              </p>
            </div>
          </div>

          <div className="govuk-summary-card govuk-!-margin-bottom-6">
            <div className="govuk-summary-card__title-wrapper">
              <h3 className="govuk-summary-card__title">2. Report to Law Enforcement (TTPS CSMU)</h3>
            </div>
            <div className="govuk-summary-card__content">
              <p className="govuk-body">
                The Trinidad and Tobago Police Service Cyber and Social Media Unit (TTPS CSMU) provides criminal investigation, evidence collection, and digital forensics support.
              </p>
              <p className="govuk-body govuk-!-margin-bottom-0">
                <strong>Email:</strong> cybercrime@ttps.gov.tt | <strong>Tel:</strong> +1 (868) 612-0742 / +1 (868) 715-2072
              </p>
            </div>
          </div>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="ransom-payment" aria-labelledby="payment-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="payment-heading">
            Position on ransom payments
          </h2>
          <Notice type="warning" title="Ransom payments are strongly discouraged" titleAs="h3">
            <p className="govuk-body govuk-!-margin-bottom-0">
              TT-CSIRT and international cyber authorities strongly discourage the payment of ransoms.
            </p>
          </Notice>
          <p className="govuk-body">
            Paying a ransom does not guarantee that encrypted files will be restored, nor does it prevent the subsequent leaking of stolen data. Furthermore, ransom payments directly finance cybercriminal enterprises and encourage continued attacks against organisations in Trinidad and Tobago.
          </p>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="contacts" aria-labelledby="contacts-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="contacts-heading">
            Emergency reporting contacts
          </h2>
          <div className="govuk-inset-text">
            <p className="govuk-body govuk-!-margin-bottom-1">
              <strong>TT-CSIRT Emergency hotline:</strong> +1 (868) 625-7937
            </p>
            <p className="govuk-body govuk-!-margin-bottom-1">
              <strong>TT-CSIRT Secondary hotline:</strong> +1 (868) 299-8827
            </p>
            <p className="govuk-body govuk-!-margin-bottom-0">
              <strong>TTPS CSMU:</strong> cybercrime@ttps.gov.tt (+1 868 612-0742)
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
