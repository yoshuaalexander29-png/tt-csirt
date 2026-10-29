/**
 * Cyber Security Incident Taxonomy
 *
 * Official TT-CSIRT authoritative incident classification taxonomy.
 * This artifact defines the standard main categories, sub-categories,
 * and technical descriptions for cyber security incident triage,
 * handling, and coordination across the Republic of Trinidad and Tobago.
 *
 * GOVERNANCE:
 * - This is the single authoritative taxonomy registry in the codebase.
 * - Exact official terminology and capitalization are strictly preserved.
 * - Statistics reporting categories and this taxonomy are distinct classification
 *   layers connected via a controlled, validated mapping layer.
 */

export const TAXONOMY_NAME = "Cyber Security Incident Taxonomy" as const;

export type TaxonomyCategory =
  | "Abusive Content"
  | "Malicious Code"
  | "Information Gathering"
  | "Intrusion Attempts"
  | "Intrusions"
  | "Availability"
  | "Information Content Security"
  | "Fraud"
  | "Vulnerable"
  | "Other"
  | "Test";

export type TaxonomySubcategory =
  // Abusive Content
  | "Spam"
  | "Harmful Speech"
  | "Child Sexual Exploitation / Sexual / Violent Content"
  // Malicious Code
  | "Infected System"
  | "C2 Server"
  | "Malware Distribution"
  | "Malware Configuration"
  // Information Gathering
  | "Scanning"
  | "Sniffing"
  | "Social Engineering"
  // Intrusion Attempts
  | "Exploitation of Known Vulnerabilities"
  | "Login Attempts"
  | "New Attack Signature"
  // Intrusions
  | "Privileged Account Compromise"
  | "Unprivileged Account Compromise"
  | "Application Compromise"
  | "System Compromise"
  | "Burglary"
  // Availability
  | "DoS"
  | "DDoS"
  | "Misconfiguration"
  | "Sabotage"
  | "Outage"
  // Information Content Security
  | "Unauthorized Access to Information"
  | "Unauthorized Modification"
  | "Data Loss"
  | "Leak of Confidential Information"
  // Fraud
  | "Unauthorized Use of Resources"
  | "Copyright"
  | "Masquerade"
  | "Phishing"
  // Vulnerable
  | "Weak Cryptography"
  | "DDoS Amplifier"
  | "Potentially Unwanted Accessible Services"
  | "Information Disclosure"
  | "Vulnerable System"
  // Other
  | "Uncategorized"
  | "Undetermined"
  // Test
  | "Test";

export interface TaxonomyEntry {
  readonly id: string;
  readonly category: TaxonomyCategory;
  readonly subcategory: TaxonomySubcategory;
  readonly description: string;
}

/**
 * Authoritative Registry of the Cyber Security Incident Taxonomy
 */
