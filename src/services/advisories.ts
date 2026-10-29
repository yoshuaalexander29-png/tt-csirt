// TT-CSIRT WordPress REST API Adapter
// Direct browser-side fetch, schema validation, and deterministic content normalization for /advisories
import {
  isAuthoritativeWordPressAdvisory,
  WP_CATEGORIES,
} from "./upstream/wordpress/taxonomy.ts";
import {
  WP_HEADERS,
  WP_LISTING_FIELDS,
  WP_DETAIL_FIELDS,
  buildWordPressPostsEndpoint,
  buildWordPressPostPermalink,
} from "./upstream/wordpress/endpoints.ts";

export interface Advisory {
  id: number;
  slug?: string;
  title: string; // Plain-English presentation title, e.g. "Critical Palo Alto Networks PAN-OS vulnerability"
  rawTitle: string; // Authoritative WordPress title, e.g. "TT-CSIRT – 456.08.05.26 – CYBERSECURITY ADVISORY: Critical Palo Alto Networks PAN-OS Vulnerability (CVE-2026-0300)"
  referenceNumber?: string; // Optional administrative publication reference, e.g. "TT-CSIRT 456.08.05.26"
  cveList?: string[]; // Authoritative list of CVE identifiers extracted from source
  date: string; // Human-readable date, e.g. "20 July 2026"
  rawDate: string; // ISO date string
  sourceExcerpt: string; // Authoritative WordPress excerpt (stripped of raw HTML)
  displaySummary: string; // Deterministically normalized plain-English lead description
  url: string; // Canonical URL to the authoritative TT-CSIRT publication
  categoryName?: "Advisory" | "Alert";
}

export interface AdvisoryDetail {
  id: number;
  slug: string;
  title: string; // Plain-English presentation title
  rawTitle: string; // Authoritative WordPress title
  referenceNumber?: string; // Optional administrative publication reference, e.g. "TT-CSIRT 456.08.05.26"
  cveList?: string[]; // Authoritative list of CVE identifiers extracted from source
  date: string; // Human-readable date, e.g. "20 July 2026"
  rawDate: string; // ISO publication date
  modifiedDate?: string; // Human-readable modified date
  rawModifiedDate?: string; // ISO modified date
  contentHtml: string; // Authoritative WordPress rendered HTML content
  sourceExcerpt: string; // Authoritative WordPress excerpt
  displaySummary: string; // Deterministically normalized plain-English lead description
  url: string; // Canonical URL to the authoritative TT-CSIRT publication
  categoryName: "Advisory" | "Alert";
}

export type AdvisoryFetchStatus = "loading" | "success" | "error";

export interface AdvisoryFetchResult {
  status: AdvisoryFetchStatus;
  advisories: Advisory[];
  totalRecords?: number;
  totalPages?: number;
  currentPage?: number;
  errorMessage?: string;
}

export interface AdvisoryDetailFetchResult {
  status: AdvisoryFetchStatus;
  advisory?: AdvisoryDetail;
  errorMessage?: string;
}

// Explicit fields requested for listing queries (delegated to upstream adapter)
export const TTCSIRT_LISTING_FIELDS = WP_LISTING_FIELDS;

// Explicit fields requested for full individual advisory detail queries (delegated to upstream adapter)
export const TTCSIRT_DETAIL_FIELDS = WP_DETAIL_FIELDS;

export const TTCSIRT_ADVISORY_ENDPOINT = buildWordPressPostsEndpoint({
  fields: TTCSIRT_LISTING_FIELDS,
  categories: [
    WP_CATEGORIES.ADVISORY,
    WP_CATEGORIES.ALERT,
    WP_CATEGORIES.SECURITY_ADVISORIES,
  ],
});

/**
 * Safely decodes HTML entities commonly present in WordPress JSON feeds
 */
export function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8217;/g, "’")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\[&hellip;\]/g, "")
    .replace(/\[\.\.\.\]/g, "");
}

/**
 * Known proper nouns, vendors, acronyms, and product names
 * that must preserve their specific casing in titles and headings.
 */
