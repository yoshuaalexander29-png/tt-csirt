/**
 * Guidance Articles: Government & Critical Infrastructure
 * Authoritative synthesis based on the Trinidad and Tobago National Cyber Security Strategy,
 * TT-CSIRT statutory reporting frameworks, NIST CSF 2.0, NIST SP 800-82 (OT/ICS),
 * and UK NCSC public-sector cyber resilience baselines.
 */

import { GuidanceArticle } from "../types";

export const GOVERNMENT_ARTICLES: GuidanceArticle[] = [
  // 1. Government cyber security baseline
  {
    slug: "government-cyber-security-baseline",
    title: "Government cyber security baseline for ministries and statutory bodies",
    shortPurpose:
      "Mandatory defensive baselines, administrative governance, and technical controls for Government of the Republic of Trinidad and Tobago (GoRTT) ministries, departments, and statutory agencies.",
    audienceDescription:
      "Permanent Secretaries, Chief Information Officers (CIOs), ministerial IT managers, and public sector system administrators.",
    audiences: ["government"],
    audienceLabel: "Government ministries and statutory agencies",
    category: "critical-infrastructure",
    categoryLabel: "Government and critical infrastructure",
    lastReviewed: "27 August 2026",
    provenanceNote:
      "Synthesized from the Trinidad and Tobago National Cyber Security Strategy, TT-CSIRT circulars, and NIST Cybersecurity Framework (CSF) 2.0 public sector implementations.",
    keyActions: [
      "Enforce domain-level email authentication (SPF, DKIM, and strict DMARC 'reject' policy) across all .gov.tt domains",
      "Mandate phishing-resistant multi-factor authentication for all public officers accessing government cloud systems and email",
      "Prohibit the use of personal, unmanaged webmail accounts (Gmail, Yahoo) for official public sector business and records",
      "Designate an official departmental Cyber Security Liaison Officer (CSLO) to coordinate directly with TT-CSIRT",
      "Submit external-facing IP addresses and digital services for continuous vulnerability assessments coordinated by TT-CSIRT",
    ],
    sections: [
      {
        id: "public-sector-posture",
        title: "The whole-of-government defensive imperative",
        lead:
          "Public sector networks maintain critical citizen databases, deliver essential public services, and support national economic stability.",
        paragraphs: [
          "A cyber security incident affecting a single government ministry can undermine public confidence in national institutions, disrupt essential welfare or judicial operations, and expose sensitive citizen information.",
          "In alignment with the National Cyber Security Strategy, all public bodies must establish unified defensive baselines that prevent adversaries from exploiting soft administrative boundaries across government networks.",
        ],
      },
      {
        id: "email-domain-security",
        title: "Securing the government digital identity: .gov.tt domain protection",
        lead:
          "Official government communications must be instantly recognizable and protected against spoofing.",
        paragraphs: [
          "Attackers frequently forge executive emails from ministries to deceive citizens, commercial contractors, or foreign diplomatic entities.",
        ],
        subsections: [
          {
            title: "Mandatory domain authentication standards",
            list: [
              "Sender Policy Framework (SPF): Publish strict SPF records specifying exactly which mail servers are authorized to send email on behalf of your agency",
              "DomainKeys Identified Mail (DKIM): Cryptographically sign all outgoing ministry correspondence with 2048-bit keys",
              "Domain-based Message Authentication (DMARC): Enforce a strict p=reject policy across all active and parked .gov.tt domains to instruct receiving mail servers globally to drop fraudulent spoofed messages automatically",
            ],
          },
        ],
      },
      {
        id: "privileged-access-governance",
        title: "Privileged account administration in public bodies",
        lead:
          "Excessive administrative privileges represent the single most common vulnerability enabling adversary lateral movement in public sector networks.",
        paragraphs: [
          "Permanent Secretaries and IT Directors must enforce strict segregation of duties. General administrative accounts (Domain Admins, Global Admins) must never be assigned to standard user profiles used for reading email or browsing the web.",
          "Privileged access must be time-bound, logged centrally, and granted exclusively through dedicated, hardened jump hosts using multi-factor authentication.",
        ],
      },
      {
        id: "inter-agency-coordination",
        title: "TT-CSIRT circulars and inter-agency coordination",
        lead:
          "Cyber defence in the public service relies on shared intelligence and coordinated response.",
        paragraphs: [
          "Every ministry, department, and agency (MDA) must formally nominate a primary and alternate Cyber Security Liaison Officer (CSLO). These officers serve as direct operational conduits for receiving urgent threat circulars, coordinating vulnerability remediation, and escalating security events to TT-CSIRT.",
        ],
      },
    ],
    checklist: {
      title: "Government agency baseline compliance checklist",
      items: [
        {
          task: "Verify DMARC 'reject' enforcement",
          detail: "Confirm that all official agency email domains enforce p=reject to block executive spoofing.",
          priority: "immediate",
        },
        {
          task: "Enforce MFA for all public officers",
          detail: "Ensure 100% of staff mailboxes and cloud productivity tools require multi-factor authentication.",
          priority: "immediate",
        },
        {
          task: "Nominate Cyber Security Liaison Officers",
          detail: "Submit official contact credentials for your agency's designated CSLOs to TT-CSIRT.",
          priority: "high",
        },
        {
          task: "Decommission obsolete web portals",
          detail: "Audit public IP blocks and take down unmaintained historical campaign websites and legacy portals.",
          priority: "high",
        },
        {
          task: "Implement 180-day log retention",
          detail: "Verify centralized log storage for domain controllers, firewalls, and public gateway servers.",
          priority: "standard",
        },
      ],
    },
    whenToReport: {
      text:
        "All ministries, statutory authorities, and state enterprises are required to notify TT-CSIRT immediately upon detecting any suspected unauthorised access, ransomware execution, or data exposure affecting public sector information systems.",
      emergencyPhone: "+1 (868) 625-7937",
      reportLinkText: "Submit government incident notification",
      reportLinkHref: "/services/incident-response",
    },
    relatedGuidance: [
      {
        slug: "incident-reporting-escalation",
        title: "National incident reporting and escalation procedures",
        description: "Official escalation procedures and thresholds for public sector entities.",
      },
      {
        slug: "critical-infrastructure-protection",
        title: "Critical information infrastructure protection (CIIP)",
        description: "Defensive standards for state-owned utilities and essential services.",
      },
      {
        slug: "internet-facing-service-security",
        title: "Security controls for internet-facing systems and public gateways",
        description: "Hardening citizen-facing digital services and ministerial web portals.",
      },
    ],
    sources: [
      {
        title: "Trinidad and Tobago National Cyber Security Strategy",
        url: "/about/national-cyber-security-strategy",
        publisher: "Government of the Republic of Trinidad and Tobago",
        context: "The national policy blueprint for strengthening institutional cybersecurity capabilities.",
      },
      {
        title: "NIST Cybersecurity Framework 2.0 (Public Sector Application)",
        url: "https://www.nist.gov/cyberframework",
        publisher: "National Institute of Standards and Technology",
        context: "Enterprise risk management guidelines for federal and state institutions.",
      },
      {
        title: "NCSC Cyber Security Guidance for the Public Sector",
        url: "https://www.ncsc.gov.uk/section/guidance/public-sector",
        publisher: "UK National Cyber Security Centre",
        context: "Best practices for protecting national public infrastructure and civic services.",
      },
    ],
  },

  // 2. Incident reporting & escalation
  {
    slug: "incident-reporting-escalation",
    title: "National incident reporting and escalation procedures",
    shortPurpose:
      "Practical guidance on contacting TT-CSIRT, preserving incident information, coordinating response and checking any separate reporting requirements that apply to your organisation.",
    audienceDescription:
      "Incident handlers, corporate risk leads, public sector liaison officers, and security operations analysts.",
    audiences: ["government", "organisations"],
    audienceLabel: "Public officers and enterprise incident managers",
    category: "critical-infrastructure",
    categoryLabel: "Government and critical infrastructure",
    lastReviewed: "30 August 2026",
    provenanceNote:
      "General incident reporting and coordination guidance. Confirm legal, regulatory, administrative and contractual duties against current primary sources that apply to your organisation.",
    keyActions: [
      "Contact TT-CSIRT promptly when a suspected incident needs technical coordination or response guidance",
      "Preserve digital evidence, forensic artifacts, and volatile logs before initiating system rebuilds",
      "Use an agreed secure channel and limit incident information to people who need it",
      "Establish out-of-band communication pathways if enterprise email or internal chat tools are potentially compromised",
      "Check separately for any applicable police, regulatory, administrative, contractual or internal notification requirement",
    ],
    sections: [
      {
        id: "when-to-report",
        title: "When to contact TT-CSIRT",
        lead:
          "Timely contact can help TT-CSIRT correlate threat activity and provide mitigation guidance. This is practical advice, not a statement of a universal legal or administrative reporting deadline.",
        paragraphs: [
          "Contact TT-CSIRT when your organisation suspects a cyber incident and needs technical triage, containment guidance or coordination. You do not need a complete investigation or confirmed severity rating before making an initial report. Provide the facts available at the time and explain what is still uncertain.",
          "Examples that may warrant prompt technical escalation include:",
        ],
        subsections: [
          {
            title: "Examples for prompt technical escalation",
            list: [
              "Suspected unauthorised administrative access to core network infrastructure (domain controllers, hypervisors, cloud tenants)",
              "Ransomware infection or active data encryption affecting business-critical operations",
              "Exfiltration, theft, or unauthorised public disclosure of sensitive citizen, customer, or state records",
              "Denial of Service (DoS/DDoS) attacks disrupting public utility portals or government citizen services",
              "Discovery of possible persistent backdoors or active command-and-control activity",
            ],
          },
        ],
      },
      {
        id: "evidence-preservation",
        title: "Evidence preservation and impact assessment",
        lead:
          "Hasty remediation efforts often destroy the exact evidence required to understand an intrusion.",
        paragraphs: [
          "When an incident is detected, preserve relevant information where this can be done safely and without delaying urgent containment:",
        ],
        subsections: [
          {
            title: "Evidence handling rules",
            list: [
              "If trained responders are available, consider whether volatile evidence should be captured before a system is rebooted or disconnected",
              "Preserve firewall and server logs: Immediately copy authentication logs, web server logs, and firewall connection records to a secure, write-protected location",
              "Maintain chain of custody: Document who handled physical disks, captured images, or accessed affected machines, noting timestamps and actions taken",
            ],
          },
        ],
      },
      {
        id: "traffic-light-protocol",
        title: "Communicate securely",
        lead:
          "Incident details can contain sensitive operational information. Choose communication channels and recipients with care:",
        paragraphs: [
          "Use TT-CSIRT's instructions for submitting information, follow your organisation's approved incident channels, and share only what is relevant with people who need it. If email or collaboration tools may be compromised, use a trusted alternative contact route. Apply Traffic Light Protocol markings when requested or when your information-sharing process uses TLP; do not assume a marking replaces secure handling.",
        ],
      },
    ],
    checklist: {
      title: "Incident escalation checklist",
      items: [
        {
          task: "Record what is known",
          detail: "Note the detection time, affected services, observed activity, immediate impact and which facts remain uncertain.",
          priority: "immediate",
        },
        {
          task: "Engage TT-CSIRT via telephone hotline",
          detail: "Use the incident form or contact information published by TT-CSIRT. Share the information requested through its advised channel.",
          priority: "immediate",
        },
        {
          task: "Choose proportionate containment",
          detail: "Coordinate with technical responders and service owners. Consider operational impact and evidence preservation before isolating or rebooting systems.",
          priority: "high",
        },
        {
          task: "Check other notification duties",
          detail: "Ask your legal, privacy or compliance adviser whether separate police, regulatory, administrative or contractual notifications apply.",
          priority: "standard",
        },
      ],
    },
    whenToReport: {
      text:
          "Use TT-CSIRT's incident reporting service to submit the details available. For urgent active incidents, use the contact information published by TT-CSIRT.",
      emergencyPhone: "+1 (868) 625-7937 / +1 (868) 299-8827",
      reportLinkText: "Submit an online incident report",
      reportLinkHref: "/report-an-incident",
    },
    relatedGuidance: [
      {
        slug: "national-cyber-security-incident-taxonomy",
        title: "National cyber security incident taxonomy and classification",
        description: "Categorizing incidents accurately using official TT-CSIRT standards.",
      },
      {
        slug: "incident-response-planning",
        title: "Incident response planning and readiness for enterprises",
        description: "Preparing internal escalation teams and operational playbooks.",
      },
      {
        slug: "logging-monitoring",
        title: "Centralized logging and security monitoring standards",
        description: "Preserving audit logs to support forensic investigations.",
      },
    ],
    sources: [
      {
        title: "TT-CSIRT Incident Response Framework",
        url: "https://ttcsirt.gov.tt/",
        publisher: "Trinidad and Tobago Cyber Security Incident Response Team",
        context: "National mandate and operational coordination procedures for cyber incidents.",
      },
      {
        title: "FIRST CSIRT Services Framework",
        url: "https://www.first.org/standards/frameworks/csirts/",
        publisher: "Forum of Incident Response and Security Teams",
        context: "International standard for computer security incident response service delivery.",
      },
      {
        title: "FIRST Traffic Light Protocol (TLP) v2.0",
        url: "https://www.first.org/tlp/",
        publisher: "Forum of Incident Response and Security Teams",
        context: "International standard for sensitive information sharing and dissemination control.",
      },
    ],
  },

  // 3. Critical infrastructure protection
  {
    slug: "critical-infrastructure-protection",
    title: "Critical information infrastructure protection (CIIP)",
    shortPurpose:
      "A defensive architecture and risk mitigation guide for operators of essential national services in energy, water, telecommunications, financial markets, healthcare, and transport.",
    audienceDescription:
      "SCADA/ICS engineers, operational technology (OT) managers, utility security directors, and critical infrastructure executives.",
    audiences: ["government", "organisations"],
    audienceLabel: "Critical infrastructure operators",
    category: "critical-infrastructure",
    categoryLabel: "Government and critical infrastructure",
    lastReviewed: "24 August 2026",
    provenanceNote:
      "Synthesized from the Trinidad and Tobago National Cyber Security Strategy, NIST SP 800-82 (Guide to Operational Technology Security), and CISA Cross-Sector Cybersecurity Performance Goals (CPGs).",
    keyActions: [
      "Strictly isolate Industrial Control Systems (ICS) and Operational Technology (OT) networks from the enterprise IT network and public internet",
      "Eliminate direct, dual-homed connections bridging enterprise workstations into programmable logic controller (PLC) subnets",
      "Mandate multi-factor authentication with hardware tokens for all engineering workstations and remote maintenance gateways",
      "Conduct regular manual failsafe and analog backup testing to ensure physical systems can operate during a total IT network outage",
      "Participate actively in national critical infrastructure threat sharing and sector-wide tabletop drills facilitated by TT-CSIRT",
    ],
    sections: [
      {
        id: "defining-cni",
        title: "Defining Critical National Infrastructure in Trinidad and Tobago",
        lead:
          "Critical National Infrastructure (CNI) encompasses the physical and cyber systems so vital to the Republic of Trinidad and Tobago that their incapacitation would have a debilitating impact on national security, public health, safety, or the economy.",
        paragraphs: [
          "Priority sectors in Trinidad and Tobago include Oil & Gas and Petrochemicals, Electric Power Generation and Distribution, Water and Wastewater Services, Telecommunications and Subsea Cable Landings, Commercial Banking and Financial Clearing, and Port & Airport Logistics.",
          "Threat actors targeting critical infrastructure frequently seek long-term persistence to conduct espionage, establish prepositioned disruptive capability, or execute destructive extortion campaigns.",
        ],
      },
      {
        id: "it-ot-convergence",
        title: "Managing the perils of IT and OT convergence",
        lead:
          "Connecting legacy industrial automation systems to corporate business networks introduces severe vulnerability.",
        paragraphs: [
          "Operational Technology (OT) environments prioritise availability, physical safety, and real-time determinism. Unlike corporate IT systems, many industrial PLCs and RTUs lack encryption, authentication, or the ability to run endpoint security software.",
          "Organisations must adhere strictly to the Purdue Enterprise Reference Architecture (PERA), enforcing distinct physical or cryptographically segmented security zones between Enterprise IT (Levels 4-5) and Industrial Operations (Levels 0-3).",
        ],
        subsections: [
          {
            title: "Purdue model isolation controls",
            list: [
              "Deploy a formal Industrial Demilitarized Zone (IDMZ / Level 3.5) separating business IT from plant operations",
              "Never route routable traffic directly between enterprise offices and industrial shop floors",
              "Utilize unidirectional security gateways (data diodes) for historian data replication to corporate analytics dashboards",
              "Strictly prohibit direct internet access from any SCADA human-machine interface (HMI) or engineering workstation",
            ],
          },
        ],
      },
      {
        id: "supply-chain-cni",
        title: "Equipment supply chain and firmware integrity",
        lead:
          "Critical infrastructure operators must scrutinize the provenance and integrity of industrial hardware and firmware.",
        paragraphs: [
          "Adversaries increasingly target third-party engineering contractors who connect unmanaged maintenance laptops directly into plant control switches.",
          "Establish dedicated, isolated 'clean rooms' and sanitized maintenance workstations for vendor technicians. Require all field firmware updates to be cryptographically verified against manufacturer hashes prior to installation.",
        ],
      },
    ],
    checklist: {
      title: "Critical infrastructure defensive checklist",
      items: [
        {
          task: "Audit perimeter bridging between IT and OT",
          detail: "Verify that no unauthorised dual-homed network cards or modems bridge corporate subnets into industrial control VLANs.",
          priority: "immediate",
        },
        {
          task: "Disable remote administrative access to PLCs",
          detail: "Ensure engineering access to controllers requires physical presence or authenticated connection through an IDMZ bastion.",
          priority: "immediate",
        },
        {
          task: "Test manual analog override capabilities",
          detail: "Conduct operational tests confirming plant operators can safely monitor and manually shut down machinery if SCADA screens fail.",
          priority: "high",
        },
        {
          task: "Establish dedicated out-of-band OT telemetry",
          detail: "Deploy network intrusion sensors to monitor industrial protocols (Modbus, DNP3, Ethernet/IP) for unauthorised command sequences.",
          priority: "high",
        },
      ],
    },
    whenToReport: {
      text:
        "Operators of essential national services must notify TT-CSIRT immediately upon detecting any cyber anomaly, unauthorised connection, or firmware tampering within operational technology (OT) or SCADA boundaries. TT-CSIRT provides specialised technical triage and coordinates with national security authorities.",
      emergencyPhone: "+1 (868) 625-7937 / +1 (868) 299-8827",
      reportLinkText: "Submit critical infrastructure alert",
      reportLinkHref: "/services/incident-response",
    },
    relatedGuidance: [
      {
        slug: "government-cyber-security-baseline",
        title: "Government cyber security baseline for ministries and statutory bodies",
        description: "Public sector cyber defence and governance frameworks.",
      },
      {
        slug: "secure-configuration",
        title: "Secure system configuration and architecture baselines",
        description: "Hardening network segments and industrial gateway routers.",
      },
      {
        slug: "supply-chain-security",
        title: "Third-party and cyber supply-chain risk management",
        description: "Managing specialist hardware vendor and maintenance contractor risks.",
      },
    ],
    sources: [
      {
        title: "Trinidad and Tobago National Cyber Security Strategy",
        url: "/about/national-cyber-security-strategy",
        publisher: "Government of the Republic of Trinidad and Tobago",
        context: "National framework identifying critical infrastructure sectors and protection mandates.",
      },
      {
        title: "NIST SP 800-82: Guide to Operational Technology (OT) Security",
        url: "https://csrc.nist.gov/pubs/sp/800/82/final",
        publisher: "National Institute of Standards and Technology",
        context: "Authoritative architectural guidance for securing industrial control and SCADA systems.",
      },
      {
        title: "CISA Cross-Sector Cybersecurity Performance Goals (CPGs)",
        url: "https://www.cisa.gov/cpgs",
        publisher: "Cybersecurity and Infrastructure Security Agency",
        context: "Prioritised baseline security practices for critical infrastructure operators.",
      },
    ],
  },

  // 4. Internet-facing service security
  {
    slug: "internet-facing-service-security",
    title: "Security controls for internet-facing systems and public gateways",
    shortPurpose:
      "A technical hardening guide for securing public web portals, citizen service gateways, application programming interfaces (APIs), and DNS infrastructure against external exploitation and unauthorised access.",
    audienceDescription:
      "DevOps engineers, web administrators, cloud architects, and security operations engineers.",
    audiences: ["government", "organisations", "technical"],
    audienceLabel: "Web administrators and DevOps engineers",
    category: "critical-infrastructure",
    categoryLabel: "Government and critical infrastructure",
    lastReviewed: "16 August 2026",
    provenanceNote:
      "Synthesized from TT-CSIRT service hardening guidelines, UK NCSC external exposure principles, and OWASP Application Security Verification Standards (ASVS).",
    keyActions: [
      "Enforce Transport Layer Security (TLS 1.3 preferred; TLS 1.2 minimum) and deprecate obsolete ciphers across all public endpoints",
      "Implement strong HTTP security response headers (HSTS, CSP, X-Frame-Options) across all web applications",
      "Deploy Web Application Firewalls (WAF) to inspect incoming traffic for SQL injection, cross-site scripting (XSS), and zero-day exploits",
      "Protect DNS infrastructure with DNSSEC and multi-factor authentication on domain registrar administrative accounts",
      "Strictly block public internet exposure of administrative interfaces, staging environments, and database management consoles",
    ],
    sections: [
      {
        id: "attack-surface-reduction",
        title: "Systematic attack surface reduction",
        lead:
          "Any service reachable from the public internet is under continuous automated reconnaissance by threat actors globally.",
        paragraphs: [
          "Organisations must eliminate unnecessary exposure. If a service does not need to be accessed by the general public, it must not reside on an open, internet-routable IP address.",
          "Administrative portals (e.g. phpMyAdmin, cPanel, Kubernetes dashboards, Jenkins consoles, remote router interfaces) must be relocated behind a Zero Trust access proxy or VPN requiring multi-factor authentication.",
        ],
      },
      {
        id: "tls-and-headers",
        title: "Cryptographic transport and HTTP security headers",
        lead:
          "Securing data in transit requires modern cryptographic protocols and defensive browser headers.",
        paragraphs: [
          "Configure web servers (Nginx, Apache, IIS, Cloudflare) to use TLS 1.3 by default. Completely disable support for deprecated protocols (SSLv3, TLS 1.0, and TLS 1.1) and weak ciphers (RC4, 3DES).",
        ],
        subsections: [
          {
            title: "Mandatory HTTP headers",
            list: [
              "Strict-Transport-Security (HSTS): Enforce max-age=31536000; includeSubDomains; preload to mandate HTTPS connections",
              "Content-Security-Policy (CSP): Restrict where scripts, styles, and frames can be loaded from to mitigate Cross-Site Scripting (XSS)",
              "X-Content-Type-Options: nosniff to prevent MIME-type confusion attacks",
              "X-Frame-Options: DENY or SAMEORIGIN to protect citizen forms against clickjacking",
            ],
          },
        ],
      },
      {
        id: "api-security",
        title: "Hardening Application Programming Interfaces (APIs)",
        lead:
          "APIs power modern citizen portals and mobile banking applications, making them prime targets for automated scraping and credential abuse.",
        paragraphs: [
          "Enforce robust OAuth 2.0 or mTLS authentication across all API endpoints. Implement aggressive rate-limiting, strict input schema validation, and ensure error messages return generic failure codes rather than detailed stack traces containing internal database schemas.",
        ],
      },
    ],
    checklist: {
      title: "Public gateway hardening checklist",
      items: [
        {
          task: "Audit public IP address port exposures",
          detail: "Verify zero open database ports (3306, 5432, 1433) or remote management ports (3389, 22) exist on public IPs.",
          priority: "immediate",
        },
        {
          task: "Enforce TLS 1.3 and HSTS",
          detail: "Configure web servers to reject TLS 1.0/1.1 and inject HSTS headers with at least one-year duration.",
          priority: "immediate",
        },
        {
          task: "Deploy Web Application Firewall (WAF)",
          detail: "Route citizen-facing web traffic through a WAF configured with OWASP Core Rule Sets to block web exploits.",
          priority: "high",
        },
        {
          task: "Enable registrar lock and MFA on DNS",
          detail: "Protect domain registrar accounts with FIDO2 passkeys and activate DNSSEC signing on all official domains.",
          priority: "high",
        },
      ],
    },
    whenToReport: {
      text:
        "If you detect ongoing Distributed Denial of Service (DDoS) attacks saturating public gateway bandwidth, widespread automated exploitation of web applications, or DNS hijacking attempts targeting national domains, notify TT-CSIRT immediately.",
      emergencyPhone: "+1 (868) 625-7937",
      reportLinkText: "Report web application or gateway compromise",
      reportLinkHref: "/services/incident-response",
    },
    relatedGuidance: [
      {
        slug: "vulnerability-management",
        title: "Vulnerability management and patching lifecycle",
        description: "Scanning and patching external-facing web application software.",
      },
      {
        slug: "secure-configuration",
        title: "Secure system configuration and architecture baselines",
        description: "Hardening web server and proxy configuration parameters.",
      },
      {
        slug: "logging-monitoring",
        title: "Centralized logging and security monitoring standards",
        description: "Collecting web access and gateway logs for threat detection.",
      },
    ],
    sources: [
      {
        title: "TT-CSIRT Service Hardening Guidelines",
        url: "https://ttcsirt.gov.tt/",
        publisher: "Trinidad and Tobago Cyber Security Incident Response Team",
        context: "National technical baseline for securing public web portals and network gateways.",
      },
      {
        title: "NCSC Using TLS to Protect Data in Transit",
        url: "https://www.ncsc.gov.uk/guidance/tls-external-facing-services",
        publisher: "UK National Cyber Security Centre",
        context: "Authoritative specifications for configuring modern cryptographic protocols.",
      },
      {
        title: "NIST SP 800-123: Guide to General Server Security",
        url: "https://csrc.nist.gov/pubs/sp/800/123/final",
        publisher: "National Institute of Standards and Technology",
        context: "Comprehensive engineering practices for securing internet-accessible servers.",
      },
    ],
  },

  // 5. Logging & monitoring
  {
    slug: "logging-monitoring",
    title: "Centralized logging and security monitoring standards",
    shortPurpose:
      "A technical standard specifying baseline audit log generation, secure centralized aggregation, clock synchronization (NTP), 180-day forensic retention, and real-time anomalous event alerting.",
    audienceDescription:
      "Security Operations Center (SOC) analysts, network administrators, compliance officers, and IT infrastructure leads.",
    audiences: ["government", "organisations", "technical"],
    audienceLabel: "Security Operations Centers (SOC) and sysadmins",
    category: "critical-infrastructure",
    categoryLabel: "Government and critical infrastructure",
    lastReviewed: "21 August 2026",
    provenanceNote:
      "Synthesized from UK NCSC Logging and Monitoring guidance, NIST SP 800-92 (Guide to Computer Security Log Management), and TT-CSIRT forensic readiness baselines.",
    keyActions: [
      "Synchronize all system clocks across servers, firewalls, and routers to an authoritative Network Time Protocol (NTP) source",
      "Forward security logs in near real-time to an isolated, append-only centralized log management repository or SIEM",
      "Retain audit logs for a minimum of 180 days (with 365 days recommended for critical infrastructure) to support forensic inquiries",
      "Configure automated alerting rules for high-fidelity indicators: credential spraying, unusual after-hours logins, and privilege escalation",
      "Restrict read and delete permissions on log repositories to prevent attackers from clearing their tracks",
    ],
    sections: [
      {
        id: "why-logging-matters",
        title: "Forensic readiness and the role of audit logs",
        lead:
          "When a cyber breach occurs, audit logs represent the primary source of truth for understanding how attackers entered, what data they touched, and where they moved.",
        paragraphs: [
          "Without centralized, synchronized logs, incident responders cannot determine the scope of an intrusion, identify compromised accounts, or provide assurances that an adversary has been fully evicted.",
          "Attackers know this. Upon compromising a host, their standard tradecraft includes disabling event logging and clearing local event logs (such as Windows Event Logs or /var/log/secure).",
        ],
      },
      {
        id: "log-sources",
        title: "High-priority log sources and event types",
        lead:
          "Organisations must capture high-value security telemetry across all enterprise architectural tiers:",
        paragraphs: [
          "Prioritise collecting the following high-fidelity log events:",
        ],
        subsections: [
          {
            title: "Essential event categories",
            list: [
              "Authentication and identity: Successful and failed logons, password resets, account lockouts, MFA challenges, and new account creations",
              "Privilege escalation: Additions to administrative groups (Domain Admins, sudoers), changes to user rights, and UAC elevation events",
              "Perimeter and gateway telemetry: Firewall rule drops, VPN session establishment, DNS query logs, and reverse proxy access records",
              "Endpoint process execution: Process creation events (Sysmon Event ID 1), PowerShell script block logging (Event ID 4104), and scheduled task registrations",
            ],
          },
        ],
      },
      {
        id: "retention-and-ntp",
        title: "Clock synchronization and retention baselines",
        lead:
          "Timestamps are meaningless if system clocks differ across servers.",
        paragraphs: [
          "All enterprise devices must synchronize with authenticated Network Time Protocol (NTP) sources (such as national observatory or regional atomic time servers). Ensure all log forwarders record timestamps in Coordinated Universal Time (UTC) or explicitly include timezone offsets.",
          "TT-CSIRT establishes a mandatory minimum retention period of 180 days for all public sector and enterprise security logs, with at least 30 days immediately searchable in hot/warm storage.",
        ],
      },
    ],
    checklist: {
      title: "Logging and monitoring operational checklist",
      items: [
        {
          task: "Configure NTP synchronization across all hosts",
          detail: "Verify that domain controllers, hypervisors, switches, and firewalls sync to a shared, authoritative time source.",
          priority: "immediate",
        },
        {
          task: "Forward logs to centralized SIEM/Syslog",
          detail: "Ensure local logs forward immediately to a hardened central collector so clearing local logs does not erase records.",
          priority: "immediate",
        },
        {
          task: "Enforce 180-day retention policy",
          detail: "Verify log archive storage capacity allows retaining compressed, indexed security logs for at least six months.",
          priority: "high",
        },
        {
          task: "Enable PowerShell Script Block Logging",
          detail: "Activate enhanced PowerShell logging (Event ID 4104) across all Windows servers and workstations.",
          priority: "high",
        },
      ],
    },
    whenToReport: {
      text:
        "If monitoring systems trigger alerts indicating deliberate log tampering, bulk deletion of security audit trails, or mass credential harvesting, contact TT-CSIRT immediately for incident triage assistance.",
      emergencyPhone: "+1 (868) 625-7937",
      reportLinkText: "Report security monitoring anomaly",
      reportLinkHref: "/services/incident-response",
    },
    relatedGuidance: [
      {
        slug: "incident-response-planning",
        title: "Incident response planning and readiness for enterprises",
        description: "Utilizing security telemetry during an active incident response.",
      },
      {
        slug: "secure-configuration",
        title: "Secure system configuration and architecture baselines",
        description: "Configuring hardened logging baselines on operating systems and network gear.",
      },
      {
        slug: "incident-reporting-escalation",
        title: "National incident reporting and escalation procedures",
        description: "Sharing forensic log artifacts with TT-CSIRT responders.",
      },
    ],
    sources: [
      {
        title: "NCSC Logging and Protective Monitoring",
        url: "https://www.ncsc.gov.uk/guidance/introduction-logging-security-purposes",
        publisher: "UK National Cyber Security Centre",
        context: "Authoritative architectural guidance on establishing effective logging and monitoring.",
      },
      {
        title: "NIST SP 800-92: Guide to Computer Security Log Management",
        url: "https://csrc.nist.gov/pubs/sp/800/92/final",
        publisher: "National Institute of Standards and Technology",
        context: "Comprehensive federal standard for log generation, transmission, storage, and analysis.",
      },
    ],
  },
];
