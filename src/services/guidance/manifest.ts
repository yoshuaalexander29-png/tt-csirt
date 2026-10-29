/**
 * Lightweight Manifest for TT-CSIRT National Cyber Security Guidance Library
 * Used by the Guidance Hub, search indexing, routing, and navigation
 * without loading full article bodies into memory.
 */

import type { GuidanceSummary, GuidanceAudience, GuidanceCategory } from "./types.ts";

export const GUIDANCE_SUMMARIES: GuidanceSummary[] = [
  {
    slug: "understanding-incident-categories",
    title: "Understanding incident categories in TT-CSIRT statistics",
    summary: "Understand what the five categories in the latest statistics mean, how they support consistent reporting, and what the figures can and cannot tell you.",
    audience: ["organisations", "government", "technical"],
    audienceLabel: "Statistics readers and incident reporters",
    category: "technical-standards",
    categoryLabel: "Technical standards",
    readingTimeMinutes: 4,
    primarySource: "TT-CSIRT Cyber Security Incident Taxonomy",
    lastReviewed: "9 October 2026",
  },
  {
    slug: "responding-to-a-suspected-cyber-incident",
    title: "Responding to a suspected cyber incident",
    summary: "Practical steps for organisations to coordinate, contain, document and recover from a suspected cyber incident.",
    audience: ["organisations", "government", "technical"],
    audienceLabel: "Organisations and public bodies",
    category: "enterprise-defence",
    categoryLabel: "Enterprise defence",
    readingTimeMinutes: 5,
    primarySource: "NIST SP 800-61 Rev. 3 & TT-CSIRT incident response guidance",
    lastReviewed: "9 October 2026",
  },
  {
    slug: "organisation-specific-incident-reporting",
    title: "How organisations can report a cyber incident",
    summary: "How organisations in Trinidad and Tobago can contact TT-CSIRT, prepare useful information and understand what incident reporting does and does not cover.",
    audience: ["organisations", "government"],
    audienceLabel: "Organisations and public bodies",
    category: "enterprise-defence",
    categoryLabel: "Enterprise defence",
    readingTimeMinutes: 4,
    primarySource: "TT-CSIRT incident reporting service",
    lastReviewed: "9 October 2026",
  },
  {
    slug: "business-email-compromise",
    title: "Prevent and respond to business email compromise",
    summary: "Practical controls to reduce payment diversion and account misuse, and steps to take when business email compromise is suspected.",
    audience: ["organisations", "government"],
    audienceLabel: "Businesses and public bodies",
    category: "enterprise-defence",
    categoryLabel: "Enterprise defence",
    readingTimeMinutes: 5,
    primarySource: "Canadian Centre for Cyber Security & FBI guidance",
    lastReviewed: "9 October 2026",
  },
  // ==========================================
  // Branch 1: Individuals & Families
  // ==========================================
  {
    slug: "cyber-safety-basics",
    title: "Cyber safety basics for citizens and households",
    summary:
      "Use three-word passphrases, turn on automatic software updates, secure your home Wi-Fi router, and back up personal files.",
    audience: ["individuals"],
    audienceLabel: "Individuals and families",
    category: "personal-cyber-safety",
    categoryLabel: "Personal cyber safety",
    readingTimeMinutes: 5,
    primarySource: "TT-CSIRT Cyber Safety Tips",
    lastReviewed: "14 August 2026",
    isFeatured: true,
    hasChecklist: true,
  },
  {
    slug: "phishing-scams",
    title: "Recognising and preventing phishing and social engineering scams",
    summary:
      "Spot suspicious emails, fake banking text messages (smishing), WhatsApp impersonation scams, and fraudulent phone calls, and learn what to do if you clicked a link.",
    audience: ["individuals", "organisations"],
    audienceLabel: "Citizens and employees",
    category: "personal-cyber-safety",
    categoryLabel: "Personal cyber safety",
    readingTimeMinutes: 6,
    primarySource: "TT-CSIRT Awareness Guidance & CISA Secure Our World",
    lastReviewed: "18 August 2026",
    isFeatured: true,
    hasChecklist: true,
  },
  {
    slug: "account-security",
    title: "Personal account security and multi-factor authentication",
    summary:
      "Protect email, online banking, social media, and government service accounts using password managers, multi-factor authentication (MFA), passkeys, and recovery keys.",
    audience: ["individuals"],
    audienceLabel: "Individuals and families",
    category: "personal-cyber-safety",
    categoryLabel: "Personal cyber safety",
    readingTimeMinutes: 5,
    primarySource: "TT-CSIRT Cyber Safety Tips & UK NCSC Identity and Access",
    lastReviewed: "12 August 2026",
    hasChecklist: true,
  },
  {
    slug: "online-child-safety",
    title: "Online child safety and digital protection strategies",
    summary:
      "Set parental controls, manage privacy settings on games and social apps, and help children recognise and report online abuse, cyberbullying, or harmful contact.",
    audience: ["individuals"],
    audienceLabel: "Parents and educators",
    category: "personal-cyber-safety",
    categoryLabel: "Personal cyber safety",
    readingTimeMinutes: 7,
    primarySource: "UNICEF Child Online Protection Guidelines & TT-CSIRT Community Safety",
    lastReviewed: "20 July 2026",
    hasChecklist: true,
  },

  // ==========================================
  // Branch 2: Organisations & Businesses
  // ==========================================
  {
    slug: "cyber-security-baseline",
    title: "Cyber security baseline for organisations",
    summary:
      "Use practical steps to protect accounts, update systems, secure devices, back up information and prepare to respond to incidents.",
    audience: ["organisations"],
    audienceLabel: "Organisations and businesses",
    category: "enterprise-defence",
    categoryLabel: "Enterprise defence",
    readingTimeMinutes: 8,
    primarySource: "NIST CSF 2.0 & UK NCSC 10 Steps to Cyber Security",
    lastReviewed: "25 August 2026",
    isFeatured: true,
    hasChecklist: true,
  },
  {
    slug: "assessing-and-managing-vulnerabilities",
    title: "Assess and manage security weaknesses",
    summary: "Find weaknesses in important systems, understand their likely effect and plan proportionate actions to reduce risk.",
    audience: ["organisations", "technical"],
    audienceLabel: "Organisations and technical teams",
    category: "enterprise-defence",
    categoryLabel: "Enterprise defence",
    readingTimeMinutes: 5,
    primarySource: "TT-CSIRT service information and CISA vulnerability prioritisation guidance",
    lastReviewed: "8 October 2026",
    hasChecklist: false,
  },
  {
    slug: "understanding-your-exposure",
    title: "Understand your organisation's internet-facing systems",
    summary: "Identify public-facing systems, review why they are exposed and decide how to manage related security risks.",
    audience: ["organisations", "technical"],
    audienceLabel: "Organisations and technical teams",
    category: "enterprise-defence",
    categoryLabel: "Enterprise defence",
    readingTimeMinutes: 5,
    primarySource: "UK NCSC external attack surface management guidance",
    lastReviewed: "8 October 2026",
    hasChecklist: false,
  },
  {
    slug: "business-continuity-and-cyber-recovery",
    title: "Prepare for cyber disruption and recovery",
    summary: "Set recovery priorities, protect and test backups, define responsibilities and practise how your organisation will respond to disruption.",
    audience: ["organisations", "government"],
    audienceLabel: "Organisations and public bodies",
    category: "enterprise-defence",
    categoryLabel: "Enterprise defence",
    readingTimeMinutes: 6,
    primarySource: "TT-CSIRT capacity-building service information",
    lastReviewed: "8 October 2026",
    hasChecklist: false,
  },
  {
    slug: "ransomware-prevention-response",
    title: "Ransomware prevention, defence, and emergency response",
    summary:
      "Reduce ransomware risk with offline backups, network segmentation, and access controls, and follow step-by-step containment, recovery, and reporting actions during an attack.",
    audience: ["organisations", "government", "technical"],
    audienceLabel: "Enterprises and technical teams",
    category: "enterprise-defence",
    categoryLabel: "Enterprise defence",
    readingTimeMinutes: 10,
    primarySource: "TT-CSIRT Ransomware Prevention and Response & CISA #StopRansomware",
    lastReviewed: "28 August 2026",
    isFeatured: true,
    hasChecklist: true,
  },
  {
    slug: "incident-response-planning",
    title: "Incident response planning and readiness for enterprises",
    summary:
      "Prepare an incident response plan, assign team roles, define severity levels, run tabletop exercises, and establish escalation procedures before an incident occurs.",
    audience: ["organisations", "government"],
    audienceLabel: "Organisations and management",
    category: "enterprise-defence",
    categoryLabel: "Enterprise defence",
    readingTimeMinutes: 7,
    primarySource: "NIST SP 800-61 Rev. 3 & TT-CSIRT Incident Response Services",
    lastReviewed: "15 August 2026",
    hasChecklist: true,
  },
  {
    slug: "vulnerability-management",
    title: "Vulnerability management and patching lifecycle",
    summary:
      "Track hardware and software on your network, scan regularly for known vulnerabilities, prioritise fixes for actively exploited flaws, and test patches safely.",
    audience: ["organisations", "technical"],
    audienceLabel: "Technical teams and IT managers",
    category: "enterprise-defence",
    categoryLabel: "Enterprise defence",
    readingTimeMinutes: 7,
    primarySource: "UK NCSC Vulnerability Management & NIST SP 800-40 Rev. 4",
    lastReviewed: "22 August 2026",
    hasChecklist: true,
  },
  {
    slug: "secure-remote-access",
    title: "Secure remote access and hybrid work protection",
    summary:
      "Secure VPN gateways and remote desktop services, require multi-factor authentication for remote logins, and protect organisational data on laptops and mobile devices.",
    audience: ["organisations", "technical"],
    audienceLabel: "IT administrators and employers",
    category: "enterprise-defence",
    categoryLabel: "Enterprise defence",
    readingTimeMinutes: 6,
    primarySource: "NIST SP 800-46 Rev. 2 & UK NCSC Remote Access",
    lastReviewed: "10 August 2026",
    hasChecklist: true,
  },
  {
    slug: "supply-chain-security",
    title: "Third-party and cyber supply-chain risk management",
    summary:
      "Assess security risks across software vendors, cloud providers, and managed service providers, set security requirements in contracts, and limit third-party network access.",
    audience: ["organisations", "government"],
    audienceLabel: "Procurement, legal, and security leaders",
    category: "enterprise-defence",
    categoryLabel: "Enterprise defence",
    readingTimeMinutes: 7,
    primarySource: "UK NCSC Supply Chain Security (12 Principles) & NIST CSF 2.0 C-SCRM",
    lastReviewed: "19 August 2026",
    hasChecklist: true,
  },
  {
    slug: "data-protection-security",
    title: "Data protection and security under Trinidad and Tobago law",
    summary:
      "Apply technical and organisational safeguards for personal data processing, including data minimisation, encryption, role-based access control, retention schedules, and breach handling.",
    audience: ["organisations", "government"],
    audienceLabel: "Data controllers, legal officers, and IT teams",
    category: "enterprise-defence",
    categoryLabel: "Enterprise defence",
    readingTimeMinutes: 8,
    primarySource: "Trinidad and Tobago Data Protection Act & TT-CSIRT DPA Guidance",
    lastReviewed: "1 September 2026",
    isFeatured: true,
    hasChecklist: true,
  },
  {
    slug: "backup-recovery",
    title: "Resilient backup and disaster recovery architecture",
    summary:
      "Build ransomware-resilient backups using the 3-2-1 rule with offline or immutable copies, encrypt backup storage, and test system restoration regularly.",
    audience: ["organisations", "technical"],
    audienceLabel: "System administrators and infrastructure engineers",
    category: "enterprise-defence",
    categoryLabel: "Enterprise defence",
    readingTimeMinutes: 6,
    primarySource: "UK NCSC Ransomware-Resistant Backups & NIST SP 800-34 Rev. 1",
    lastReviewed: "17 August 2026",
    hasChecklist: true,
  },

  // ==========================================
  // Branch 3: Government & Critical Infrastructure
  // ==========================================
  {
    slug: "government-cyber-security-baseline",
    title: "Government cyber security baseline for ministries and statutory bodies",
    summary:
      "Apply core security controls across ministries and statutory agencies, including email domain authentication (SPF, DKIM, and DMARC), privileged access management, and asset tracking.",
    audience: ["government"],
    audienceLabel: "Government ministries and statutory agencies",
    category: "critical-infrastructure",
    categoryLabel: "Government and critical infrastructure",
    readingTimeMinutes: 9,
    primarySource: "Trinidad and Tobago National Cyber Security Strategy & NIST CSF 2.0",
    lastReviewed: "27 August 2026",
    isFeatured: true,
    hasChecklist: true,
  },
  {
    slug: "incident-reporting-escalation",
    title: "National incident reporting and escalation procedures",
    summary:
      "Know when and how to report a cyber security incident to TT-CSIRT, what technical evidence and logs to preserve, and how Traffic Light Protocol (TLP) handling works.",
    audience: ["government", "organisations"],
    audienceLabel: "Public officers and corporate incident managers",
    category: "critical-infrastructure",
    categoryLabel: "Government and critical infrastructure",
    readingTimeMinutes: 6,
    primarySource: "TT-CSIRT Incident Response Framework & FIRST CSIRT Guidelines",
    lastReviewed: "30 August 2026",
    hasChecklist: true,
  },
  {
    slug: "critical-infrastructure-protection",
    title: "Critical information infrastructure protection (CIIP)",
    summary:
      "Protect essential services in energy, water, telecommunications, finance, and transport by separating operational technology (OT) and SCADA systems from corporate networks.",
    audience: ["government", "organisations"],
    audienceLabel: "Critical infrastructure operators",
    category: "critical-infrastructure",
    categoryLabel: "Government and critical infrastructure",
    readingTimeMinutes: 8,
    primarySource: "National Cyber Security Strategy & NIST SP 800-82 (OT/ICS Security)",
    lastReviewed: "24 August 2026",
    hasChecklist: true,
  },
  {
    slug: "internet-facing-service-security",
    title: "Security controls for internet-facing systems and public gateways",
    summary:
      "Protect public websites, citizen portals, APIs, and DNS infrastructure using TLS encryption, web application firewalls, DDoS mitigation, and timely patching.",
    audience: ["government", "organisations", "technical"],
    audienceLabel: "Web administrators and DevOps engineers",
    category: "critical-infrastructure",
    categoryLabel: "Government and critical infrastructure",
    readingTimeMinutes: 7,
    primarySource: "TT-CSIRT Service Hardening Guidelines & UK NCSC External Exposure",
    lastReviewed: "16 August 2026",
    hasChecklist: true,
  },
  {
    slug: "logging-monitoring",
    title: "Centralized logging and security monitoring standards",
    summary:
      "Collect authentication, network, and endpoint logs in a central system, synchronise system clocks, protect log integrity, and configure alerts for suspicious activity.",
    audience: ["government", "organisations", "technical"],
    audienceLabel: "Security Operations Centers (SOC) and sysadmins",
    category: "critical-infrastructure",
    categoryLabel: "Government and critical infrastructure",
    readingTimeMinutes: 7,
    primarySource: "UK NCSC Logging and Monitoring & NIST SP 800-92",
    lastReviewed: "21 August 2026",
    hasChecklist: true,
  },

  // ==========================================
  // Branch 4: Technical Guidance & Standards
  // ==========================================
  {
    slug: "secure-configuration",
    title: "Secure system configuration and architecture baselines",
    summary:
      "Remove default accounts and unused services, disable outdated protocols such as SMBv1 and TLS 1.0/1.1, enforce least privilege, and monitor systems for configuration changes.",
    audience: ["technical", "organisations"],
    audienceLabel: "Security architects and infrastructure leads",
    category: "technical-standards",
    categoryLabel: "Technical standards",
    readingTimeMinutes: 8,
    primarySource: "NIST SP 800-128 & UK NCSC Architecture and Configuration",
    lastReviewed: "23 August 2026",
    hasChecklist: true,
  },
  {
    slug: "national-cyber-security-incident-taxonomy",
    title: "National cyber security incident taxonomy and classification",
    summary:
      "Understand the categories and subcategories TT-CSIRT uses to classify reported cyber incidents, including malicious code, phishing, intrusions, and service availability.",
    audience: ["technical", "government", "organisations"],
    audienceLabel: "Incident handlers and security analysts",
    category: "technical-standards",
    categoryLabel: "Technical standards",
    readingTimeMinutes: 6,
    primarySource: "TT-CSIRT National Cyber Security Incident Taxonomy & FIRST Standards",
    lastReviewed: "31 August 2026",
    isFeatured: true,
    hasChecklist: false,
  },
];