export const PRESERVED_TERMS: Record<string, string> = {
  // Vendor / Product names
  sharepoint: "SharePoint",
  wordpress: "WordPress",
  macos: "macOS",
  ios: "iOS",
  windows: "Windows",
  linux: "Linux",
  android: "Android",
  chrome: "Chrome",
  edge: "Edge",
  firefox: "Firefox",
  safari: "Safari",
  cisco: "Cisco",
  fortinet: "Fortinet",
  fortigate: "FortiGate",
  fortios: "FortiOS",
  fortiweb: "FortiWeb",
  fortiswitch: "FortiSwitch",
  fortimanager: "FortiManager",
  fortiproxy: "FortiProxy",
  fortianalyzer: "FortiAnalyzer",
  fortiap: "FortiAP",
  forticlient: "FortiClient",
  fortimail: "FortiMail",
  fortiedr: "FortiEDR",
  fortisandbox: "FortiSandbox",
  adobe: "Adobe",
  acrobat: "Acrobat",
  reader: "Reader",
  photoshop: "Photoshop",
  illustrator: "Illustrator",
  microsoft: "Microsoft",
  office: "Office",
  exchange: "Exchange",
  outlook: "Outlook",
  azure: "Azure",
  teams: "Teams",
  powershell: "PowerShell",
  google: "Google",
  apple: "Apple",
  oracle: "Oracle",
  java: "Java",
  apache: "Apache",
  tomcat: "Tomcat",
  nginx: "NGINX",
  vmware: "VMware",
  vcenter: "vCenter",
  esxi: "ESXi",
  citrix: "Citrix",
  netscaler: "NetScaler",
  sonicwall: "SonicWall",
  sonicos: "SonicOS",
  ivanti: "Ivanti",
  palo: "Palo",
  alto: "Alto",
  paloalto: "Palo Alto",
  networks: "Networks",
  "pan-os": "PAN-OS",
  panos: "PAN-OS",
  prisma: "Prisma",
  atlassian: "Atlassian",
  confluence: "Confluence",
  jira: "Jira",
  crowdstrike: "CrowdStrike",
  falcon: "Falcon",
  solarwinds: "SolarWinds",
  orion: "Orion",
  whatsapp: "WhatsApp",
  doppelpaymer: "DoppelPaymer",
  "shai-hulud": "Shai-Hulud",
  freepbx: "FreePBX",
  trinidad: "Trinidad",
  tobago: "Tobago",
  russian: "Russian",
  russia: "Russia",
  korean: "Korean",
  korea: "Korea",
  north: "North",
  south: "South",
  chinese: "Chinese",
  china: "China",
  iranian: "Iranian",
  iran: "Iran",
  american: "American",
  workfromhome: "WorkFromHome",
  workspace: "Workspace",
  fgfmd: "fgfmd",
  "e-tax": "e-Tax",
  "covid-19": "COVID-19",
  covid: "COVID",
  "0-day": "0-day",
  "zero-day": "0-day",

  // Acronyms
  cve: "CVE",
  cwe: "CWE",
  cvss: "CVSS",
  rce: "RCE",
  amsi: "AMSI",
  iis: "IIS",
  mdav: "MDAV",
  edr: "EDR",
  ioc: "IOC",
  iocs: "IOCs",
  ip: "IP",
  ips: "IPs",
  cisa: "CISA",
  nist: "NIST",
  nvd: "NVD",
  api: "API",
  apis: "APIs",
  sql: "SQL",
  gui: "GUI",
  url: "URL",
  urls: "URLs",
  http: "HTTP",
  https: "HTTPS",
  ftp: "FTP",
  dns: "DNS",
  ssl: "SSL",
  tls: "TLS",
  ssh: "SSH",
  vpn: "VPN",
  vpns: "VPNs",
  waf: "WAF",
  xss: "XSS",
  ssrf: "SSRF",
  dos: "DoS",
  ddos: "DDoS",
  mitm: "MitM",
  os: "OS",
  ltsc: "LTSC",
  kb: "KB",
  mof: "MoF",
  mhs: "MHS",
  csirt: "CSIRT",
  "tt-csirt": "TT-CSIRT",
  ttcsirt: "TT-CSIRT",
  cert: "CERT",
  ic3: "IC3",
};

/**
 * Extracts all unique CVE identifiers from arbitrary text.
 */
export function extractCves(text?: string): string[] {
  if (!text) return [];
  const matches = text.match(/\bCVE-\d{4}-\d{4,}\b/gi);
  if (!matches) return [];
  const unique = Array.from(new Set(matches.map((c) => c.toUpperCase())));
  return unique;
}

/**
 * Extracts the primary CVE mentioned directly in the title if present.
 */
export function extractPrimaryCve(rawTitle?: string): string | undefined {
  if (!rawTitle) return undefined;
  const decoded = decodeHtmlEntities(rawTitle);
  const match = decoded.match(/\bCVE-\d{4}-\d{4,}\b/i);
  return match ? match[0].toUpperCase() : undefined;
}

/**
 * Extracts administrative publication reference (e.g. "TT-CSIRT 459.20.07.26")
 * from authoritative WordPress title if present.
 */
