/**
 * Guidance Articles: Organisations & Businesses
 * Authoritative synthesis based on NIST CSF 2.0, NIST SP 800-61 Rev. 3,
 * UK NCSC 10 Steps to Cyber Security, TT-CSIRT Ransomware Guidance,
 * and the Trinidad and Tobago Data Protection Act (DPA), Chap. 22:04.
 */

import { GuidanceArticle } from "../types";

export const ORGANISATION_ARTICLES: GuidanceArticle[] = [
  {
    slug: "responding-to-a-suspected-cyber-incident",
    title: "Responding to a suspected cyber incident",
    shortPurpose: "Practical steps for organisations to coordinate, contain, document and recover from a suspected cyber incident.",
    audienceDescription: "Organisation leaders, IT teams, incident coordinators and staff who may identify a cyber incident.",
    audiences: ["organisations", "government", "technical"],
    audienceLabel: "Organisations and public bodies",
    category: "enterprise-defence",
    categoryLabel: "Enterprise defence",
    lastReviewed: "9 October 2026",
    provenanceNote: "General incident-response guidance informed by NIST SP 800-61 Rev. 3 and TT-CSIRT incident response guidance. Apply actions to the specific system and operational context; specialist advice may be needed.",
    keyActions: [
      "Activate your incident plan and assign a coordinator",
      "Contain affected accounts, devices or network segments in a way that preserves essential services and evidence",
      "Keep a time-stamped record and preserve relevant logs and communications",
      "Notify TT-CSIRT and any other parties with a relevant role",
      "Recover from verified clean systems and review what needs to improve"
    ],
    sections: [
      { id: "coordinate-response", title: "Coordinate the response", paragraphs: ["Use your incident response plan if you have one. Identify a coordinator who can bring together technical staff, management, legal or privacy advisers, communications and business owners as needed. Agree how the response team will communicate if email, identity services or collaboration tools may be affected.", "Record the time the incident was detected, what was observed, who made decisions and what actions were taken. Separate confirmed facts from working assumptions and update the record as evidence changes."] },
      { id: "contain-safely", title: "Contain the activity safely", paragraphs: ["The right containment action depends on the system, threat and operational impact. Where feasible, isolate affected endpoints or network segments, disable compromised accounts or sessions, block known malicious indicators and protect backups. Coordinate with system owners and service providers, especially where essential or safety-related services could be disrupted.", "Do not automatically power off every affected device. Turning a device off can remove volatile evidence, while leaving it connected can allow activity to continue. If the choice is unclear, seek qualified incident-response advice and document the decision."] },
      { id: "preserve-evidence-and-assess", title: "Preserve evidence and assess impact", paragraphs: ["Preserve relevant security alerts, authentication records, email headers, firewall and endpoint logs, ransom notes, suspicious files and a timeline of events. Keep original copies where possible, restrict access and note how evidence was collected. Avoid deleting accounts, rebuilding systems or running cleanup tools before considering whether they could destroy useful evidence.", "Assess which accounts, systems, services and information may be affected. Check for persistence, unauthorised access, data exposure and effects on suppliers or connected organisations. State uncertainty clearly; an absence of evidence is not always evidence that no impact occurred."] },
      { id: "report-recover-learn", title: "Report, recover and learn", paragraphs: ["Report suspected cyber incidents to TT-CSIRT for technical coordination and guidance. Prepare the organisation name and contact, detection time, affected systems, observed indicators, actions already taken and any operational or data impact you know. Do not delay a report just because every detail is not available.", "TT-CSIRT reporting does not replace a police report, any applicable regulatory notification, contractual notice or internal escalation. Confirm separately which requirements apply to your organisation and incident; this guide does not establish a universal legal deadline.", "Before restoring services, address the likely access path, reset credentials or keys where appropriate, verify backups and confirm that rebuilt systems are clean and monitored. After stabilisation, review the timeline, root causes and response decisions, then update controls, contact lists, backups and exercises."] }
    ],
    whenToReport: { text: "If your organisation suspects an active cyber incident, contact TT-CSIRT for technical coordination and response guidance.", reportLinkText: "Report an incident to TT-CSIRT", reportLinkHref: "/report-an-incident", emergencyPhone: "+1 (868) 625-7937" },
    relatedGuidance: [
      { slug: "ransomware-prevention-response", title: "Ransomware prevention, defence and emergency response", description: "Read ransomware-specific response actions." },
      { slug: "incident-reporting-escalation", title: "National incident reporting and escalation procedures", description: "Review reporting and evidence-preservation guidance." }
    ],
    sources: [
      { title: "NIST SP 800-61 Rev. 3: Incident Response Recommendations and Considerations for Cybersecurity Risk Management", url: "https://csrc.nist.gov/pubs/sp/800/61/r3/final", publisher: "National Institute of Standards and Technology", context: "Primary technical foundation for integrating incident response into cybersecurity risk management." },
      { title: "TT-CSIRT incident reporting service", url: "/report-an-incident", publisher: "TT-CSIRT", context: "Local route for submitting an incident report." },
      { title: "TT-CSIRT ransomware response checklist", url: "https://ttcsirt.gov.tt/ransomware-response-checklist/", publisher: "TT-CSIRT", context: "Ransomware-specific response reference." }
    ]
  },
  {
    slug: "organisation-specific-incident-reporting",
    title: "How organisations can report a cyber incident",
    shortPurpose: "How organisations in Trinidad and Tobago can contact TT-CSIRT, prepare useful information and understand what incident reporting does and does not cover.",
    audienceDescription: "Business owners, public bodies, incident coordinators and technical teams preparing to report a cyber incident.",
    audiences: ["organisations", "government"],
    audienceLabel: "Organisations and public bodies",
    category: "enterprise-defence",
    categoryLabel: "Enterprise defence",
    lastReviewed: "9 October 2026",
    provenanceNote: "Explains TT-CSIRT's technical reporting route and general coordination boundaries. It does not determine legal, regulatory or contractual obligations for a particular organisation.",
    keyActions: ["Use TT-CSIRT's incident reporting form or contact its hotline for an active incident", "Share observed facts and clearly mark what remains uncertain", "Preserve logs and evidence without delaying urgent containment", "Check separately for police, regulatory, contractual and internal notification requirements"],
    sections: [
      { id: "when-to-contact-ttcsirt", title: "When to contact TT-CSIRT", paragraphs: ["Contact TT-CSIRT when your organisation suspects a cyber incident and needs technical triage, containment guidance or coordination. Examples include suspected account or system compromise, malware or ransomware, phishing that exposed credentials, a data breach, service disruption or a vulnerability that appears to be actively exploited.", "You do not need a complete investigation or confirmed severity rating before contacting the team. Explain what prompted the report, what is known and what is still being checked."] },
      { id: "prepare-information", title: "Information to prepare", paragraphs: ["If safely available, prepare your organisation's name and a contact who can coordinate with responders; the date and time detected; systems, accounts or services affected; the incident's operational impact; suspicious messages, domains, IP addresses or file names; and containment steps already taken. Keep relevant logs, email headers, screenshots and alerts. Do not send passwords or unrequested sensitive files through ordinary email.", "If the incident is active or has disrupted important services, use the reporting route and telephone contact details published by TT-CSIRT. Do not wait to assemble every item on this list."] },
      { id: "roles-and-obligations", title: "Understand the different reporting routes", paragraphs: ["TT-CSIRT provides technical incident-response coordination and cyber security guidance. A report to TT-CSIRT is not the same as making a criminal complaint to the Trinidad and Tobago Police Service, and it does not automatically satisfy any separate regulatory, privacy, contractual, insurance or internal notification requirement.", "The applicable obligations depend on the organisation, information involved, sector and circumstances. Check the current primary legal or administrative sources that apply to your organisation and consult your legal or privacy adviser. This guide does not verify a general public-sector circular, a universal deadline or a blanket legal duty to notify TT-CSIRT; the exact source and scope would need to be confirmed before asserting one."] },
      { id: "after-submitting", title: "After submitting a report", paragraphs: ["Keep a copy of the details you submitted and add them to your internal incident record. Assign a contact who can answer follow-up questions and share new evidence through the channel TT-CSIRT advises. Tell your response team when the report was made and what information was provided so that technical, management and communications decisions are coordinated.", "Continue to manage the incident while awaiting a response: contain activity proportionately, preserve relevant evidence and document decisions. A report is a coordination step, not a substitute for your organisation's own investigation, recovery plan or assessment of separate notification duties."] }
    ],
    whenToReport: { text: "Use TT-CSIRT's secure intake form to submit the incident details you have. For urgent active incidents, use the contact information published by TT-CSIRT.", reportLinkText: "Open the TT-CSIRT incident reporting form", reportLinkHref: "/report-an-incident", emergencyPhone: "+1 (868) 625-7937" },
    relatedGuidance: [{ slug: "responding-to-a-suspected-cyber-incident", title: "Responding to a suspected cyber incident", description: "Coordinate containment, evidence preservation and recovery." }, { slug: "incident-reporting-escalation", title: "National incident reporting and escalation procedures", description: "Read related reporting and escalation guidance." }],
    sources: [{ title: "TT-CSIRT incident reporting service", url: "/report-an-incident", publisher: "TT-CSIRT", context: "Existing local incident-reporting route." }, { title: "TT-CSIRT incident response service", url: "/services/incident-response", publisher: "TT-CSIRT", context: "Local service information and response roles." }]
  },
  {
    slug: "business-email-compromise",
    title: "Prevent and respond to business email compromise",
    shortPurpose: "Practical controls to reduce payment diversion and account misuse, and steps to take when business email compromise is suspected.",
    audienceDescription: "Business owners, finance teams, accounts-payable staff, email administrators and incident responders.",
    audiences: ["organisations", "government"],
    audienceLabel: "Businesses and public bodies",
    category: "enterprise-defence",
    categoryLabel: "Enterprise defence",
    lastReviewed: "9 October 2026",
    provenanceNote: "General defensive practices adapted for organisations in Trinidad and Tobago using government technical guidance. Foreign legal duties and reporting statistics are not applied.",
    keyActions: ["Verify payment and supplier bank-detail changes using a known, independent contact route", "Require a second authorised approver for high-risk transfers", "Protect email with multi-factor authentication and review unusual mailbox rules", "Escalate suspected compromise promptly and preserve relevant records"],
    sections: [
      { id: "how-bec-works", title: "How business email compromise works", paragraphs: ["Business email compromise (BEC) uses impersonation, a compromised mailbox or a lookalike domain to persuade staff to transfer money, change supplier payment details or disclose information. Messages may fit an active transaction and appear to come from a senior colleague, lawyer or regular supplier. A familiar display name or an ongoing email thread does not prove the sender is genuine."] },
      { id: "prevent-payment-diversion", title: "Make payment changes harder to exploit", paragraphs: ["Verify any new or changed bank details through a second channel that is already trusted, such as a phone number in your supplier records. Do not use a number, link or reply address supplied in the change request. Ask a second authorised person to approve high-value or unusual transfers, and define a clear process for urgent exceptions.", "Train finance and procurement staff to pause when a message changes payment instructions, creates unusual urgency or asks them to bypass normal controls. Keep supplier contact details and approval records current, and reconcile payments promptly so an error can be escalated quickly."] },
      { id: "secure-email-accounts", title: "Protect and monitor email accounts", paragraphs: ["Use multi-factor authentication for email and administrator accounts. Apply strong, unique credentials and restrict access to mailbox administration. Keep email platforms and devices updated, and use available protections against spoofing and malicious links.", "Investigate unexpected forwarding rules, inbox rules that hide replies, delegated access, newly registered authentication methods, suspicious sign-ins and unusual message deletion. Review account activity after a suspected compromise and revoke active sessions or credentials where appropriate."] },
      { id: "respond-to-bec", title: "If you suspect business email compromise", paragraphs: ["Contact your IT or security team using a trusted channel. If a payment may have been diverted, contact your bank immediately using its known official contact details; prompt action may help them assess whether the transfer can be stopped or traced. Do not continue the suspect email conversation as your only verification route.", "Preserve the original messages and headers, timestamps, mailbox audit records, payment instructions and transaction details. Check whether other accounts, suppliers or conversations were affected. Reset compromised credentials, revoke sessions and review forwarding or delegation changes with your administrators. Report the cyber incident to TT-CSIRT for technical coordination. Consider a police report and check any other obligations that apply to your organisation."] }
    ],
    whenToReport: { text: "If an email account was compromised or a fraudulent payment request led to unauthorised access or transfer, report the cyber incident to TT-CSIRT. Contact your bank promptly about a suspected fraudulent transaction.", reportLinkText: "Report a cyber incident to TT-CSIRT", reportLinkHref: "/report-an-incident" },
    relatedGuidance: [{ slug: "phishing-scams", title: "Recognising and preventing phishing and social engineering scams", description: "Learn to identify deceptive messages and social engineering." }, { slug: "cyber-security-baseline", title: "Cyber security baseline for organisations and businesses", description: "Review broader organisational security controls." }],
    sources: [
      { title: "Email security best practices (ITSM.60.002)", url: "https://www.cyber.gc.ca/en/guidance/email-security-best-practices-itsm60002", publisher: "Canadian Centre for Cyber Security", context: "Technical email security controls used as a general defensive reference." },
      { title: "Business email compromise", url: "https://www.ic3.gov/PSA/2024/PSA240911", publisher: "Federal Bureau of Investigation", context: "Government guidance on BEC prevention and response." },
      { title: "TT-CSIRT phishing guidance", url: "https://ttcsirt.gov.tt/cybersecurity-advisory-phishing-scam-targeting-e-tax-users/", publisher: "TT-CSIRT", context: "Local example of phishing activity and awareness guidance." }
    ]
  },
  // 1. Cyber security baseline
  {
    slug: "cyber-security-baseline",
    title: "Cyber security baseline for organisations and businesses",
    shortPurpose:
      "A structured defensive baseline for enterprises and small-to-medium businesses in Trinidad and Tobago, structured around the NIST Cybersecurity Framework (CSF) 2.0 and NCSC 10 Steps to Cyber Security.",
    audienceDescription:
      "Chief Information Security Officers (CISOs), IT directors, risk managers, and business owners building or auditing an enterprise security programme.",
    audiences: ["organisations"],
    audienceLabel: "Organisations and businesses",
    category: "enterprise-defence",
    categoryLabel: "Enterprise defence",
    lastReviewed: "25 August 2026",
    provenanceNote:
      "Aligned with NIST Cybersecurity Framework (CSF) 2.0 core functions (Govern, Identify, Protect, Detect, Respond, Recover) and UK NCSC 10 Steps to Cyber Security.",
    keyActions: [
      "Establish executive governance and formalize cybersecurity risk management in enterprise board agendas",
      "Maintain a continuously updated hardware, software, and external asset inventory across all company networks",
      "Enforce phishing-resistant multi-factor authentication on all remote access gateways, cloud tenants, and privileged accounts",
      "Implement automated vulnerability scanning and apply security patches within risk-based time windows",
      "Develop and test an operational Cyber Security Incident Response Plan (CSIRP) at least annually",
    ],
    sections: [
      {
        id: "csf-governance",
        title: "Govern and Identify: Risk ownership and asset visibility",
        lead:
          "Cybersecurity is an enterprise risk management discipline, not solely a technical IT responsibility.",
        paragraphs: [
          "NIST CSF 2.0 introduced 'Govern' as a foundational function that coordinates all other defensive capabilities. Executive leadership and boards of directors must formally define the organisation's risk tolerance, assign security responsibilities, and allocate sufficient defensive budgets.",
          "You cannot defend what you do not know exists. Maintaining an accurate inventory of physical devices, virtual servers, software versions, cloud repositories, and third-party data connections is the fundamental prerequisite of effective defence.",
        ],
        subsections: [
          {
            title: "Asset management priorities",
            list: [
              "Maintain authoritative registers of all endpoint hardware, network switches, firewalls, and server assets",
              "Catalog all external internet-facing IP addresses, web domains, and cloud storage buckets",
              "Map critical business data flows, identifying where sensitive customer and operational information resides",
            ],
          },
        ],
      },
      {
        id: "csf-protect",
        title: "Protect: Perimeter defence, access control, and training",
        lead:
          "Protective safeguards limit the attack surface and prevent initial adversary footholds.",
        paragraphs: [
          "Organisations must enforce the principle of least privilege: employees and system accounts should only possess the minimum access permissions necessary to perform their daily duties.",
          "Network architecture should segment critical operational zones (such as financial databases and production machinery) away from general corporate workstations and guest Wi-Fi networks.",
        ],
        subsections: [
          {
            title: "Core protective controls",
            list: [
              "Mandatory Multi-Factor Authentication (MFA) across all email systems, cloud applications, and VPNs",
              "Endpoint Detection and Response (EDR) agents deployed on all corporate laptops, desktops, and servers",
              "Network boundary firewalls restricting inbound management ports (such as RDP 3389 and SSH 22)",
              "Regular cyber awareness briefings training employees to spot phishing messages and invoice fraud",
            ],
          },
        ],
      },
      {
        id: "csf-detect",
        title: "Detect: Anomaly monitoring and logging visibility",
        lead:
          "Timely discovery of cybersecurity events is essential to contain intrusions before attackers deploy ransomware or exfiltrate data.",
        paragraphs: [
          "Attackers often dwell within compromised corporate networks for days or weeks before executing overt destructive payloads. Centralized security log collection enables defenders to detect early reconnaissance, privilege escalation, and credential abuse.",
          "System clocks across all domain controllers, firewalls, and application servers must synchronize with a reliable Network Time Protocol (NTP) source to ensure event logs correlate accurately during forensic investigations.",
        ],
      },
      {
        id: "csf-respond-recover",
        title: "Respond and Recover: Operational resilience and continuity",
        lead:
          "Every modern enterprise must operate under the assumption that an incident will occur.",
        paragraphs: [
          "Having a documented, practiced Incident Response Plan enables staff to act decisively under pressure. The plan must establish internal escalation chains, communications guidelines, legal notification protocols, and direct escalation paths to TT-CSIRT.",
          "Disaster recovery capabilities must include verified, immutable backups tested through live restoration drills. Backups that have never been tested during simulated outage conditions cannot be considered reliable.",
        ],
      },
    ],
    checklist: {
      title: "Enterprise baseline implementation checklist",
      items: [
        {
          task: "Audit internet-facing attack surface",
          detail: "Scan external IPs to verify no exposed management ports (RDP, VNC, SMB) are directly accessible from the internet.",
          priority: "immediate",
        },
        {
          task: "Enforce MFA across all cloud tenants",
          detail: "Block legacy authentication protocols and require MFA for all administrative and standard user accounts.",
          priority: "immediate",
        },
        {
          task: "Verify offline, immutable backups",
          detail: "Confirm that critical database and system backups are isolated from network ransomware propagation.",
          priority: "high",
        },
        {
          task: "Establish Incident Response Plan",
          detail: "Document internal roles, contact lists, executive escalations, and reporting workflows to TT-CSIRT.",
          priority: "high",
        },
        {
          task: "Conduct employee phishing simulations",
          detail: "Run periodic phishing awareness exercises and provide non-punitive refresher training for staff.",
          priority: "standard",
        },
      ],
    },
    whenToReport: {
      text:
        "If your organisation identifies active malicious lateral movement, unauthorised domain administrative access, or suspected data exfiltration, notify TT-CSIRT promptly. Early notification enables our specialists to provide technical triage and cross-sector correlation.",
      emergencyPhone: "+1 (868) 625-7937",
      reportLinkText: "Engage TT-CSIRT incident response",
      reportLinkHref: "/services/incident-response",
    },
    relatedGuidance: [
      {
        slug: "ransomware-prevention-response",
        title: "Ransomware prevention, defence, and emergency response",
        description: "In-depth five-phase containment and recovery guide for ransomware outbreaks.",
      },
      {
        slug: "incident-response-planning",
        title: "Incident response planning and readiness for enterprises",
        description: "Structuring response teams, tabletop exercises, and severity classification.",
      },
      {
        slug: "vulnerability-management",
        title: "Vulnerability management and patching lifecycle",
        description: "Risk-based prioritization and continuous vulnerability scanning workflows.",
      },
    ],
    sources: [
      {
        title: "NIST Cybersecurity Framework (CSF) 2.0",
        url: "https://www.nist.gov/cyberframework",
        publisher: "National Institute of Standards and Technology",
        context: "Global standard for managing and reducing cybersecurity risk.",
      },
      {
        title: "UK NCSC 10 Steps to Cyber Security",
        url: "https://www.ncsc.gov.uk/collection/10-steps",
        publisher: "UK National Cyber Security Centre",
        context: "Authoritative guidance on establishing enterprise cyber resilience.",
      },
      {
        title: "NIST Small Business Cybersecurity Corner",
        url: "https://www.nist.gov/itl/smallbusinesscyber",
        publisher: "National Institute of Standards and Technology",
        context: "Practical cybersecurity planning resources tailored to small-and-medium enterprises.",
      },
    ],
  },

  // 2. Ransomware prevention & response
  {
    slug: "ransomware-prevention-response",
    title: "Ransomware prevention, defence, and emergency response",
    shortPurpose:
      "A complete procedural defence guide and emergency checklist for organisations in Trinidad and Tobago facing or defending against ransomware and double-extortion campaigns.",
    audienceDescription:
      "System administrators, incident response leads, IT managers, and enterprise executive teams.",
    audiences: ["organisations", "government", "technical"],
    audienceLabel: "Enterprises, public bodies, and technical teams",
    category: "enterprise-defence",
    categoryLabel: "Enterprise defence",
    lastReviewed: "28 August 2026",
    provenanceNote:
      "Directly incorporates TT-CSIRT official Ransomware Prevention and Response guidance and international frameworks from CISA #StopRansomware and NCSC.",
    keyActions: [
      "Isolate affected systems immediately by disconnecting network cables and turning off wireless adapters",
      "Do NOT reboot or power down compromised servers without capturing volatile RAM if trained responders are present",
      "Preserve immutable offline backups and take storage snapshots of critical volumes immediately",
      "Follow TT-CSIRT's official position: never pay ransoms, as payment does not guarantee decryption and fuels criminal enterprises",
      "Call TT-CSIRT emergency response immediately: +1 (868) 625-7937 or +1 (868) 299-8827",
    ],
    sections: [
      {
        id: "active-emergency-inset",
        title: "Emergency triage: First 15 minutes of an outbreak",
        lead:
          "If systems in your organisation are currently displaying ransom notes or file extensions are actively changing, execute these emergency actions immediately:",
        paragraphs: [
          "1. Physical network isolation: Unplug Ethernet cables from affected servers and workstations immediately. Disable Wi-Fi and Bluetooth. Do not rely solely on software firewalls.",
          "2. Do not power off servers: If technical forensics staff are available, keep systems running to preserve volatile memory (RAM) where encryption keys, active connections, and injector processes reside.",
          "3. Disconnect backup storage: Immediately sever network connections to all Network Attached Storage (NAS), backup servers, and cloud replication targets to prevent ransomware from wiping recovery catalogs.",
        ],
      },
      {
        id: "five-phase-response",
        title: "The five-phase procedural response framework",
        lead:
          "TT-CSIRT structures enterprise ransomware response into five disciplined sequential phases:",
        paragraphs: [
          "Following this systematic sequence ensures that containment is achieved before recovery attempts begin, preventing reinfection cycles.",
        ],
        subsections: [
          {
            title: "Phase 1: Detection and analysis",
            paragraphs: [
              "Confirm the infection scope and strain. Identify initial ransom notes, inspect security logs to locate the initial compromise vector (e.g. exposed RDP, exploited VPN gateway, or phishing email), and determine whether data exfiltration occurred prior to encryption.",
            ],
          },
          {
            title: "Phase 2: Containment",
            paragraphs: [
              "Halt adversary spread. Isolate affected network segments (VLANs), revoke compromised Active Directory domain credentials, disable external remote access pathways, and block command-and-control (C2) IP addresses and domains at the perimeter firewall.",
            ],
          },
          {
            title: "Phase 3: Extended analysis and eradication",
            paragraphs: [
              "Conduct digital forensics to identify persistence mechanisms (such as scheduled tasks, hidden user accounts, and web shells). Rebuild compromised operating systems from clean, verified gold images rather than attempting to clean infected host environments.",
            ],
          },
          {
            title: "Phase 4: Safe recovery",
            paragraphs: [
              "Restore operational services from verified, clean backup repositories. Ensure all systems are fully patched and security agents are functioning before reconnecting reconstructed networks to the internet. Monitor traffic closely for anomalous beaconing.",
            ],
          },
          {
            title: "Phase 5: Reporting, documentation, and lessons learned",
            paragraphs: [
              "Submit a comprehensive incident report to TT-CSIRT and relevant statutory bodies. Conduct an executive post-incident review to address identified defensive gaps and update security policies.",
            ],
          },
        ],
      },
      {
        id: "position-on-ransoms",
        title: "TT-CSIRT official position on ransom payments",
        lead:
          "TT-CSIRT strongly advises against paying ransoms to cyber criminal syndicates.",
        paragraphs: [
          "Paying a ransom does not guarantee that attackers will provide a working decryption tool, nor does it prevent them from leaking or selling exfiltrated data on dark web leak sites.",
          "Ransom payments directly fund international transnational organized crime, validate the criminal business model, and frequently result in the victim organisation being targeted again by other extortion crews.",
        ],
      },
      {
        id: "prevention-hardening",
        title: "Preventive defence and anti-ransomware architecture",
        lead:
          "Most ransomware attacks can be prevented through robust preventive hygiene:",
        paragraphs: [
          "Attackers rely heavily on compromised credentials and unpatched perimeter vulnerabilities to gain initial network access before executing ransomware.",
        ],
        subsections: [
          {
            title: "Essential preventive controls",
            list: [
              "Never expose Remote Desktop Protocol (RDP) directly to the public internet; require VPN + MFA",
              "Implement robust network segmentation between IT workstations and server infrastructure",
              "Disable or restrict administrative tools frequently abused by ransomware (PowerShell, PsExec, WMI) across standard end-user machines",
              "Maintain immutable, air-gapped backups that cannot be modified or deleted by compromised domain admin credentials",
            ],
          },
        ],
      },
    ],
    checklist: {
      title: "Ransomware response procedural checklist",
      items: [
        {
          task: "Disconnect network cables from affected machines",
          detail: "Sever all physical Ethernet and Wi-Fi links immediately to stop lateral propagation.",
          priority: "immediate",
        },
        {
          task: "Isolate backup repositories",
          detail: "Physically disconnect backup drives and revoke cloud storage administrative keys.",
          priority: "immediate",
        },
        {
          task: "Notify TT-CSIRT emergency response",
          detail: "Contact TT-CSIRT via phone (+1 868 625-7937) for operational guidance and threat indicators.",
          priority: "immediate",
        },
        {
          task: "Preserve sample ransom notes and encrypted files",
          detail: "Save ransom notes and file samples to an isolated flash drive for ransomware strain identification.",
          priority: "high",
        },
        {
          task: "Reset all administrative credentials",
          detail: "Force password resets and session revocations across all domain and service accounts.",
          priority: "high",
        },
        {
          task: "Verify backup integrity before restoration",
          detail: "Ensure backup snapshots predate the adversary's initial network breach.",
          priority: "high",
        },
      ],
    },
    whenToReport: {
      text:
        "Report all active ransomware infections immediately to TT-CSIRT. Our national response team provides technical containment guidance, indicators of compromise (IOCs), strain identification, and coordination with law enforcement. We maintain 24/7 emergency response channels for national critical infrastructure and enterprise outbreaks.",
      emergencyPhone: "+1 (868) 625-7937 / +1 (868) 299-8827",
      reportLinkText: "Submit an emergency ransomware report",
      reportLinkHref: "/services/incident-response",
    },
    relatedGuidance: [
      {
        slug: "backup-recovery",
        title: "Resilient backup and disaster recovery architecture",
        description: "Architecting immutable, ransomware-resistant backup repositories.",
      },
      {
        slug: "incident-response-planning",
        title: "Incident response planning and readiness for enterprises",
        description: "Preparing incident management teams and escalation protocols in advance.",
      },
      {
        slug: "vulnerability-management",
        title: "Vulnerability management and patching lifecycle",
        description: "Closing public-facing vulnerabilities exploited by ransomware operators.",
      },
    ],
    sources: [
      {
        title: "TT-CSIRT Ransomware Prevention and Response Guidance",
        url: "/guidance/ransomware-defence-and-response",
        publisher: "Trinidad and Tobago Cyber Security Incident Response Team",
        context: "Official national procedural guide and policy on ransomware outbreaks.",
      },
      {
        title: "CISA #StopRansomware Guide",
        url: "https://www.cisa.gov/stopransomware",
        publisher: "Cybersecurity and Infrastructure Security Agency",
        context: "Authoritative multi-agency ransomware containment and response playbook.",
      },
      {
        title: "NCSC Mitigating Malware and Ransomware Attacks",
        url: "https://www.ncsc.gov.uk/guidance/mitigating-malware-and-ransomware-attacks",
        publisher: "UK National Cyber Security Centre",
        context: "Comprehensive architectural and defensive controls against ransomware.",
      },
    ],
  },

  // 3. Incident response planning
  {
    slug: "incident-response-planning",
    title: "Incident response planning and readiness for enterprises",
    shortPurpose:
      "A structured guide for developing, testing, and operationalizing an enterprise Cyber Security Incident Response Plan (CSIRP) in alignment with NIST SP 800-61 Rev. 3 and TT-CSIRT coordination standards.",
    audienceDescription:
      "Enterprise security leaders, IT directors, legal counsel, and business continuity coordinators.",
    audiences: ["organisations", "government"],
    audienceLabel: "Organisations and management",
    category: "enterprise-defence",
    categoryLabel: "Enterprise defence",
    lastReviewed: "15 August 2026",
    provenanceNote:
      "Synthesized from NIST Special Publication 800-61 Rev. 3 (Incident Response Recommendations and Considerations for Cybersecurity Risk Management) and TT-CSIRT incident handling protocols.",
    keyActions: [
      "Draft and formally approve a comprehensive Cyber Security Incident Response Plan (CSIRP)",
      "Establish a multidisciplinary Computer Security Incident Response Team (CSIRT) including IT, legal, communications, and executive leadership",
      "Define objective incident severity classification levels and operational escalation triggers",
      "Maintain offline, out-of-band communications channels (e.g. encrypted messaging, printed contact trees)",
      "Conduct scenario-based tabletop simulation exercises at least annually with executive participation",
    ],
    sections: [
      {
        id: "plan-structure",
        title: "Structuring an effective incident response plan",
        lead:
          "An incident response plan is an operational playbook, not a theoretical policy document.",
        paragraphs: [
          "During an active breach, technical staff and executives experience extreme cognitive stress. A well-structured plan removes ambiguity by defining precise roles, responsibilities, decision thresholds, and reporting requirements.",
          "The plan must establish who has the operational authority to disconnect business systems, sever internet connections, or take production services offline during an emergency.",
        ],
      },
      {
        id: "roles-responsibilities",
        title: "Assembling the incident response team",
        lead:
          "Cyber incident response requires capabilities that extend far beyond the IT department.",
        paragraphs: [
          "An effective team includes technical responders, business continuity managers, legal advisors, public relations liaisons, and human resources representatives.",
        ],
        subsections: [
          {
            title: "Key response functions",
            list: [
              "Incident Commander: Leads operational response, coordinates technical teams, and directs resource allocation",
              "Technical Lead: Directs forensic analysis, network containment, log review, and system eradication",
              "Communications Lead: Manages internal employee notifications and coordinates public/media statements",
              "Legal & Compliance Lead: Assesses statutory reporting obligations (e.g. under the Data Protection Act) and contractual vendor requirements",
            ],
          },
        ],
      },
      {
        id: "severity-classification",
        title: "Incident severity classification",
        lead:
          "Categorizing incidents consistently ensures appropriate management escalation and resource mobilization.",
        paragraphs: [
          "TT-CSIRT recommends adopting standard severity tiers based on operational impact and data sensitivity:",
        ],
        subsections: [
          {
            title: "Standard severity levels",
            list: [
              "Low: Minor policy violation, isolated malware blocked by antivirus, no business disruption",
              "Medium: Unauthorised access to non-critical internal systems, localised service degradation",
              "High: Active ransomware execution, root/domain admin compromise, confirmed unauthorised exfiltration of sensitive citizen personal data",
              "Critical: Complete outage of core national infrastructure services, widespread destructive malware across government or banking networks",
            ],
          },
        ],
      },
      {
        id: "tabletop-exercises",
        title: "Testing readiness with tabletop exercises",
        lead:
          "An unpracticed incident response plan is an untested risk.",
        paragraphs: [
          "Conducting structured tabletop exercises allows organisations to rehearse real-world breach scenarios, such as a ransomware outbreak or an insider data leak, in a safe learning environment.",
          "Tabletop simulations expose gaps in out-of-band communication, reveal unclear decision authorities, and build muscle memory across technical and executive teams.",
        ],
      },
    ],
    checklist: {
      title: "Incident response readiness checklist",
      items: [
        {
          task: "Publish emergency contact roster",
          detail: "Maintain printed and offline digital copies of all internal responders, external forensic retainers, legal counsel, and TT-CSIRT hotlines.",
          priority: "immediate",
        },
        {
          task: "Define operational shutdown authorities",
          detail: "Document exactly who has authority to take enterprise systems or internet gateways offline during a breach.",
          priority: "immediate",
        },
        {
          task: "Establish out-of-band communication",
          detail: "Ensure the response team can communicate securely if corporate email and Microsoft Teams are compromised.",
          priority: "high",
        },
        {
          task: "Schedule annual tabletop exercise",
          detail: "Facilitate a scenario-based breach simulation with both technical leads and executive leadership.",
          priority: "high",
        },
      ],
    },
    whenToReport: {
      text:
        "Incorporate TT-CSIRT directly into your operational response plan. In the event of a significant cyber security event, early engagement enables our national team to assist with threat correlation, forensic guidance, and sector warning notices.",
      emergencyPhone: "+1 (868) 625-7937",
      reportLinkText: "Engage TT-CSIRT incident handling",
      reportLinkHref: "/services/incident-response",
    },
    relatedGuidance: [
      {
        slug: "incident-reporting-escalation",
        title: "National incident reporting and escalation procedures",
        description: "Official procedures for escalating security events to national authorities.",
      },
      {
        slug: "ransomware-prevention-response",
        title: "Ransomware prevention, defence, and emergency response",
        description: "Specific procedural steps for managing active extortion attacks.",
      },
      {
        slug: "logging-monitoring",
        title: "Centralized logging and security monitoring standards",
        description: "Ensuring forensic readiness and audit log retention for investigations.",
      },
    ],
    sources: [
      {
        title: "NIST SP 800-61 Rev. 3: Incident Response Recommendations",
        url: "https://csrc.nist.gov/pubs/sp/800/61/r3/final",
        publisher: "National Institute of Standards and Technology",
        context: "Authoritative guidance on cybersecurity incident handling and risk management.",
      },
      {
        title: "NCSC Incident Management Guidance",
        url: "https://www.ncsc.gov.uk/collection/incident-management",
        publisher: "UK National Cyber Security Centre",
        context: "Best practices for planning, containing, and learning from security incidents.",
      },
      {
        title: "TT-CSIRT Incident Response Services",
        url: "/services/incident-response",
        publisher: "Trinidad and Tobago Cyber Security Incident Response Team",
        context: "National coordination, triage, and advisory capabilities.",
      },
    ],
  },

  // 4. Vulnerability management
  {
    slug: "vulnerability-management",
    title: "Vulnerability management and patching lifecycle",
    shortPurpose:
      "A proactive engineering and operational guide to discovering, prioritizing, testing, and remediating software flaws and configuration weaknesses across enterprise assets.",
    audienceDescription:
      "Security engineers, system administrators, network managers, and enterprise IT leaders.",
    audiences: ["organisations", "technical"],
    audienceLabel: "Technical teams and security engineers",
    category: "enterprise-defence",
    categoryLabel: "Enterprise defence",
    lastReviewed: "22 August 2026",
    provenanceNote:
      "Synthesized from UK NCSC Vulnerability Management guidance, NIST SP 800-40 Rev. 4 (Guide to Enterprise Patch Management), and CISA Known Exploited Vulnerabilities (KEV) operational directives.",
    keyActions: [
      "Deploy automated vulnerability scanning across internal subnets and external perimeter domains weekly",
      "Prioritise patch remediation based on active in-the-wild exploitation rather than CVSS base scores alone",
      "Establish strict remediation timeframes: 48 hours for critical/actively exploited vulnerabilities, 14 days for high severity",
      "Decommission or isolate legacy operating systems and end-of-life (EOL) software that no longer receive vendor patches",
      "Maintain a staging environment to validate patch stability before deploying to production infrastructure",
    ],
    sections: [
      {
        id: "vulnerability-lifecycle",
        title: "The five stages of the vulnerability management lifecycle",
        lead:
          "Effective vulnerability management is a continuous operational cycle, not a one-off audit.",
        paragraphs: [
          "Organisations must establish a repeatable process spanning five distinct stages: Discovery (identifying assets and software flaws), Prioritization (determining which flaws pose real risks), Testing (validating updates in non-production environments), Remediation (applying patches or compensating controls), and Verification (confirming successful flaw resolution).",
        ],
      },
      {
        id: "risk-based-prioritization",
        title: "Moving beyond raw CVSS scores: Risk-based prioritization",
        lead:
          "Treating every Common Vulnerability Scoring System (CVSS) 9.0+ score as an equal emergency overwhelms IT teams.",
        paragraphs: [
          "A CVSS base score reflects theoretical severity, not immediate real-world exploitability. Modern security engineering prioritises vulnerabilities based on threat intelligence and asset exposure.",
          "Defenders should cross-reference internal findings against public databases such as the CISA Known Exploited Vulnerabilities (KEV) catalog and exploit prediction metrics (EPSS). A CVSS 7.5 vulnerability with an active public exploit targeting an internet-facing VPN gateway poses vastly higher risk than an internal CVSS 9.8 flaw with no known weaponized exploit.",
        ],
      },
      {
        id: "emergency-patching",
        title: "Emergency zero-day response procedures",
        lead:
          "When a zero-day vulnerability is announced with active in-the-wild exploitation, standard monthly patch cycles must be bypassed.",
        paragraphs: [
          "Your organisation must maintain an expedited emergency patching protocol capable of deploying tested vendor mitigations or temporary firewall blocks within 24 to 48 hours.",
          "When vendor patches are not yet available, apply documented compensating controls, such as disabling vulnerable features, restricting inbound IP access or deploying Web Application Firewall (WAF) virtual patching rules.",
        ],
      },
    ],
    checklist: {
      title: "Vulnerability management operational checklist",
      items: [
        {
          task: "Subscribe to TT-CSIRT Security Advisories",
          detail: "Receive daily alerts on critical emerging vulnerabilities affecting systems used in Trinidad and Tobago.",
          priority: "immediate",
        },
        {
          task: "Scan external perimeter weekly",
          detail: "Perform automated vulnerability assessments of all public IP addresses and web gateways.",
          priority: "immediate",
        },
        {
          task: "Define Remediation Service Level Agreements (SLAs)",
          detail: "Enforce formal timelines: Critical/Exploited within 48 hours; High within 14 days; Medium within 30 days.",
          priority: "high",
        },
        {
          task: "Decommission legacy unsupported software",
          detail: "Isolate or replace operating systems that have reached end-of-life (e.g. Windows Server 2012, CentOS 7).",
          priority: "high",
        },
      ],
    },
    whenToReport: {
      text:
        "If you discover evidence of active exploitation of a zero-day vulnerability within your systems or identify widespread weaponization of a flaw affecting other national entities, report technical details to TT-CSIRT for national threat correlation.",
      emergencyPhone: "+1 (868) 625-7937",
      reportLinkText: "Submit vulnerability intelligence to TT-CSIRT",
      reportLinkHref: "/services/incident-response",
    },
    relatedGuidance: [
      {
        slug: "internet-facing-service-security",
        title: "Security controls for internet-facing systems and public gateways",
        description: "Hardening perimeter gateways and public APIs against external attacks.",
      },
      {
        slug: "secure-configuration",
        title: "Secure system configuration and architecture baselines",
        description: "Standardizing hardened baseline configurations across enterprise systems.",
      },
      {
        slug: "ransomware-prevention-response",
        title: "Ransomware prevention, defence, and emergency response",
        description: "Closing vulnerability entry points exploited by ransomware operators.",
      },
    ],
    sources: [
      {
        title: "NCSC Vulnerability Management Guidance",
        url: "https://www.ncsc.gov.uk/guidance/vulnerability-management",
        publisher: "UK National Cyber Security Centre",
        context: "Comprehensive principles for identifying and managing software flaws.",
      },
      {
        title: "NIST SP 800-40 Rev. 4: Guide to Enterprise Patch Management",
        url: "https://csrc.nist.gov/pubs/sp/800/40/r4/final",
        publisher: "National Institute of Standards and Technology",
        context: "Authoritative engineering guidance on enterprise patch management planning.",
      },
      {
        title: "CISA Known Exploited Vulnerabilities Catalog",
        url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
        publisher: "Cybersecurity and Infrastructure Security Agency",
        context: "Authoritative list of actively exploited vulnerabilities requiring immediate action.",
      },
    ],
  },

  // 5. Secure remote access
  {
    slug: "secure-remote-access",
    title: "Secure remote access and hybrid work protection",
    shortPurpose:
      "Architectural principles and configuration standards for securing remote and hybrid workforces through Zero Trust Network Access (ZTNA), hardened VPN concentrators, and device posture verification.",
    audienceDescription:
      "Network engineers, infrastructure architects, sysadmins, and IT security directors.",
    audiences: ["organisations", "technical"],
    audienceLabel: "IT administrators and network engineers",
    category: "enterprise-defence",
    categoryLabel: "Enterprise defence",
    lastReviewed: "10 August 2026",
    provenanceNote:
      "Synthesized from NIST SP 800-46 Rev. 2 (Guide to Enterprise Telework, Remote Access, and BYOD Security) and UK NCSC Remote Access Architecture guidance.",
    keyActions: [
      "Mandate phishing-resistant multi-factor authentication on all remote access gateways with no bypass exceptions",
      "Eliminate direct, unauthenticated inbound access to internal network shares and management portals",
      "Adopt Zero Trust Network Access (ZTNA) principles to grant granular application access rather than broad subnet access",
      "Implement endpoint health and posture checking before permitting remote machines to connect to corporate systems",
      "Disable legacy, unencrypted remote protocols (Telnet, plain HTTP, unhardened VNC) across external boundaries",
    ],
    sections: [
      {
        id: "transitioning-to-zero-trust",
        title: "Transitioning from legacy VPNs to Zero Trust access",
        lead:
          "Traditional VPN architectures grant connected devices broad Layer-3 access to entire corporate subnets upon successful login.",
        paragraphs: [
          "If a remote worker's laptop is compromised by malware or credential-stealing Trojans, a traditional VPN allows the attacker to move laterally across the entire corporate network.",
          "Zero Trust Network Access (ZTNA) replaces broad network-level access with precise application-level micro-segmentation. Users are granted access only to the specific internal web portals or databases required for their role, leaving other corporate assets invisible.",
        ],
      },
      {
        id: "vpn-hardening",
        title: "Hardening enterprise VPN concentrators and gateways",
        lead:
          "VPN appliances and edge firewalls are among the primary targets exploited by state-sponsored and criminal threat groups.",
        paragraphs: [
          "Because remote access appliances reside on the network perimeter, any vulnerability allows unauthenticated attackers to compromise internal networks.",
        ],
        subsections: [
          {
            title: "Mandatory gateway configurations",
            list: [
              "Enforce MFA across all administrative and user profiles; never permit single-factor password authentication",
              "Keep VPN appliance firmware updated to the latest vendor release; apply security hotfixes within 24 hours of release",
              "Disable unneeded features such as web-based clientless portals and legacy authentication protocols (PAP, MS-CHAP)",
              "Restrict administrative access to VPN management consoles to internal management subnets or dedicated jump boxes",
            ],
          },
        ],
      },
      {
        id: "endpoint-posture",
        title: "Verifying endpoint health and BYOD risks",
        lead:
          "Allowing unmanaged personal devices (Bring Your Own Device - BYOD) to connect to internal enterprise applications introduces significant malware risk.",
        paragraphs: [
          "Organisations should deploy Mobile Device Management (MDM) or Mobile Application Management (MAM) solutions to enforce baseline security controls on all devices accessing corporate data.",
          "Enforce posture checks verifying that the connecting machine has disk encryption enabled, is running an up-to-date operating system, and maintains active, healthy endpoint detection agents.",
        ],
      },
    ],
    checklist: {
      title: "Remote access security checklist",
      items: [
        {
          task: "Enforce MFA on all remote gateways",
          detail: "Ensure zero users are permitted to authenticate via VPN or remote portals using a single password factor.",
          priority: "immediate",
        },
        {
          task: "Audit VPN appliance firmware",
          detail: "Verify gateway devices are running current firmware releases patched against known CVEs.",
          priority: "immediate",
        },
        {
          task: "Disable split tunneling for high-risk users",
          detail: "Route sensitive traffic through corporate security inspection appliances where appropriate.",
          priority: "high",
        },
        {
          task: "Implement device posture checks",
          detail: "Block remote connections from endpoints with out-of-date OS versions or disabled antivirus agents.",
          priority: "high",
        },
      ],
    },
    whenToReport: {
      text:
        "If your organisation detects suspicious foreign IP connections authenticating successfully to corporate VPNs, unusual concurrent logins, or brute-force sprays targeting remote gateways, report the indicators to TT-CSIRT.",
      emergencyPhone: "+1 (868) 625-7937",
      reportLinkText: "Report unauthorised remote access attempts",
      reportLinkHref: "/services/incident-response",
    },
    relatedGuidance: [
      {
        slug: "account-security",
        title: "Personal account security and multi-factor authentication",
        description: "Enforcing enterprise MFA and passkey authentication baselines.",
      },
      {
        slug: "vulnerability-management",
        title: "Vulnerability management and patching lifecycle",
        description: "Patching critical vulnerabilities on remote access gateways.",
      },
      {
        slug: "cyber-security-baseline",
        title: "Cyber security baseline for organisations and businesses",
        description: "Foundational enterprise perimeter and access management.",
      },
    ],
    sources: [
      {
        title: "NIST SP 800-46 Rev. 2: Guide to Enterprise Telework and Remote Access",
        url: "https://csrc.nist.gov/pubs/sp/800/46/r2/final",
        publisher: "National Institute of Standards and Technology",
        context: "Comprehensive architectural security recommendations for remote work environments.",
      },
      {
        title: "NCSC Remote Access Guidance",
        url: "https://www.ncsc.gov.uk/guidance/remote-access",
        publisher: "UK National Cyber Security Centre",
        context: "Defensive design principles for securing remote connectivity and hybrid work.",
      },
    ],
  },

  // 6. Supply-chain security
  {
    slug: "supply-chain-security",
    title: "Third-party and cyber supply-chain risk management",
    shortPurpose:
      "A strategic and procurement guide to managing cyber risks stemming from third-party suppliers, IT vendors, software developers, and Managed Service Providers (MSPs).",
    audienceDescription:
      "Procurement officers, enterprise risk managers, legal counsel, and Chief Information Security Officers (CISOs).",
    audiences: ["organisations", "government"],
    audienceLabel: "Procurement, legal, and security leaders",
    category: "enterprise-defence",
    categoryLabel: "Enterprise defence",
    lastReviewed: "19 August 2026",
    provenanceNote:
      "Aligned with UK NCSC Supply Chain Security collection (12 Principles) and NIST Cybersecurity Framework (CSF) 2.0 Cybersecurity Supply Chain Risk Management (C-SCRM) guidelines.",
    keyActions: [
      "Incorporate mandatory cybersecurity minimum standards into all vendor contracts and master service agreements",
      "Assess supplier cyber hygiene before granting network access or sharing sensitive organisational data",
      "Enforce strict least-privilege access for Managed Service Providers (MSPs) and external IT contractors",
      "Require multi-factor authentication and dedicated jump hosts for all vendor administrative sessions",
      "Establish contractual requirements for suppliers to notify you within 24 to 48 hours of any breach affecting your data",
    ],
    sections: [
      {
        id: "understanding-supply-chain-risk",
        title: "Understanding third-party and supply-chain threats",
        lead:
          "Modern enterprises rely heavily on external software vendors, cloud providers, and managed IT services.",
        paragraphs: [
          "Threat actors recognize that well-defended enterprises are often difficult to penetrate directly. Consequently, attackers target smaller, less secure suppliers who possess privileged administrative connections or access to customer databases.",
          "A compromise at a single IT service provider can cascade into hundreds of downstream client organisations across Trinidad and Tobago.",
        ],
      },
      {
        id: "twelve-principles",
        title: "Key principles of cyber supply-chain risk management",
        lead:
          "Managing third-party risk requires integrating security controls into every stage of the vendor lifecycle:",
        paragraphs: [
          "Grounded in UK NCSC and NIST CSF 2.0 C-SCRM guidance, organisations should structure supplier governance around three operational phases:",
        ],
        subsections: [
          {
            title: "1. Due diligence and procurement",
            list: [
              "Conduct pre-contract cybersecurity assessments evaluating the vendor's data handling policies and security certifications",
              "Classify suppliers into risk tiers based on data sensitivity and network access privileges",
              "Incorporate mandatory breach notification clauses, audit rights, and data return/destruction requirements into legal contracts",
            ],
          },
          {
            title: "2. Operational access control",
            list: [
              "Never provide vendors with unrestricted, persistent VPN access into your primary network subnets",
              "Require external contractors to authenticate through managed jump servers with session recording and mandatory MFA",
              "Immediately terminate vendor accounts upon project completion or employee departure",
            ],
          },
          {
            title: "3. Continuous monitoring and review",
            list: [
              "Re-evaluate critical vendor security postures annually or whenever major infrastructure changes occur",
              "Validate that suppliers maintain their own tested disaster recovery and incident response capabilities",
            ],
          },
        ],
      },
      {
        id: "msp-governance",
        title: "Governing Managed Service Providers (MSPs)",
        lead:
          "MSPs frequently maintain elevated administrative credentials across multiple client domains.",
        paragraphs: [
          "To safeguard both your organisation and your provider, enforce strict governance around remote management tools (RMM). Verify that your MSP enforces MFA internally for all technicians and maintains tamper-resistant audit logs of all remote administrative sessions.",
        ],
      },
    ],
    checklist: {
      title: "Supplier risk governance checklist",
      items: [
        {
          task: "Inventory all third-party connections",
          detail: "Document all vendors, contractors, and cloud platforms with direct access to internal systems or sensitive data.",
          priority: "immediate",
        },
        {
          task: "Audit vendor accounts and credentials",
          detail: "Disable dormant contractor accounts and eliminate shared administrative logins used by external vendors.",
          priority: "immediate",
        },
        {
          task: "Standardize contract security clauses",
          detail: "Work with legal counsel to embed mandatory incident notification deadlines (within 24-48 hours) into vendor contracts.",
          priority: "high",
        },
        {
          task: "Restrict vendor access to jump hosts",
          detail: "Route third-party maintenance sessions through dedicated bastion hosts with full session logging.",
          priority: "high",
        },
      ],
    },
    whenToReport: {
      text:
        "If a key supplier, managed service provider, or software vendor informs you of a cybersecurity compromise that may have exposed your organisational systems or data, notify TT-CSIRT immediately so we can assess wider national exposure.",
      emergencyPhone: "+1 (868) 625-7937",
      reportLinkText: "Report a third-party supply chain incident",
      reportLinkHref: "/services/incident-response",
    },
    relatedGuidance: [
      {
        slug: "data-protection-security",
        title: "Data protection and security under Trinidad and Tobago law",
        description: "Legal obligations when sharing citizen personal data with external processors.",
      },
      {
        slug: "secure-remote-access",
        title: "Secure remote access and hybrid work protection",
        description: "Restricting external vendor VPN connections and enforcing Zero Trust controls.",
      },
      {
        slug: "cyber-security-baseline",
        title: "Cyber security baseline for organisations and businesses",
        description: "Enterprise governance and third-party risk management.",
      },
    ],
    sources: [
      {
        title: "NCSC Supply Chain Security Guidance (12 Principles)",
        url: "https://www.ncsc.gov.uk/collection/supply-chain-security",
        publisher: "UK National Cyber Security Centre",
        context: "Authoritative framework for managing cyber risk across complex supply chains.",
      },
      {
        title: "NIST CSF 2.0: Cybersecurity Supply Chain Risk Management",
        url: "https://www.nist.gov/cyberframework",
        publisher: "National Institute of Standards and Technology",
        context: "Core organisational outcomes for identifying and managing third-party risks.",
      },
      {
        title: "CISA ICT Supply Chain Risk Management Toolkit",
        url: "https://www.cisa.gov/resources-tools/resources/ict-supply-chain-risk-management-toolkit",
        publisher: "Cybersecurity and Infrastructure Security Agency",
        context: "Practical vendor evaluation and procurement tools.",
      },
    ],
  },

  // 7. Data protection & security (Trinidad and Tobago Data Protection Act)
  {
    slug: "data-protection-security",
    title: "Data protection and security under Trinidad and Tobago law",
    shortPurpose:
      "A compliance and technical safeguards guide explaining the statutory obligations of public and private bodies processing personal information under the Trinidad and Tobago Data Protection Act, Chap. 22:04.",
    audienceDescription:
      "Data protection officers, corporate legal counsel, compliance managers, and enterprise IT leaders.",
    audiences: ["organisations", "government"],
    audienceLabel: "Data controllers, legal officers, and IT teams",
    category: "enterprise-defence",
    categoryLabel: "Enterprise defence",
    lastReviewed: "1 September 2026",
    provenanceNote:
      "Authoritatively derived from the Trinidad and Tobago Data Protection Act (DPA), Chap. 22:04, official TT-CSIRT data security guidance, and technical privacy engineering principles.",
    keyActions: [
      "Uphold the General Privacy Principles defined under Trinidad and Tobago law when collecting or processing citizen data",
      "Implement robust technical safeguards (encryption in transit and at rest) to protect personal records against unauthorised disclosure",
      "Enforce strict data minimization: collect only personal information strictly necessary for the stated lawful purpose",
      "Establish formal data retention and secure destruction schedules for electronic and physical records",
      "Develop a documented data breach notification protocol to assess harm and notify affected individuals and regulatory authorities",
    ],
    sections: [
      {
        id: "statutory-foundation",
        title: "The statutory framework: Data Protection Act, Chap. 22:04",
        lead:
          "In Trinidad and Tobago, the handling of personal data is governed by the Data Protection Act (DPA), Chap. 22:04.",
        paragraphs: [
          "The DPA establishes statutory safeguards designed to protect personal privacy and ensure that public bodies and private commercial enterprises handle personal information lawfully, transparently, and securely.",
          "Organisations must distinguish between local statutory requirements under Trinidad and Tobago law and foreign regulations. Foreign frameworks such as the UK GDPR or US state laws do not apply automatically within Trinidad and Tobago, though international best practices provide valuable technical implementation guidance.",
        ],
      },
      {
        id: "general-privacy-principles",
        title: "The General Privacy Principles under the DPA",
        lead:
          "Every data controller in Trinidad and Tobago must structure their personal data systems to comply with the core General Privacy Principles:",
        paragraphs: [
          "These principles establish clear statutory boundaries around data collection, storage, and processing:",
        ],
        subsections: [
          {
            title: "Core statutory obligations",
            list: [
              "Lawfulness and fairness: Personal information must only be collected by fair and lawful means, with appropriate consent or under clear statutory authority",
              "Purpose specification: The purpose for which personal information is collected must be explicitly identified at or before the time of collection",
              "Data minimization: The collection of personal information must be limited to that which is strictly necessary for the identified purposes",
              "Accuracy: Personal information must be accurate, complete, and kept up to date as necessary for its intended use",
              "Storage limitation: Personal information must not be retained longer than necessary to satisfy the purpose for which it was collected",
              "Security safeguards: Personal information must be protected by reasonable security safeguards against unauthorised access, loss, alteration, or destruction",
              "Openness and individual access: Individuals have the right to request access to their personal information and request corrections if inaccurate",
            ],
          },
        ],
      },
      {
        id: "technical-safeguards",
        title: "Required technical and organisational safeguards",
        lead:
          "Policy declarations alone do not satisfy the statutory requirement for reasonable security safeguards.",
        paragraphs: [
          "Organisations handling citizen records must implement robust technical controls proportional to the sensitivity of the data:",
        ],
        subsections: [
          {
            title: "Technical baseline recommendations",
            list: [
              "Encryption at rest: Encrypt customer databases, laptop hard drives, and portable storage media using industry-standard algorithms (e.g. AES-256)",
              "Encryption in transit: Enforce TLS 1.3 encryption across all public web portals and API endpoints transferring personal details",
              "Role-based access controls (RBAC): Restrict database queries so staff can only access records relevant to their immediate operational tasks",
              "Immutable audit trails: Log every access, modification, and export of sensitive personal records to detect unauthorised insider snooping",
            ],
          },
        ],
      },
      {
        id: "breach-handling",
        title: "Managing personal data breaches",
        lead:
          "When personal datasets are compromised through cyber intrusion, accidental disclosure, or device theft, organisations must execute a structured breach protocol.",
        paragraphs: [
          "Contain the incident immediately to halt ongoing data leakage. Assess the severity of potential harm to affected citizens (such as identity theft, financial fraud, or reputational damage).",
          "Where a cyber breach involves criminal hacking or extortion, notify TT-CSIRT and the TTPS Fraud Squad promptly for technical containment and forensic investigation.",
        ],
      },
    ],
    checklist: {
      title: "Data protection and privacy compliance checklist",
      items: [
        {
          task: "Conduct data mapping and inventory",
          detail: "Identify all databases, spreadsheets, and cloud repositories storing citizen or employee personal data.",
          priority: "immediate",
        },
        {
          task: "Encrypt all portable devices and backups",
          detail: "Verify full-disk encryption (BitLocker, FileVault) on all corporate laptops and backup storage media.",
          priority: "immediate",
        },
        {
          task: "Enforce purpose limitation in application forms",
          detail: "Ensure citizen intake forms clearly disclose why personal information is collected and how it will be used.",
          priority: "high",
        },
        {
          task: "Implement role-based database permissions",
          detail: "Revoke widespread administrative query access to production databases holding citizen records.",
          priority: "high",
        },
        {
          task: "Draft data breach response playbook",
          detail: "Establish internal workflows to triage, investigate, and document security breaches involving personal data.",
          priority: "standard",
        },
      ],
    },
    whenToReport: {
      text:
        "If your organisation suffers a cyber attack resulting in unauthorised access, theft, or public disclosure of citizen personal data, engage TT-CSIRT immediately for incident response and technical mitigation support.",
      emergencyPhone: "+1 (868) 625-7937",
      reportLinkText: "Report a data security breach",
      reportLinkHref: "/services/incident-response",
    },
    relatedGuidance: [
      {
        slug: "supply-chain-security",
        title: "Third-party and cyber supply-chain risk management",
        description: "Safeguarding personal data transferred to third-party processors and cloud hosts.",
      },
      {
        slug: "cyber-security-baseline",
        title: "Cyber security baseline for organisations and businesses",
        description: "Baseline security controls supporting regulatory compliance.",
      },
      {
        slug: "incident-reporting-escalation",
        title: "National incident reporting and escalation procedures",
        description: "Formal reporting channels and notification expectations.",
      },
    ],
    sources: [
      {
        title: "Trinidad and Tobago Data Protection Act, Chap. 22:04",
        url: "https://rgd.legalaffairs.gov.tt/",
        publisher: "Government of the Republic of Trinidad and Tobago",
        context: "The governing statute establishing privacy rights and data protection standards in Trinidad and Tobago.",
      },
      {
        title: "TT-CSIRT Data Protection Guidelines",
        url: "/guidance/data-protection-and-privacy-safeguards",
        publisher: "Trinidad and Tobago Cyber Security Incident Response Team",
        context: "National guidance on technical safeguards for personal data.",
      },
      {
        title: "NIST Privacy Framework",
        url: "https://www.nist.gov/privacy-framework",
        publisher: "National Institute of Standards and Technology",
        context: "Enterprise tool for improving privacy through enterprise risk management.",
      },
    ],
  },

  // 8. Backup & recovery
  {
    slug: "backup-recovery",
    title: "Resilient backup and disaster recovery architecture",
    shortPurpose:
      "A technical infrastructure guide to designing, securing, and validating immutable backup systems capable of withstanding enterprise ransomware attacks and catastrophic system outages.",
    audienceDescription:
      "Storage engineers, system administrators, disaster recovery planners, and infrastructure architects.",
    audiences: ["organisations", "technical"],
    audienceLabel: "System administrators and storage engineers",
    category: "enterprise-defence",
    categoryLabel: "Enterprise defence",
    lastReviewed: "17 August 2026",
    provenanceNote:
      "Synthesized from UK NCSC Ransomware-Resistant Backups guidance, NIST SP 800-34 Rev. 1 (Contingency Planning Guide for Federal Information Systems), and TT-CSIRT disaster recovery baselines.",
    keyActions: [
      "Implement the 3-2-1 backup strategy: 3 copies of data, on 2 different media types, with 1 copy kept offline or immutable",
      "Isolate backup repositories from primary Active Directory authentication domains to prevent credential compromise",
      "Enable immutable storage locks (WORM - Write Once, Read Many) on cloud and storage snapshots",
      "Perform periodic full-system restoration drills to verify recovery time objectives (RTO) and recovery point objectives (RPO)",
      "Maintain offline, printed copies of your disaster recovery runbook and operational network diagrams",
    ],
    sections: [
      {
        id: "the-321-backup-rule",
        title: "Implementing the modernized 3-2-1 backup strategy",
        lead:
          "Traditional backups connected directly to the primary corporate network are prime targets for ransomware operators.",
        paragraphs: [
          "Modern threat actors actively search for backup software consoles (such as Veeam, Commvault, or native Windows Server Backup), locate stored catalogs, and delete or encrypt all backups prior to executing their primary payload.",
          "To withstand deliberate adversary targeting, organisations must modernize the classic 3-2-1 strategy by adding immutability and air-gapping.",
        ],
        subsections: [
          {
            title: "Modern 3-2-1-1-0 framework",
            list: [
              "3 copies of data: One production copy and at least two distinct backup versions",
              "2 different media types: For example, local fast disk storage and secure object cloud storage",
              "1 copy off-site: Geographically separated to survive local physical disasters (fires, flooding)",
              "1 copy immutable or air-gapped: Cryptographically locked so data cannot be modified or deleted by anyone, including domain admins, for a defined retention period",
              "0 errors after automated testing: Regular automated validation verifying that restored data is uncorrupted",
            ],
          },
        ],
      },
      {
        id: "access-isolation",
        title: "Isolating backup administrative credentials",
        lead:
          "A major architectural flaw in many enterprises is joining backup servers to the primary Active Directory domain.",
        paragraphs: [
          "If an attacker compromises the primary Domain Controller, they immediately gain full administrative access to all domain-joined backup appliances.",
          "Backup management servers must reside in dedicated, isolated management VLANs. They should utilize distinct local administrative credentials or a dedicated, separate authentication forest protected by hardware MFA keys.",
        ],
      },
      {
        id: "restoration-drills",
        title: "Conducting live restoration drills",
        lead:
          "A backup is only as good as your ability to restore it under pressure.",
        paragraphs: [
          "Many organisations discover during a crisis that their backups have been silently failing for months, or that the time required to restore multi-terabyte databases exceeds their acceptable business downtime.",
          "Establish measurable Recovery Time Objectives (RTO - how quickly systems must be operational) and Recovery Point Objectives (RPO - how much data loss is tolerable). Schedule quarterly restoration drills where servers are rebuilt onto isolated hardware without relying on production systems.",
        ],
      },
    ],
    checklist: {
      title: "Backup resilience operational checklist",
      items: [
        {
          task: "Verify immutability configuration",
          detail: "Confirm that write-once-read-many (WORM) or immutable snapshot locks are active on cloud and on-premises backup targets.",
          priority: "immediate",
        },
        {
          task: "Decouple backup servers from Active Directory",
          detail: "Ensure backup infrastructure uses isolated local credentials that cannot be accessed via compromised domain accounts.",
          priority: "immediate",
        },
        {
          task: "Test automated recovery alerts",
          detail: "Configure alerts to notify administrators immediately if a scheduled backup job fails or catalog verification errors occur.",
          priority: "high",
        },
        {
          task: "Execute quarterly restoration rehearsal",
          detail: "Perform a simulated bare-metal restore of critical business databases onto a staging host to validate RTO.",
          priority: "high",
        },
      ],
    },
    whenToReport: {
      text:
        "If you discover evidence that unauthorised parties have accessed, altered, or attempted to delete your enterprise backup repositories or cloud snapshots, contact TT-CSIRT immediately. Attackers typically tamper with backups immediately before launching enterprise-wide encryption payloads.",
      emergencyPhone: "+1 (868) 625-7937",
      reportLinkText: "Alert TT-CSIRT to suspected backup tampering",
      reportLinkHref: "/services/incident-response",
    },
    relatedGuidance: [
      {
        slug: "ransomware-prevention-response",
        title: "Ransomware prevention, defence, and emergency response",
        description: "Recovering systems from verified clean backups during a ransomware incident.",
      },
      {
        slug: "cyber-security-baseline",
        title: "Cyber security baseline for organisations and businesses",
        description: "Enterprise disaster recovery planning and operational continuity.",
      },
      {
        slug: "secure-configuration",
        title: "Secure system configuration and architecture baselines",
        description: "Hardening storage network segments and management gateways.",
      },
    ],
    sources: [
      {
        title: "NCSC Offline Backups in an Online World",
        url: "https://www.ncsc.gov.uk/guidance/offline-backups-in-an-online-world",
        publisher: "UK National Cyber Security Centre",
        context: "Authoritative guidance on designing ransomware-resistant backup architectures.",
      },
      {
        title: "NIST SP 800-34 Rev. 1: Contingency Planning Guide",
        url: "https://csrc.nist.gov/pubs/sp/800/34/r1/final",
        publisher: "National Institute of Standards and Technology",
        context: "Comprehensive federal guidelines for business continuity and disaster recovery.",
      },
      {
        title: "TT-CSIRT Ransomware Response Framework",
        url: "/guidance/backup-and-disaster-recovery-resilience",
        publisher: "Trinidad and Tobago Cyber Security Incident Response Team",
        context: "National recommendations on data isolation and recovery procedures.",
      },
    ],
  },
];