export const CYBER_SECURITY_INCIDENT_TAXONOMY: readonly TaxonomyEntry[] = [
  // 1. Abusive Content
  {
    id: "abusive-content-spam",
    category: "Abusive Content",
    subcategory: "Spam",
    description: "Unsolicited bulk messaging or electronic communications sent indiscriminately across communication channels."
  },
  {
    id: "abusive-content-harmful-speech",
    category: "Abusive Content",
    subcategory: "Harmful Speech",
    description: "Hate speech, cyber-harassment, online defamation, or targeted violent threats communicated via digital platforms."
  },
  {
    id: "abusive-content-csem",
    category: "Abusive Content",
    subcategory: "Child Sexual Exploitation / Sexual / Violent Content",
    description: "Production, transmission, hosting, or dissemination of child sexual abuse material, non-consensual sexual content, or violent extremist media."
  },

  // 2. Malicious Code
  {
    id: "malicious-code-infected-system",
    category: "Malicious Code",
    subcategory: "Infected System",
    description: "Endpoint or server compromised by malware execution, including trojans, worms, ransomware payloads, or spyware."
  },
  {
    id: "malicious-code-c2-server",
    category: "Malicious Code",
    subcategory: "C2 Server",
    description: "Command and control infrastructure directing botnets or communicating with compromised internal endpoints."
  },
  {
    id: "malicious-code-distribution",
    category: "Malicious Code",
    subcategory: "Malware Distribution",
    description: "Infrastructure, web servers, or download repositories actively hosting or distributing malicious software."
  },
  {
    id: "malicious-code-configuration",
    category: "Malicious Code",
    subcategory: "Malware Configuration",
    description: "Configuration files, command scripts, droppers, or injection profiles supporting active malware operations."
  },

  // 3. Information Gathering
  {
    id: "info-gathering-scanning",
    category: "Information Gathering",
    subcategory: "Scanning",
    description: "Systematic automated probing of network ports, IP ranges, or applications to identify active services and vulnerabilities."
  },
  {
    id: "info-gathering-sniffing",
    category: "Information Gathering",
    subcategory: "Sniffing",
    description: "Passive interception and monitoring of network communications to capture unencrypted credentials or sensitive payload data."
  },
  {
    id: "info-gathering-social-engineering",
    category: "Information Gathering",
    subcategory: "Social Engineering",
    description: "Psychological manipulation of individuals into divulging confidential information, access credentials, or performing actions compromising security."
  },

  // 4. Intrusion Attempts
  {
    id: "intrusion-attempts-known-vuln",
    category: "Intrusion Attempts",
    subcategory: "Exploitation of Known Vulnerabilities",
    description: "Targeted attempts to exploit publicly known software, firmware, or hardware vulnerabilities (e.g., CVEs) that have not resulted in confirmed access."
  },
  {
    id: "intrusion-attempts-login",
    category: "Intrusion Attempts",
    subcategory: "Login Attempts",
    description: "Brute-force, credential stuffing, password spraying, or dictionary attempts targeting authentication endpoints without confirmed account takeover."
  },
  {
    id: "intrusion-attempts-new-signature",
    category: "Intrusion Attempts",
    subcategory: "New Attack Signature",
    description: "Exploitation attempts utilizing zero-day vulnerabilities, novel evasion methods, or previously uncatalogued attack signatures."
  },

  // 5. Intrusions
  {
    id: "intrusions-privileged-account",
    category: "Intrusions",
    subcategory: "Privileged Account Compromise",
    description: "Unauthorized access or takeover of administrative, root, domain admin, or elevated privilege accounts."
  },
  {
    id: "intrusions-unprivileged-account",
    category: "Intrusions",
    subcategory: "Unprivileged Account Compromise",
    description: "Unauthorized access to standard user accounts, enterprise mailboxes, or baseline identity directory accounts."
  },
  {
    id: "intrusions-application-compromise",
    category: "Intrusions",
    subcategory: "Application Compromise",
    description: "Unauthorized execution, code injection (e.g., SQLi, XSS), or control attained within web applications or service software layers."
  },
  {
    id: "intrusions-system-compromise",
    category: "Intrusions",
    subcategory: "System Compromise",
    description: "Full or partial unauthorized control obtained over host operating systems, servers, virtualization hosts, or operational infrastructure."
  },
  {
    id: "intrusions-burglary",
    category: "Intrusions",
    subcategory: "Burglary",
    description: "Physical unauthorized intrusion into facilities, data centers, or office spaces resulting in the tampering, theft, or access to cyber assets."
  },

  // 6. Availability
  {
    id: "availability-dos",
    category: "Availability",
    subcategory: "DoS",
    description: "Denial of service originating from a single source host or network stream exhausting target compute, bandwidth, or memory capacity."
  },
  {
    id: "availability-ddos",
    category: "Availability",
    subcategory: "DDoS",
    description: "Distributed denial of service coordinating multiple compromised endpoints or botnets to flood and disable target resources."
  },
  {
    id: "availability-misconfiguration",
    category: "Availability",
    subcategory: "Misconfiguration",
    description: "Operational or service downtime caused by incorrect administrative configurations, routing errors, or faulty production changes."
  },
  {
    id: "availability-sabotage",
    category: "Availability",
    subcategory: "Sabotage",
    description: "Deliberate and intentional destruction, disconnection, or logical disabling of critical computing systems or network infrastructure."
  },
  {
    id: "availability-outage",
    category: "Availability",
    subcategory: "Outage",
    description: "Unplanned operational service disruption or system unavailability caused by hardware failure, environmental conditions, or utility outages."
  },

  // 7. Information Content Security
  {
    id: "content-security-unauthorized-access",
    category: "Information Content Security",
    subcategory: "Unauthorized Access to Information",
    description: "Viewing, accessing, or extracting sensitive, restricted, or personal data without legitimate authorization."
  },
  {
    id: "content-security-unauthorized-modification",
    category: "Information Content Security",
    subcategory: "Unauthorized Modification",
    description: "Unauthorized tampering with, alteration, defacement, or falsification of digital records, public web assets, or database information."
  },
  {
    id: "content-security-data-loss",
    category: "Information Content Security",
    subcategory: "Data Loss",
    description: "Permanent or temporary destruction, deletion, or corruption of data assets without deliberate unauthorized exfiltration."
  },
  {
    id: "content-security-confidential-leak",
    category: "Information Content Security",
    subcategory: "Leak of Confidential Information",
    description: "Exposure, dissemination, or publication of confidential records, trade secrets, citizen data, or classified records to unauthorized parties."
  },

  // 8. Fraud
  {
    id: "fraud-unauthorized-resources",
    category: "Fraud",
    subcategory: "Unauthorized Use of Resources",
    description: "Unauthorized appropriation of computing infrastructure, bandwidth, or cloud services (e.g., unauthorized cryptocurrency mining, proxy nodes)."
  },
  {
    id: "fraud-copyright",
    category: "Fraud",
    subcategory: "Copyright",
    description: "Direct infringement, unauthorized duplication, or unlawful distribution of copyrighted digital assets, proprietary software, or media."
  },
  {
    id: "fraud-masquerade",
    category: "Fraud",
    subcategory: "Masquerade",
    description: "Deceptive impersonation of legitimate individuals, organizations, email domains, or government entities to defraud targets (includes Business Email Compromise)."
  },
  {
    id: "fraud-phishing",
    category: "Fraud",
    subcategory: "Phishing",
    description: "Fraudulent electronic communications or deceptive websites mimicking trusted entities to trick individuals into disclosing credentials, financial information, or tokens."
  },

  // 9. Vulnerable
  {
    id: "vulnerable-weak-cryptography",
    category: "Vulnerable",
    subcategory: "Weak Cryptography",
    description: "Active use of deprecated, mathematically broken, or vulnerable cryptographic ciphers, key lengths, or protocols (e.g., SSL 3.0, RC4, single DES)."
  },
  {
    id: "vulnerable-ddos-amplifier",
    category: "Vulnerable",
    subcategory: "DDoS Amplifier",
    description: "Publicly accessible services (e.g., open DNS resolvers, NTP servers, SNMP daemons) susceptible to weaponization for reflection or amplification attacks."
  },
  {
    id: "vulnerable-unwanted-services",
    category: "Vulnerable",
    subcategory: "Potentially Unwanted Accessible Services",
    description: "Insecure or unencrypted management services (e.g., Telnet, unauthenticated databases, exposed administrative interfaces) exposed directly to the Internet."
  },
  {
    id: "vulnerable-information-disclosure",
    category: "Vulnerable",
    subcategory: "Information Disclosure",
    description: "Unintentional exposure of sensitive system banners, stack traces, internal network topologies, or directory listings to unauthorized parties."
  },
  {
    id: "vulnerable-vulnerable-system",
    category: "Vulnerable",
    subcategory: "Vulnerable System",
    description: "Software packages, operating systems, or firmware installations remaining unpatched against disclosed security vulnerabilities."
  },

  // 10. Other
  {
    id: "other-uncategorized",
    category: "Other",
    subcategory: "Uncategorized",
    description: "Incident notifications that do not match the defined criteria of other specific taxonomy categories."
  },
  {
    id: "other-undetermined",
    category: "Other",
    subcategory: "Undetermined",
    description: "Incident notifications where available forensic evidence or notification detail is insufficient to assign a definitive category during active assessment."
  },

  // 11. Test
  {
    id: "test-test",
    category: "Test",
    subcategory: "Test",
    description: "Authorized penetration testing, tabletop exercises, verification drills, or synthetic notifications registered for evaluation and validation purposes."
  }
] as const;

