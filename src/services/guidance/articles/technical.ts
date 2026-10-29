/**
 * Guidance Articles: Technical Guidance & Standards
 * Authoritative synthesis based on NIST SP 800-128 (Configuration Management),
 * UK NCSC Architecture Principles, TT-CSIRT National Cyber Security Incident Taxonomy,
 * and FIRST CSIRT standard data classifications.
 */

import { GuidanceArticle } from "../types";

export const TECHNICAL_ARTICLES: GuidanceArticle[] = [
  {
    slug: "understanding-incident-categories",
    title: "Understanding incident categories in TT-CSIRT statistics",
    shortPurpose: "Understand what the five categories in the latest statistics mean, how they support consistent reporting, and what the figures can and cannot tell you.",
    audienceDescription: "Organisations, public bodies, journalists and readers interpreting TT-CSIRT incident statistics.",
    audiences: ["organisations", "government", "technical"],
    audienceLabel: "Statistics readers and incident reporters",
    category: "technical-standards",
    categoryLabel: "Technical standards",
    lastReviewed: "9 October 2026",
    provenanceNote: "Explains the reporting categories used in TT-CSIRT's published statistics. The official TT-CSIRT Cyber Security Incident Taxonomy remains the reference for detailed technical classification.",
    keyActions: [
      "Use the category that best describes the main reported incident while recording other relevant technical details",
      "Treat the category as a reporting label, not a severity rating or a prediction of likelihood",
      "Interpret published totals as notifications received by TT-CSIRT, not all incidents that occurred in Trinidad and Tobago"
    ],
    sections: [
      {
        id: "five-statistics-categories",
        title: "The five categories used in the statistics",
        lead: "The publication groups notifications into five broad operational categories so that reports can be counted consistently over time.",
        subsections: [
          { title: "Phishing and business email compromise", paragraphs: ["This combined reporting category covers deceptive messages and business email impersonation or misuse intended to obtain information, credentials or action, including payment diversion. The statistics do not publish separate phishing and BEC counts within this combined category."] },
          { title: "Data breach and system compromise", paragraphs: ["Reports involving unauthorised access to systems or information, or suspected exposure, theft or disclosure of data. Further investigation may clarify whether data was accessed or removed."] },
          { title: "Website defacement and denial of service", paragraphs: ["Reports of unauthorised changes to a website or activity that disrupts the availability of a website, network or online service."] },
          { title: "Ransomware", paragraphs: ["Reports of malicious activity that attempts to encrypt systems or data, or extort an organisation. Related unauthorised access or data theft may also be relevant to the incident record."] },
          { title: "Malicious insider", paragraphs: ["Reports involving suspected harmful activity by someone with authorised access, such as misuse of privileges or information. A count does not establish motive, impact or the final investigation outcome."] }
        ]
      },
      {
        id: "classification-and-interpretation",
        title: "How to interpret the categories",
        paragraphs: [
          "A reporting category helps TT-CSIRT describe and compare notifications using a shared vocabulary. It is not itself a severity rating: severity depends on factors such as the systems affected, operational consequences, information involved and extent of compromise. Nor does a category's share of notifications show how likely an organisation is to experience that incident type.",
          "An incident can involve several techniques or effects. The published categories simplify the operational record; they do not replace a detailed technical classification. Use the official taxonomy when you need the national categories and subcategories for an incident report.",
          "The statistics count verified notifications received by TT-CSIRT. They do not count every cyber incident that may have occurred in the country. Some incidents may not be detected, may not be reported to TT-CSIRT, or may be reported through other channels. A low count should not be read as proof that a threat is rare."
        ]
      },
      {
        id: "using-the-information",
        title: "Use the information carefully",
        paragraphs: [
          "Organisations can use the trends to prompt questions about controls, reporting and preparedness. They should combine national statistics with their own incident records, threat information and assessment of business impact rather than using category counts alone to set priorities.",
          "When reporting an event, provide the facts you know and describe uncertainty. TT-CSIRT can help with technical triage and classification; you do not need to settle every classification question before making a report."
        ]
      }
    ],
    whenToReport: { text: "If you are dealing with a suspected active incident, report it to TT-CSIRT and describe what you have observed, even if the final category is not yet clear.", reportLinkText: "Report a cyber incident to TT-CSIRT", reportLinkHref: "/report-an-incident" },
    relatedGuidance: [
      { slug: "national-cyber-security-incident-taxonomy", title: "National cyber security incident taxonomy and classification", description: "See the official taxonomy and its detailed technical categories." },
      { slug: "incident-reporting-escalation", title: "National incident reporting and escalation procedures", description: "Prepare to report and preserve useful incident information." }
    ],
    sources: [
      { title: "TT-CSIRT Cyber Security Incident Taxonomy", url: "https://ttcsirt.gov.tt/cyber-security-incident-taxonomy/", publisher: "TT-CSIRT", context: "Official detailed incident taxonomy referenced by this explanatory guide." },
      { title: "TT-CSIRT national cyber incident statistics", url: "/statistics", publisher: "TT-CSIRT", context: "Published notification counts and methodological caveats." }
    ]
  },
  // 1. Secure configuration
  {
    slug: "secure-configuration",
    title: "Secure system configuration and architecture baselines",
    shortPurpose:
      "A technical hardening standard for system administrators and infrastructure engineers to eliminate default configurations, disable obsolete services, enforce the principle of least privilege, and prevent configuration drift.",
    audienceDescription:
      "Systems administrators, DevOps engineers, infrastructure architects, and technical auditors.",
    audiences: ["technical", "organisations"],
    audienceLabel: "Technical teams and security engineers",
    category: "technical-standards",
    categoryLabel: "Technical standards",
    lastReviewed: "23 August 2026",
    provenanceNote:
      "Synthesized from NIST SP 800-128 (Guide for Security-Focused Configuration Management) and UK NCSC Architecture and Configuration Principles, referencing industry hardening benchmarks.",
    keyActions: [
      "Change all factory-default administrative credentials and remove default sample databases before deployment",
      "Disable or uninstall all unneeded services, applications, network protocols, and open ports",
      "Enforce least-privilege role-based access control (RBAC) across all operating systems and network devices",
      "Enforce modern cryptographic baselines: disable legacy protocols (TLS 1.0/1.1, SMBv1, NTLMv1, SNMPv1/v2c)",
      "Automate configuration compliance monitoring to detect and remediate configuration drift continuously",
    ],
    sections: [
      {
        id: "default-configurations",
        title: "The risk of default configurations",
        lead:
          "Manufacturers deliver hardware and software configured for ease of initial installation rather than maximum security.",
        paragraphs: [
          "Default settings frequently include well-known administrative usernames and passwords, enabled remote management ports, permissive file permissions, and active sample services containing known vulnerabilities.",
          "Adversaries scan the internet continuously for default configurations. Leaving default credentials in place is functionally equivalent to leaving enterprise doors unlocked.",
        ],
      },
      {
        id: "hardening-operating-systems",
        title: "Operating system and network device hardening baselines",
        lead:
          "Hardening reduces the available attack surface by stripping away every non-essential capability:",
        paragraphs: [
          "System administrators should establish standardized 'gold images' or Infrastructure-as-Code (IaC) templates incorporating these foundational controls:",
        ],
        subsections: [
          {
            title: "Core hardening standards",
            list: [
              "Disable obsolete network protocols: Explicitly disable SMBv1, NetBIOS over TCP/IP, LLMNR, and legacy NTLM authentication across Windows environments",
              "Enforce SSH key-based authentication: On Linux systems, set PasswordAuthentication no and permit root logins only through non-root sudo users with multi-factor authentication",
              "Deprecate unencrypted management protocols: Completely disable Telnet, unencrypted HTTP management consoles, and plain FTP in favor of SSH, HTTPS, and SFTP",
              "Harden network switches and firewalls: Replace SNMPv1/v2 community strings with SNMPv3 featuring cryptographic authentication and privacy encryption",
            ],
          },
        ],
      },
      {
        id: "configuration-drift",
        title: "Controlling configuration drift",
        lead:
          "Over time, systems diverge from their hardened baseline through ad-hoc troubleshooting, temporary emergency changes, and uncoordinated updates.",
        paragraphs: [
          "To combat configuration drift, organisations should adopt configuration management tools (such as Ansible, Puppet, Microsoft Intune, or Group Policy Objects) that automatically re-apply approved security baselines and alert engineers whenever unauthorised modifications occur.",
        ],
      },
    ],
    checklist: {
      title: "Hardening and configuration checklist",
      items: [
        {
          task: "Eliminate all default vendor passwords",
          detail: "Verify zero network appliances, databases, or servers utilize default factory credentials.",
          priority: "immediate",
        },
        {
          task: "Disable SMBv1 globally",
          detail: "Disable the legacy SMBv1 file-sharing protocol across all domain controllers, file servers, and endpoints.",
          priority: "immediate",
        },
        {
          task: "Enforce SSH key authentication on servers",
          detail: "Disable password-based SSH access on production Linux hosts and enforce public-key authentication.",
          priority: "high",
        },
        {
          task: "Deploy automated configuration baselines",
          detail: "Enforce security settings using Group Policy (GPO) or configuration management scripts.",
          priority: "standard",
        },
      ],
    },
    whenToReport: {
      text:
        "If you discover unauthorised baseline modifications, unexpected listening network services, or unauthorised administrator accounts created on critical network infrastructure, notify TT-CSIRT immediately as this frequently indicates active adversary persistence.",
      emergencyPhone: "+1 (868) 625-7937",
      reportLinkText: "Report suspected configuration tampering",
      reportLinkHref: "/services/incident-response",
    },
    relatedGuidance: [
      {
        slug: "vulnerability-management",
        title: "Vulnerability management and patching lifecycle",
        description: "Remediating software flaws and keeping hardened baselines up to date.",
      },
      {
        slug: "logging-monitoring",
        title: "Centralized logging and security monitoring standards",
        description: "Monitoring administrative actions and configuration changes.",
      },
      {
        slug: "internet-facing-service-security",
        title: "Security controls for internet-facing systems and public gateways",
        description: "Hardening perimeter gateways and public web servers.",
      },
    ],
    sources: [
      {
        title: "NIST SP 800-128: Guide for Security-Focused Configuration Management",
        url: "https://csrc.nist.gov/pubs/sp/800/128/final",
        publisher: "National Institute of Standards and Technology",
        context: "Authoritative architectural guidance on establishing secure system baselines.",
      },
      {
        title: "NCSC Architecture and Configuration Principles",
        url: "https://www.ncsc.gov.uk/collection/device-security-guidance",
        publisher: "UK National Cyber Security Centre",
        context: "Defensive engineering principles for securing devices and infrastructure.",
      },
    ],
  },

  // 2. National Cyber Security Incident Taxonomy
  {
    slug: "national-cyber-security-incident-taxonomy",
    title: "National cyber security incident taxonomy and classification",
    shortPurpose:
      "The official categorisation and severity classification framework used by TT-CSIRT to classify, record, analyse, and report cyber security incidents across the Republic of Trinidad and Tobago.",
    audienceDescription:
      "Incident handlers, security analysts, Chief Information Security Officers (CISOs), and public sector technical officers.",
    audiences: ["technical", "government", "organisations"],
    audienceLabel: "Technical teams, incident handlers, and public officers",
    category: "technical-standards",
    categoryLabel: "Technical standards",
    lastReviewed: "31 August 2026",
    provenanceNote:
      "Authoritatively established by TT-CSIRT under the National Cyber Security Framework, harmonized with FIRST CSIRT Standards and regional OAS incident taxonomy models.",
    keyActions: [
      "Use the standardized national taxonomy categories when recording and reporting incident metrics to TT-CSIRT",
      "Map internal ticket tracking systems to the official national incident categories to enable consistent sectoral reporting",
      "Apply the four-tier national severity impact scale (Low, Medium, High, Critical) during initial triage",
      "Utilize FIRST Traffic Light Protocol (TLP) markings when exchanging technical incident data",
      "Consult annual national incident statistics published by TT-CSIRT to benchmark sector-specific threat exposures",
    ],
    sections: [
      {
        id: "purpose-of-taxonomy",
        title: "Purpose of the National Cyber Security Incident Taxonomy",
        lead:
          "Effective national cyber defence requires a common operational language.",
        paragraphs: [
          "Without a unified taxonomy, different organisations describe similar security events using conflicting terminology. One entity may classify a ransomware event as 'unauthorised access' while another classifies it as 'virus infection' or 'extortion'.",
          "The National Cyber Security Incident Taxonomy provides a standardized, objective framework for categorizing incidents across Trinidad and Tobago. It enables TT-CSIRT to maintain accurate historical trend data, compare sector-wide threat patterns, and direct national defensive resources where they are needed most.",
        ],
      },
      {
        id: "primary-categories",
        title: "Primary national taxonomy categories",
        lead:
          "TT-CSIRT classifies all verified security incidents into six core primary categories:",
        paragraphs: [
          "Each category possesses distinct technical criteria and remediation workflows:",
        ],
        subsections: [
          {
            title: "1. Unauthorized Access",
            paragraphs: [
              "Any successful or attempted circumvention of security controls to gain unauthorised logical or physical access to systems, applications, or datasets. Examples include credential stuffing, compromised VPN accounts, unauthorised privilege escalation, and brute-force intrusions.",
            ],
          },
          {
            title: "2. Denial of Service (DoS / DDoS)",
            paragraphs: [
              "Attacks designed to degrade or completely disable the availability of an information system, network, or citizen service. Includes volumetric network flooding (SYN flood, UDP amplification) and application-layer exhaustion attacks.",
            ],
          },
          {
            title: "3. Malicious Code (Malware)",
            paragraphs: [
              "Execution or installation of hostile software. Sub-categories include Ransomware (cryptographic extortion), Remote Access Trojans (RATs), Infostealers, Keyloggers, Cryptominers, and Botnet agents.",
            ],
          },
          {
            title: "4. Scams and Phishing",
            paragraphs: [
              "Social engineering operations aimed at tricking human users into disclosing confidential information or executing unauthorised payments. Includes email spear-phishing, SMS smishing, voice vishing, lottery fraud, and Business Email Compromise (BEC).",
            ],
          },
          {
            title: "5. System Compromise",
            paragraphs: [
              "Comprehensive takeover of an endpoint, server, or network perimeter device through software vulnerability exploitation, web shell placement, or configuration manipulation.",
            ],
          },
          {
            title: "6. Information Leakage / Data Breach",
            paragraphs: [
              "Unauthorised disclosure, accidental exposure, or exfiltration of sensitive organisational, citizen, or state records without authorised clearance.",
            ],
          },
        ],
      },
      {
        id: "severity-impact-tiers",
        title: "National severity impact scale",
        lead:
          "Incidents are further assessed along a 4-tier operational severity scale to determine national response escalation:",
        paragraphs: [
          "The severity rating considers the breadth of systems affected, impact on essential national services, and sensitivity of compromised data:",
        ],
        subsections: [
          {
            title: "National severity matrix",
            list: [
              "Low: Minimal operational impact; localised to single endpoints; no sensitive data exposure; easily remediated through standard antivirus or user password reset",
              "Medium: Moderate business disruption; multiple internal systems compromised; localised service degradation; potential unauthorised access to non-sensitive records",
              "High: Severe business disruption; active ransomware or lateral domain compromise; confirmed exfiltration of sensitive citizen personal data; critical server outages",
              "Critical: National emergency; systemic disruption of essential national services (electric grid, water distribution, banking clearance, air traffic control); state-sponsored intrusion affecting national security",
            ],
          },
        ],
      },
    ],
    whenToReport: {
      text:
        "When reporting an incident to TT-CSIRT, providing preliminary taxonomy classifications and estimated severity levels helps our triage team deploy appropriate technical containment resources rapidly.",
      emergencyPhone: "+1 (868) 625-7937",
      reportLinkText: "Submit a categorised incident report",
      reportLinkHref: "/services/incident-response",
    },
    relatedGuidance: [
      {
        slug: "incident-reporting-escalation",
        title: "National incident reporting and escalation procedures",
        description: "Official procedures and escalation timelines for reporting incidents to TT-CSIRT.",
      },
      {
        slug: "incident-response-planning",
        title: "Incident response planning and readiness for enterprises",
        description: "Structuring internal response plans using standard severity classifications.",
      },
      {
        slug: "government-cyber-security-baseline",
        title: "Government cyber security baseline for ministries and statutory bodies",
        description: "Public sector compliance with national incident reporting frameworks.",
      },
    ],
    sources: [
      {
        title: "TT-CSIRT National Cyber Security Incident Taxonomy",
        url: "/statistics",
        publisher: "Trinidad and Tobago Cyber Security Incident Response Team",
        context: "Authoritative national categorization standard for cyber incidents in Trinidad and Tobago.",
      },
      {
        title: "FIRST CSIRT Services Framework: Information Classification",
        url: "https://www.first.org/standards/frameworks/csirts/",
        publisher: "Forum of Incident Response and Security Teams",
        context: "Global standard for CSIRT taxonomy models and service definitions.",
      },
    ],
  },
];