/**
 * Returns summary by slug, supporting common aliases
 */
export function getGuidanceSummaryBySlug(slug: string): GuidanceSummary | undefined {
  // Support historical and convenience aliases
  const canonicalSlug =
    slug === "ransomware-response-guide" || slug === "ransomware"
      ? "ransomware-prevention-response"
      : slug === "dpa-privacy-principles" || slug === "dpa"
      ? "data-protection-security"
      : slug === "incident-response" || slug === "incident-response-guide"
      ? "incident-response-planning"
      : slug === "taxonomy" || slug === "incident-taxonomy"
      ? "national-cyber-security-incident-taxonomy"
      : slug === "child-safety" || slug === "child-protection"
      ? "online-child-safety"
      : slug;

  return GUIDANCE_SUMMARIES.find((item) => item.slug === canonicalSlug);
}

/**
 * Filters summaries by audience
 */
export function getGuidanceSummariesByAudience(audience: GuidanceAudience): GuidanceSummary[] {
  return GUIDANCE_SUMMARIES.filter((item) => item.audience.includes(audience));
}

/**
 * Filters summaries by category
 */
export function getGuidanceSummariesByCategory(category: GuidanceCategory): GuidanceSummary[] {
  return GUIDANCE_SUMMARIES.filter((item) => item.category === category);
}

/**
 * Returns featured guidance articles
 */
export function getFeaturedGuidanceSummaries(): GuidanceSummary[] {
  return GUIDANCE_SUMMARIES.filter((item) => item.isFeatured);
}