/**
 * All valid official categories as an immutable array
 */
export const OFFICIAL_TAXONOMY_CATEGORIES: readonly TaxonomyCategory[] = [
  "Abusive Content",
  "Malicious Code",
  "Information Gathering",
  "Intrusion Attempts",
  "Intrusions",
  "Availability",
  "Information Content Security",
  "Fraud",
  "Vulnerable",
  "Other",
  "Test"
];

/**
 * Lookup map for fast validation: category -> Set of subcategories
 */
export const OFFICIAL_TAXONOMY_MAP: ReadonlyMap<TaxonomyCategory, ReadonlySet<TaxonomySubcategory>> = (() => {
  const map = new Map<TaxonomyCategory, Set<TaxonomySubcategory>>();
  for (const entry of CYBER_SECURITY_INCIDENT_TAXONOMY) {
    if (!map.has(entry.category)) {
      map.set(entry.category, new Set());
    }
    map.get(entry.category)!.add(entry.subcategory);
  }
  return map;
})();

/**
 * Validates whether a category exists in the official Cyber Security Incident Taxonomy.
 */
export function isValidTaxonomyCategory(category: string): category is TaxonomyCategory {
  return OFFICIAL_TAXONOMY_MAP.has(category as TaxonomyCategory);
}

/**
 * Validates whether a category and subcategory pair exists in the official Cyber Security Incident Taxonomy.
 */
export function isValidTaxonomyEntry(category: string, subcategory: string): boolean {
  const subs = OFFICIAL_TAXONOMY_MAP.get(category as TaxonomyCategory);
  if (!subs) return false;
  return subs.has(subcategory as TaxonomySubcategory);
}

/**
 * Retrieves an official taxonomy entry by category and subcategory.
 */
export function getTaxonomyEntry(
  category: TaxonomyCategory,
  subcategory: TaxonomySubcategory
): TaxonomyEntry | undefined {
  return CYBER_SECURITY_INCIDENT_TAXONOMY.find(
    (e) => e.category === category && e.subcategory === subcategory
  );
}

/**
 * Returns all subcategories for an official category.
 */
export function getSubcategoriesForCategory(category: TaxonomyCategory): TaxonomySubcategory[] {
  return CYBER_SECURITY_INCIDENT_TAXONOMY.filter((e) => e.category === category).map(
    (e) => e.subcategory
  );
}