export function extractAdministrativeReference(rawTitle: string): string | undefined {
  if (!rawTitle) return undefined;
  const decoded = decodeHtmlEntities(rawTitle).trim();

  // Match patterns like "TT-CSIRT – 459.20.07.26 – ..." or "TTCSIRT 459.20.07.26 ..."
  const match = decoded.match(/^(?:TT\s*[-–—.]*\s*CSIRT\s*[-–—.]*\s*)?(\d{2,4}\.\d{2}\.\d{2}\.\d{2})/i);
  if (match && match[1]) {
    return `TT-CSIRT ${match[1]}`;
  }

  const numOnlyMatch = decoded.match(/^TT\s*[-–—.]*\s*CSIRT\s*[-–—.]*\s*#?(\d+)\b/i);
  if (numOnlyMatch && numOnlyMatch[1]) {
    return `TT-CSIRT #${numOnlyMatch[1]}`;
  }

  return undefined;
}

/**
 * Deterministically normalizes authoritative WordPress advisory titles into
 * user-focused GOV.UK plain-English headings.
 *
 * Removes:
 * - Administrative publication prefixes (e.g. "TT-CSIRT – 459.20.07.26 – ", "TTCSIRT-408.31.10.22:")
 * - Generic document-type prefixes when followed by substantive title (e.g. "CYBERSECURITY ADVISORY: Critical...")
 * - CVE identifiers from presentation titles (e.g. "(CVE-2026-58644)" is removed from title and preserved in metadata/summary)
 *
 * Preserves:
 * - CWE identifiers (e.g. "CWE-79")
 * - Vendor and product names (e.g. "SharePoint", "Microsoft", "Google Chrome", "FortiOS", "Palo Alto Networks", "PAN-OS")
 * - Technical identifiers, version strings, KB numbers, and acronyms (e.g. "KB5002756", "AMSI", "RCE")
 * - Generic titles if no further subject follows (e.g. "Phishing Alert" -> "Phishing alert")
 */
export function cleanHumanTitle(rawTitle: string): string {
  if (!rawTitle) return "";
  let cleaned = decodeHtmlEntities(rawTitle).trim();

  // 1. Remove TT-CSIRT publication prefixes, reference numbers, and administrative tags
  let prev = "";
  while (prev !== cleaned) {
    prev = cleaned;
    cleaned = cleaned.replace(/^TT\s*[-–—.]*\s*CSIRT(?:\s+advisory)?\s*[-–—.]*\s*\d+[\d.]*\s*[-–—:.]*\s*/i, "");
    cleaned = cleaned.replace(/^TT\s*[-–—.]*\s*CSIRT(?:\s+advisory)?\s*[-–—:.]*\s*/i, "");
    cleaned = cleaned.replace(/^\d{2,4}\.\d{2}\.\d{2}\.\d{2}\s*[-–—:.]*\s*/i, "");
  }

  // 2. Remove document-type prefixes if there is substantive content following it
  // e.g. "CYBERSECURITY ADVISORY: Critical..." -> "Critical..."
  // But if the entire string is just "Phishing Alert", preserve "Phishing Alert"
  const docPrefixRegex =
    /^(?:cybersecurity\s+advisory|security\s+alert|threat\s+alert|malware\s+alert|phishing\s+alert|threat\s+advisory|vulnerability\s+advisory|security\s+update|cyber\s+security\s+advisory)\s*[:–—\-.]*\s*/i;
  const docMatch = cleaned.match(docPrefixRegex);
  if (docMatch) {
    const remainder = cleaned.slice(docMatch[0].length).trim();
    if (remainder.length > 0) {
      cleaned = remainder;
    }
  }

  // 3. Remove CVE identifiers from presentation title:
  // e.g. "Critical Palo Alto Networks PAN-OS Vulnerability (CVE-2026-0300)" -> "Critical Palo Alto Networks PAN-OS Vulnerability"
  // e.g. "SharePoint Hardening After New Exploitations (CVE-2026-58644)" -> "SharePoint Hardening After New Exploitations"
  cleaned = cleaned.replace(/\s*[\(\[]\s*CVE-\d{4}-\d{4,}(?:\s*[,;/&]\s*CVE-\d{4}-\d{4,})*\s*[\)\]]/gi, "");
  cleaned = cleaned.replace(/\s*[:–—\-]\s*CVE-\d{4}-\d{4,}(?:\s*[,;/&]\s*CVE-\d{4}-\d{4,})*\s*$/gi, "");
  cleaned = cleaned.replace(/\s+\bCVE-\d{4}-\d{4,}\b\s*$/gi, "");

  cleaned = cleaned.trim();
  if (!cleaned) return decodeHtmlEntities(rawTitle).trim();

  // 4. Sentence case transformation preserving technical identifiers and proper nouns
  // Tokenize while keeping whitespace separators
  const tokens = cleaned.split(/(\s+)/);
  const transformedTokens = tokens.map((token, index) => {
    // If whitespace separator, return as is
    if (/^\s+$/.test(token)) return token;

    // Match surrounding punctuation: e.g. "(CVE-2026-58644)" -> prefix="(", core="CVE-2026-58644", suffix=")"
    const match = token.match(/^([(\[{'"“‘—–#\-]*)(.*?)([)\]}'"”’.,:;!?—–\-]*)$/);
    if (!match) return token;

    const prefix = match[1];
    const core = match[2];
    const suffix = match[3];

    if (!core) return token;

    // A. Check for CVE identifier: CVE-YYYY-NNNNN (in case preserved in edge case)
    if (/^CVE-\d{4}-\d{4,}$/i.test(core)) {
      return `${prefix}${core.toUpperCase()}${suffix}`;
    }

    // B. Check for CWE identifier: CWE-NNNN
    if (/^CWE-\d+$/i.test(core)) {
      return `${prefix}${core.toUpperCase()}${suffix}`;
    }

    // C. Check for KB update identifier: KB1234567
    if (/^KB\d+$/i.test(core)) {
      return `${prefix}${core.toUpperCase()}${suffix}`;
    }

    // Contextual multi-word check: Workspace ONE Access
    const lowerCore = core.toLowerCase();
    const prevWord = index >= 2 ? tokens[index - 2].replace(/[^\w]/g, "").toLowerCase() : "";
    if (lowerCore === "one" && prevWord === "workspace") {
      return `${prefix}ONE${suffix}`;
    }
    if (lowerCore === "access" && prevWord === "one") {
      return `${prefix}Access${suffix}`;
    }

    // D. Check dictionary of preserved terms (exact match)
    if (PRESERVED_TERMS[lowerCore]) {
      return `${prefix}${PRESERVED_TERMS[lowerCore]}${suffix}`;
    }

    // E. Multi-term or hyphenated checks (e.g. Palo-Alto, Zero-Day, COVID-19)
    if (core.includes("-")) {
      const parts = core.split("-");
      const transformedParts = parts.map((part, pIdx) => {
        const pLower = part.toLowerCase();
        if (PRESERVED_TERMS[pLower]) return PRESERVED_TERMS[pLower];
        if (index === 0 && pIdx === 0) {
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        }
        return part.toLowerCase();
      });
      return `${prefix}${transformedParts.join("-")}${suffix}`;
    }

    // F. Version strings or numbers (e.g. v2.4, 2026, 6.0.1)
    if (/\d/.test(core)) {
      return `${prefix}${core}${suffix}`;
    }

    // G. First word of the title: Capitalize first letter, lowercase rest
    if (index === 0) {
      return `${prefix}${core.charAt(0).toUpperCase() + core.slice(1).toLowerCase()}${suffix}`;
    }

    // H. Regular word: Lowercase
    return `${prefix}${core.toLowerCase()}${suffix}`;
  });

  let result = transformedTokens.join("");

  // Clean trailing punctuation artifacts
  result = result.replace(/[:–—\-.\s]+$/, "").trim();

  return result || cleaned;
}

/**
 * Strips HTML tags and normalizes whitespace without using dangerouslySetInnerHTML
 */
export function sanitizeExcerptText(rawHtml: string): string {
  if (!rawHtml) return "";
  const withoutTags = rawHtml.replace(/<[^>]*>/g, " ");
  const decoded = decodeHtmlEntities(withoutTags);
  return decoded.replace(/\s+/g, " ").trim();
}

/**
 * Deterministic Advisory Summary Normalizer
 *
 * Cleans repeated institutional boilerplate and title repetition to produce
 * a concise, front-loaded summary in accordance with GOV.UK content guidance,
 * while strictly preserving all CVE codes, product names, versions, and security details.
 *
 * Rules:
 * 1. Title repetition detection: Removes opening words that merely echo the title.
 * 2. Boilerplate removal: Strips templated phrases like "Please be advised of...", "The TT-CSIRT wishes to inform...".
 * 3. Primary CVE surfacing: If a CVE was in the title or primary focus but is absent from the description,
 *    it is cleanly introduced at the start of the summary so technical relevance is preserved.
 * 4. Sentence capping: Preserves first 1-2 complete sentences (avoiding truncation mid-acronym/CVE).
 * 5. Safety fallback: If derived text is unviable or too short, safely falls back to sourceExcerpt.
 */
export function normalizeDisplaySummary(
  sourceExcerpt: string,
  title: string = "",
  _primaryCve?: string
): string {
  if (!sourceExcerpt) {
    return "Technical advisory detailing security vulnerabilities, affected versions, and remediation guidance.";
  }

  // 1. Strip HTML tags, non-breaking spaces, and ellipsis artifacts
  let cleaned = sourceExcerpt
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\[&hellip;\]/g, "")
    .replace(/\[\.\.\.\]/g, "")
    .replace(/\bsvg\s*Share\s*advisory\s*link\b/gi, "")
    .replace(/\bShare\s*advisory\s*link\b/gi, "")
    .replace(/\bShare\s*this:\s*/gi, "")
    .trim();

  // 2. Remove pre-metadata title repetitions or header tags (e.g. "WPA2 Key Reinstallation Attacks (KRACKs) Date first published: 23/1/2018")
  if (/^(?:.*?\s+)?(?:date\s+(?:first\s+)?published|first\s+published)\s*:/i.test(cleaned)) {
    cleaned = cleaned.replace(/^.*?(?=(?:date\s+(?:first\s+)?published|first\s+published)\s*:)/i, "").trim();
  }

  // 3. Iteratively strip leading publication metadata, section headings, and field values
  let prevCleaned: string;
  do {
    prevCleaned = cleaned;
    // Strip administrative reference numbers at start e.g. "TT-CSIRT – 456.08.05.26 –" or "456.08.05.26:"
    cleaned = cleaned.replace(/^(?:TT-?CSIRT\s*[-–—.]*\s*)?(?:\d{2,4}\.\d{2}\.\d{2}(?:\.\d{2})?)\s*[-–—:.]*\s*/i, "").trim();
    // Strip standalone TT-CSIRT prefixes
    cleaned = cleaned.replace(/^TT-?CSIRT\s*[-–—:.]*\s*/i, "").trim();
    // Publication date lines and revision numbers
    cleaned = cleaned.replace(/^(?:date\s+(?:first\s+)?published|first\s+published|date\s+published|published\s+date|date|date\s+last\s+updated|last\s+updated)\s*:\s*[0-9\/\-\.]+(?:\s+[\d:]+\s*(?:am|pm)?)?\s*/i, "").trim();
    cleaned = cleaned.replace(/^(?:revision|version)\s*:\s*[0-9\/\-\.]+\s*/i, "").trim();
    cleaned = cleaned.replace(/^(?:notice\s*:\s*(?:this\s+is\s+an?\s+(?:security\s+)?advisory[.:]?|security\s+advisory[.:]?))\s*/i, "").trim();
    // Numbered or named structural headings (e.g. "1.0 Introduction", "1. Introduction", "2.0 Impact", "Technical details", etc.)
    cleaned = cleaned.replace(/^(?:[\d.]+\s*)?(?:introduction|overview|description|summary|background|technical\s+details?|technical\s+description|technical\s+analysis|impact|affected\s+(?:products?|systems?|versions?|software|configurations?)|solution|mitigations?|recommendations?|references?|immediate\s+actions?|detection\s+methods?|exploitation\s+details?|indicators\s+of\s+(?:potential\s+)?compromise(?:\s*\(iocs\))?|recommended\s+actions|what\s+to\s+do(?:\s+if\s+compromised)?|additional\s+information(?:\s+and\s+official\s+remediation\s+guidance)?)\s*[:–\-.]*\s*/i, "").trim();
    // Field key-values (e.g. "Discovered: ...", "Updated: ...", "Type: Ransomware", "Infection Length: Varies", "Systems Affected: ...")
    cleaned = cleaned.replace(/^(?:discovered|updated|type|infection\s+length|systems?\s+affected|severity|cvss(?:\s+score)?|vulnerability\s+type|vector|author|reference)\s*:\s*.*?(?=(?:(?:discovered|updated|type|infection\s+length|systems?\s+affected|severity|cvss|vulnerability\s+type|author|reference|revision)\s*:)|(?:\b(?:this\s+is|the\s+culprit|there\s+are|users?\s+may|an?\s+attacker|weaknesses?|a\s+vulnerability|microsoft\b|apple\b|cisco\b|hp\b|google\b|multiple\b|a\s+security)\b)|$)/i, "").trim();
  } while (cleaned !== prevCleaned);

  // 4. Remove title repetition from start of excerpt if present
  const cleanTitle = (title || "").replace(/^TT-?CSIRT\s*[-–.]*\s*[\d.]+\s*[-–:]*\s*/i, "").trim();
  if (cleanTitle && cleanTitle.length > 5) {
    if (cleaned.toLowerCase().startsWith(cleanTitle.toLowerCase())) {
      cleaned = cleaned.slice(cleanTitle.length).replace(/^[\s–\-:.]*\s*/i, "");
    }
  }

  // 5. Remove common leading institutional phrases
  const institutionalPhrases: RegExp[] = [
    /^the (?:trinidad and tobago cyber security incident response team|tt-?csirt)\s*(?:\(tt-?csirt\))?\s*is aware of\s+(a\s+phishing\s+email|an\s+ongoing)/i,
    /^the (?:trinidad and tobago cyber security incident response team|tt-?csirt)\s*(?:\(tt-?csirt\))?\s*(?:wishes to advise|wishes to inform|advises)\s+(?:you|members of the public|organisations|the public)?\s*(?:of|about|that)?\s*/i,
    /^the tt-?csirt wishes to (?:advise|inform)\s+(?:you|members of the public|organisations)?\s*(?:of|about|that)?\s*/i,
    /^the (?:trinidad and tobago cyber security incident response team|tt-?csirt)\s*(?:\(tt-?csirt\))?\s*(?:has released|has published|has issued)\s+(?:an?\s+advisory|guidance|information)\s*(?:on|regarding|about)?\s*/i,
    /^this\s+is\s+an\s+alert\s+from\s+tt-?csirt\s+that\s+/i,
    /^please be advised\s*,?\s*(?:that|of the following|of|there has been)?\s*/i,
    /^please be aware\s*,?\s*(?:that|of)?\s*/i,
    /^be advised\s*,?\s*(?:that|of)?\s*/i,
    /^critical alert regarding\s+/i,
    /^there has been\s+/i,
    /^CVE-\d{4}-\d{4,}\s*:\s*/i,
  ];

  for (const pattern of institutionalPhrases) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Clean leading punctuation/whitespace
  cleaned = cleaned.replace(/^[\s,–\-:.]*\s*/, "").trim();

  // Capitalize first character
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // 6. Sentence-boundary extraction bounded to ~180-200 characters max
  const sentenceMatches = cleaned.match(/.*?[.!?](?=\s+[A-Z0-9]|$)/g);
  if (sentenceMatches && sentenceMatches.length > 0) {
    let result = "";
    for (const s of sentenceMatches) {
      const candidate = (result ? result + " " : "") + s.trim();
      if (candidate.length <= 200) {
        result = candidate;
      } else {
        if (!result) {
          result = s.trim();
          if (result.length > 200) {
            result = result.slice(0, 195).replace(/\s+\S*$/, "") + "…";
          }
        }
        break;
      }
    }
    if (result.length >= 25) {
      cleaned = result;
    }
  } else if (cleaned.length > 200) {
    cleaned = cleaned.slice(0, 195).replace(/\s+\S*$/, "") + "…";
  }

  // Safety fallback if cleaned text is invalid or empty
  if (!cleaned || cleaned.length < 15) {
    return "Technical advisory detailing security vulnerabilities, affected versions, and remediation guidance.";
  }

  return cleaned;
}

/**
 * Formats ISO date string into standard accessible UK/Caribbean government format (e.g. "20 July 2026")
 */
export function formatPublicationDate(isoDateStr: string): string {
  const d = new Date(isoDateStr);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date format: ${isoDateStr}`);
  }
  const day = d.getDate();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Validates canonical URL (must be valid http/https)
 */
export function isValidCanonicalUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Strictly normalizes and validates a single WordPress post object.
 * Returns null if validation fails.
 */
export function normalizeWordPressPost(item: unknown): Advisory | null {
  if (!item || typeof item !== "object") return null;

  const post = item as Record<string, unknown>;

  // 1. Validate ID
  const id = typeof post.id === "number" ? post.id : parseInt(String(post.id), 10);
  if (isNaN(id) || id <= 0) return null;

  // 2. Validate Title
  let rawTitle = "";
  if (typeof post.title === "string") {
    rawTitle = post.title;
  } else if (
    post.title &&
    typeof post.title === "object" &&
    "rendered" in post.title &&
    typeof (post.title as { rendered: unknown }).rendered === "string"
  ) {
    rawTitle = (post.title as { rendered: string }).rendered;
  }
  const cleanTitle = cleanHumanTitle(rawTitle);
  const normalizedRawTitle = decodeHtmlEntities(rawTitle).trim();
  if (!cleanTitle || cleanTitle.length < 2) return null;

  // 3. Validate Date
  if (typeof post.date !== "string") return null;
  let formattedDate = "";
  try {
    formattedDate = formatPublicationDate(post.date);
  } catch {
    return null;
  }

  // 4. Validate URL
  if (typeof post.link !== "string" || !isValidCanonicalUrl(post.link)) {
    return null;
  }

  // 5. Validate and sanitize Excerpt
  let rawExcerpt = "";
  if (typeof post.excerpt === "string") {
    rawExcerpt = post.excerpt;
  } else if (
    post.excerpt &&
    typeof post.excerpt === "object" &&
    "rendered" in post.excerpt &&
    typeof (post.excerpt as { rendered: unknown }).rendered === "string"
  ) {
    rawExcerpt = (post.excerpt as { rendered: string }).rendered;
  } else if (
    post.content &&
    typeof post.content === "object" &&
    "rendered" in post.content &&
    typeof (post.content as { rendered: unknown }).rendered === "string"
  ) {
    rawExcerpt = (post.content as { rendered: string }).rendered;
  }

  let sourceExcerpt = sanitizeExcerptText(rawExcerpt);
  if (!sourceExcerpt) {
    sourceExcerpt = "Official cyber security advisory published by TT-CSIRT.";
  }

  // 6. Deterministically derive the concise presentation displaySummary and CVE list
  const primaryCve = extractPrimaryCve(rawTitle);
  const displaySummary = normalizeDisplaySummary(sourceExcerpt, cleanTitle, primaryCve);
  const cveList = extractCves(`${rawTitle} ${sourceExcerpt}`);

  // 7. Authoritative Taxonomy Validation
  // Enforces data integrity: items must enter /advisories only if authoritative taxonomy classifies them as advisory/alert.
  const categories = Array.isArray(post.categories) ? (post.categories as number[]) : [];
  const tags = Array.isArray(post.tags) ? (post.tags as number[]) : [];
  const slug = typeof post.slug === "string" ? post.slug : String(id);
  
  if (!isAuthoritativeWordPressAdvisory({ categories, tags, title: rawTitle, slug })) {
    return null;
  }

  const isAlert = categories.includes(WP_CATEGORIES.ALERT);
  const categoryName: "Advisory" | "Alert" = isAlert ? "Alert" : "Advisory";

  // 8. Extract slug and reference if present
  const referenceNumber = typeof post.referenceNumber === "string"
    ? post.referenceNumber
    : extractAdministrativeReference(rawTitle);

  return {
    id,
    slug,
    title: cleanTitle,
    rawTitle: normalizedRawTitle,
    referenceNumber,
    cveList: cveList.length > 0 ? cveList : undefined,
    date: formattedDate,
    rawDate: post.date,
    sourceExcerpt,
    displaySummary,
    url: post.link,
    categoryName,
  };
}

async function fetchStaticFallbackAdvisories(page: number, perPage: number): Promise<AdvisoryFetchResult | null> {
  try {
    const res = await fetch("/data/advisories.json");
    if (!res.ok) return null;
    const rawData = await res.json();
    if (!Array.isArray(rawData)) return null;

    const normalizedAdvisories: Advisory[] = [];
    for (const item of rawData) {
      const normalized = normalizeWordPressPost(item);
      if (normalized) {
        normalizedAdvisories.push(normalized);
      }
    }
    if (normalizedAdvisories.length === 0) return null;

    const totalRecords = normalizedAdvisories.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / perPage));
    const startIndex = (page - 1) * perPage;
    const finalAdvisories = normalizedAdvisories.slice(startIndex, startIndex + perPage);

    return {
      status: "success",
      advisories: finalAdvisories,
      totalRecords,
      totalPages,
      currentPage: page,
    };
  } catch {
    return null;
  }
}

async function fetchStaticFallbackDetail(idOrSlug: string | number): Promise<AdvisoryDetailFetchResult | null> {
  try {
    const res = await fetch("/data/advisories.json");
    if (!res.ok) return null;
    const rawData = await res.json();
    if (!Array.isArray(rawData)) return null;

    const isNumeric = /^\d+$/.test(String(idOrSlug).trim());
    const query = String(idOrSlug).trim().toLowerCase();

    const postData = rawData.find((p: any) => {
      if (isNumeric) return Number(p.id) === Number(query);
      return String(p.slug).toLowerCase() === query;
    });

    if (!postData) return null;
    const advisory = normalizeWordPressPostDetail(postData);
    if (!advisory) return null;

    return {
      status: "success",
      advisory,
    };
  } catch {
    return null;
  }
}

/**
 * Direct browser-side fetch function with strict validation and timeout control.
 * Initiated directly from the user's browser without any AI or server intermediary.
 */
export async function fetchLiveAdvisories(options?: {
  page?: number;
  perPage?: number;
  signal?: AbortSignal;
  timeoutMs?: number;
  endpoint?: string;
}): Promise<AdvisoryFetchResult> {
  const page = options?.page || 1;
  const perPage = options?.perPage || 10;
  let endpoint = options?.endpoint;
  if (!endpoint) {
    const fetchCount = perPage <= 10 ? Math.max(perPage + 5, 10) : perPage;
    endpoint = `${TTCSIRT_ADVISORY_ENDPOINT}&per_page=${fetchCount}&page=${page}`;
  }
  const timeoutMs = options?.timeoutMs || 8000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (options?.signal) {
    options.signal.addEventListener("abort", () => controller.abort());
  }

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // If page is larger than total available pages, handle gracefully
      if (response.status === 400) {
        try {
          const errData = await response.json();
          if (errData && errData.code === "rest_post_invalid_page_number") {
            return {
              status: "success",
              advisories: [],
              currentPage: page,
              totalRecords: 0,
              totalPages: Math.max(1, page - 1),
            };
          }
        } catch {
          // ignore
        }
      }

      // Try static fallback
      const fallback = await fetchStaticFallbackAdvisories(page, perPage);
      if (fallback) return fallback;

      return {
        status: "error",
        advisories: [],
        errorMessage: `The TT-CSIRT server responded with status ${response.status}`,
      };
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("json")) {
      const fallback = await fetchStaticFallbackAdvisories(page, perPage);
      if (fallback) return fallback;

      return {
        status: "error",
        advisories: [],
        errorMessage: "Invalid response format received from upstream server.",
      };
    }

    const totalRecordsHeader = response.headers.get(WP_HEADERS.TOTAL);
    const totalPagesHeader = response.headers.get(WP_HEADERS.TOTAL_PAGES);
    const totalRecords = totalRecordsHeader ? parseInt(totalRecordsHeader, 10) : undefined;
    const totalPages = totalPagesHeader ? parseInt(totalPagesHeader, 10) : undefined;

    const rawData = await response.json();
    if (!Array.isArray(rawData)) {
      const fallback = await fetchStaticFallbackAdvisories(page, perPage);
      if (fallback) return fallback;

      return {
        status: "error",
        advisories: [],
        errorMessage: "Unexpected data structure received.",
      };
    }

    const normalizedAdvisories: Advisory[] = [];
    for (const item of rawData) {
      const normalized = normalizeWordPressPost(item);
      if (normalized) {
        normalizedAdvisories.push(normalized);
      }
    }

    if (normalizedAdvisories.length === 0 && rawData.length > 0) {
      return {
        status: "error",
        advisories: [],
        errorMessage: "Returned records did not contain valid required fields.",
      };
    }

    const finalAdvisories = normalizedAdvisories.slice(0, perPage);

    return {
      status: "success",
      advisories: finalAdvisories,
      totalRecords: typeof totalRecords === "number" && !isNaN(totalRecords) ? totalRecords : finalAdvisories.length,
      totalPages: typeof totalPages === "number" && !isNaN(totalPages) ? totalPages : (finalAdvisories.length < perPage ? page : page + 1),
      currentPage: page,
    };
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    const fallback = await fetchStaticFallbackAdvisories(page, perPage);
    if (fallback) return fallback;

    const isTimeout = error instanceof DOMException && error.name === "AbortError";
    return {
      status: "error",
      advisories: [],
      errorMessage: isTimeout
        ? "The request timed out while connecting to TT-CSIRT."
        : "Network connection to TT-CSIRT was interrupted.",
    };
  }
}

/**
 * Fetches the entire advisory corpus across all available pages.
 * Resolves the initial 100-item fetch cap so that older advisories are not truncated.
 */
export async function fetchAllLiveAdvisories(options?: {
  signal?: AbortSignal;
  timeoutMs?: number;
  onPageProgress?: (currentAdvisories: Advisory[], page: number, totalPages: number) => void;
}): Promise<AdvisoryFetchResult> {
  // 1. Fetch page 1 with per_page=100
  const page1Result = await fetchLiveAdvisories({
    page: 1,
    perPage: 100,
    signal: options?.signal,
    timeoutMs: options?.timeoutMs || 10000,
  });

  if (page1Result.status !== "success" || page1Result.advisories.length === 0) {
    return page1Result;
  }

  const totalPages = page1Result.totalPages || 1;
  const totalRecords = page1Result.totalRecords || page1Result.advisories.length;

  // If only 1 page exists upstream, we already have the complete corpus
  if (totalPages <= 1) {
    return page1Result;
  }

  // Notify initial progress with page 1
  if (options?.onPageProgress) {
    options.onPageProgress(page1Result.advisories, 1, totalPages);
  }

  // 2. Fetch remaining pages (2..totalPages) in controlled parallel batches
  const remainingPageNumbers: number[] = [];
  for (let p = 2; p <= totalPages; p++) {
    remainingPageNumbers.push(p);
  }

  const allAdvisories: Advisory[] = [...page1Result.advisories];
  const batchSize = 4;

  for (let i = 0; i < remainingPageNumbers.length; i += batchSize) {
    const batch = remainingPageNumbers.slice(i, i + batchSize);
    const batchPromises = batch.map((pageNum) =>
      fetchLiveAdvisories({
        page: pageNum,
        perPage: 100,
        signal: options?.signal,
        timeoutMs: options?.timeoutMs || 12000,
      })
    );

    const batchResults = await Promise.all(batchPromises);
    for (const res of batchResults) {
      if (res.status === "success" && res.advisories.length > 0) {
        allAdvisories.push(...res.advisories);
      }
    }

    if (options?.onPageProgress) {
      options.onPageProgress(allAdvisories, Math.min(totalPages, 1 + i + batch.length), totalPages);
    }
  }

  // Deduplicate by ID to ensure dataset integrity
  const seenIds = new Set<number>();
  const uniqueAdvisories: Advisory[] = [];
  for (const item of allAdvisories) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      uniqueAdvisories.push(item);
    }
  }

  return {
    status: "success",
    advisories: uniqueAdvisories,
    totalRecords: Math.max(totalRecords, uniqueAdvisories.length),
    totalPages: 1,
    currentPage: 1,
  };
}

/**
 * Normalizes a single WordPress post into the full authoritative AdvisoryDetail model.
 */
export function normalizeWordPressPostDetail(rawItem: unknown): AdvisoryDetail | null {
  if (!rawItem || typeof rawItem !== "object") return null;
  const post = rawItem as Record<string, unknown>;

  const id = typeof post.id === "number" ? post.id : parseInt(String(post.id), 10);
  if (isNaN(id) || id <= 0) return null;

  const slug = typeof post.slug === "string" ? post.slug : String(id);

  let rawTitle = "";
  if (typeof post.title === "string") {
    rawTitle = post.title;
  } else if (
    post.title &&
    typeof post.title === "object" &&
    "rendered" in post.title &&
    typeof (post.title as { rendered: unknown }).rendered === "string"
  ) {
    rawTitle = (post.title as { rendered: string }).rendered;
  }

  const cleanTitle = cleanHumanTitle(rawTitle) || `TT-CSIRT Advisory #${id}`;
  const normalizedRawTitle = decodeHtmlEntities(rawTitle).trim() || `TT-CSIRT Advisory #${id}`;
  const referenceNumber = typeof post.referenceNumber === "string"
    ? post.referenceNumber
    : extractAdministrativeReference(rawTitle);

  const rawDate = typeof post.date === "string" ? post.date : new Date().toISOString();
  const formattedDate = formatPublicationDate(rawDate);

  let formattedModifiedDate: string | undefined;
  let rawModifiedDate: string | undefined;
  if (typeof post.modified === "string" && post.modified !== rawDate) {
    rawModifiedDate = post.modified;
    formattedModifiedDate = formatPublicationDate(post.modified);
  }

  // Canonical URL
  let url = typeof post.link === "string" ? post.link.trim() : "";
  if (!url || !url.startsWith("http")) {
    url = buildWordPressPostPermalink(id);
  }

  // Excerpt
  let rawExcerpt = "";
  if (typeof post.excerpt === "string") {
    rawExcerpt = post.excerpt;
  } else if (
    post.excerpt &&
    typeof post.excerpt === "object" &&
    "rendered" in post.excerpt &&
    typeof (post.excerpt as { rendered: unknown }).rendered === "string"
  ) {
    rawExcerpt = (post.excerpt as { rendered: string }).rendered;
  }

  // Content HTML
  let contentHtml = "";
  if (typeof post.content === "string") {
    contentHtml = post.content;
  } else if (
    post.content &&
    typeof post.content === "object" &&
    "rendered" in post.content &&
    typeof (post.content as { rendered: unknown }).rendered === "string"
  ) {
    contentHtml = (post.content as { rendered: string }).rendered;
  }

  let sourceExcerpt = sanitizeExcerptText(rawExcerpt || contentHtml);
  if (!sourceExcerpt) {
    sourceExcerpt = "Official cyber security advisory published by TT-CSIRT.";
  }

  const primaryCve = extractPrimaryCve(rawTitle);
  const displaySummary = normalizeDisplaySummary(sourceExcerpt, cleanTitle, primaryCve);
  const cveList = extractCves(`${rawTitle} ${sourceExcerpt} ${contentHtml}`);

  const categories = Array.isArray(post.categories) ? post.categories : [];
  const isAlert = categories.includes(WP_CATEGORIES.ALERT);
  const categoryName: "Advisory" | "Alert" = isAlert ? "Alert" : "Advisory";

  return {
    id,
    slug,
    title: cleanTitle,
    rawTitle: normalizedRawTitle,
    referenceNumber,
    cveList: cveList.length > 0 ? cveList : undefined,
    date: formattedDate,
    rawDate,
    modifiedDate: formattedModifiedDate,
    rawModifiedDate,
    contentHtml,
    sourceExcerpt,
    displaySummary,
    url,
    categoryName,
  };
}

/**
 * Fetches an authoritative single advisory from the WordPress REST API by ID or slug.
 */
export async function fetchLiveAdvisoryDetail(
  idOrSlug: string | number,
  options?: {
    signal?: AbortSignal;
    timeoutMs?: number;
  }
): Promise<AdvisoryDetailFetchResult> {
  const isNumericId = /^\d+$/.test(String(idOrSlug).trim());
  const queryStr = String(idOrSlug).trim();

  const endpoint = isNumericId
    ? buildWordPressPostsEndpoint({ id: queryStr, fields: TTCSIRT_DETAIL_FIELDS })
    : buildWordPressPostsEndpoint({ slug: queryStr, fields: TTCSIRT_DETAIL_FIELDS });

  const timeoutMs = options?.timeoutMs || 8000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (options?.signal) {
    options.signal.addEventListener("abort", () => controller.abort());
  }

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 404) {
      const fallback = await fetchStaticFallbackDetail(idOrSlug);
      if (fallback) return fallback;

      return {
        status: "error",
        errorMessage: `Advisory "${queryStr}" was not found on the TT-CSIRT portal.`,
      };
    }

    if (!response.ok) {
      const fallback = await fetchStaticFallbackDetail(idOrSlug);
      if (fallback) return fallback;

      return {
        status: "error",
        errorMessage: `Upstream TT-CSIRT server responded with status ${response.status}`,
      };
    }

    const rawData = await response.json();
    let postData: unknown = rawData;

    if (Array.isArray(rawData)) {
      if (rawData.length === 0) {
        const fallback = await fetchStaticFallbackDetail(idOrSlug);
        if (fallback) return fallback;

        return {
          status: "error",
          errorMessage: `No advisory matching "${queryStr}" was found on TT-CSIRT.`,
        };
      }
      postData = rawData[0];
    }

    const advisory = normalizeWordPressPostDetail(postData);
    if (!advisory) {
      const fallback = await fetchStaticFallbackDetail(idOrSlug);
      if (fallback) return fallback;

      return {
        status: "error",
        errorMessage: "Unable to process the advisory content structure.",
      };
    }

    return {
      status: "success",
      advisory,
    };
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    const fallback = await fetchStaticFallbackDetail(idOrSlug);
    if (fallback) return fallback;

    const isTimeout = error instanceof DOMException && error.name === "AbortError";
    return {
      status: "error",
      errorMessage: isTimeout
        ? "Request timed out while retrieving the advisory from TT-CSIRT."
        : "Network connection to TT-CSIRT is unavailable.",
    };
  }
}
