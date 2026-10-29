/**
 * Canonical advisory document segmentation and normalization system
 *
 * Transforms legacy, inconsistent TT-CSIRT WordPress advisory HTML into a
 * clean, semantic, GOV.UK-style canonical advisory document without losing
 * substantive security information.
 *
 * Document Model Pipeline:
 *   WordPress HTML
 *        ↓
 *   Sanitization (strip UI widgets, SVGs, share buttons, legacy styles)
 *        ↓
 *   Structural Table Unwrapping (layout tables -> semantic blocks)
 *        ↓
 *   Block Splitting & List Recovery (<br> & bullet markers -> <ul> / <ol>)
 *        ↓
 *   Classification (Major H2 vs Subheading H3, non-sentence verification)
 *        ↓
 *   Metadata Extraction (Key-value lines -> GOV.UK summary list)
 *        ↓
 *   Boilerplate Removal & Contact Block Suppression
 *        ↓
 *   Canonical Sections (Mandatory Overview, Deduplication, Sentence Case)
 *        ↓
 *   Deterministic IDs & Structured Hierarchical Navigation
 */

import { normalizeAdvisoryTable } from "./advisoryTableNormalizer.ts";

export type CanonicalNode =
  | {
      type: "paragraph";
      html: string;
      text: string;
    }
  | {
      type: "subheading";
      level: 3;
      title: string;
      id: string;
    }
  | {
      type: "list";
      html: string;
      ordered?: boolean;
      items?: string[];
    }
  | {
      type: "table";
      html: string;
      caption?: string;
      headers?: string[];
      rows?: Array<Array<{ text: string; html: string }>>;
    }
  | {
      type: "warning";
      html: string;
      text?: string;
    }
  | {
      type: "code";
      html: string;
      text?: string;
    }
  | {
      type: "references";
      html: string;
      links?: Array<{ href: string; text: string }>;
    }
  | {
      type: "metadata-block";
      html: string;
    }
  | {
      type: "raw-html";
      html: string;
    };

export interface CanonicalSection {
  id: string;
  title: string;
  level: 2;
  nodes: CanonicalNode[];
}

export interface CanonicalNavItem {
  id: string;
  label: string;
  isSubItem?: boolean;
}

export interface CanonicalAdvisoryDocument {
  title: string;
  overviewId: string;
  leadParagraph?: string;
  sections: CanonicalSection[];
  navItems: CanonicalNavItem[];
  externalReferences: string[];
}

export const OVERVIEW_ID = "advisory-overview";

// --- HTML Entities & String Decoding ---

export function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8217;/g, "’")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8226;/g, "•")
    .replace(/&bull;/g, "•")
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ");
}

export function stripHtml(html: string): string {
  if (!html) return "";
  return decodeHtmlEntities(
    html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")
  ).trim();
}

export function normalizeWhitespace(str: string): string {
  if (!str) return "";
  return str.replace(/\r\n|\r/g, "\n").replace(/[ \t]+/g, " ").trim();
}

// --- Acronyms and Proper Nouns for Sentence Casing ---

const PRESERVED_TOKENS = new Map<string, string>([
  // Technical acronyms
  ["cve", "CVE"],
  ["cvss", "CVSS"],
  ["rce", "RCE"],
  ["vpn", "VPN"],
  ["waf", "WAF"],
  ["mfa", "MFA"],
  ["ip", "IP"],
  ["ips", "IPs"],
  ["pan-os", "PAN-OS"],
  ["os", "OS"],
  ["ssh", "SSH"],
  ["tls", "TLS"],
  ["ssl", "SSL"],
  ["dns", "DNS"],
  ["tcp", "TCP"],
  ["udp", "UDP"],
  ["itw", "ITW"],
  ["ioc", "IoC"],
  ["iocs", "IoCs"],
  ["gui", "GUI"],
  ["api", "API"],
  ["apis", "APIs"],
  ["html", "HTML"],
  ["url", "URL"],
  ["urls", "URLs"],
  ["cwe", "CWE"],
  ["cisa", "CISA"],
  ["nist", "NIST"],
  ["nvd", "NVD"],
  ["msrc", "MSRC"],
  ["dos", "DoS"],
  ["ddos", "DDoS"],
  ["xss", "XSS"],
  ["csrf", "CSRF"],
  ["mac", "MAC"],
  ["sql", "SQL"],
  ["psirt", "PSIRT"],
  ["ngfw", "NGFW"],
  ["radius", "RADIUS"],
  ["ldap", "LDAP"],
  ["tt-csirt", "TT-CSIRT"],
  ["csirt", "CSIRT"],
  ["freepbx", "FreePBX"],
  ["mitm", "MITM"],
  ["fortios", "FortiOS"],
  ["fortiproxy", "FortiProxy"],
  ["fortimanager", "FortiManager"],
  ["fortianalyzer", "FortiAnalyzer"],
  ["fortivoice", "FortiVoice"],
  ["fortiweb", "FortiWeb"],
  ["fortinet", "Fortinet"],

  // Vendor & Product Proper Nouns
  ["microsoft", "Microsoft"],
  ["sharepoint", "SharePoint"],
  ["apple", "Apple"],
  ["cisco", "Cisco"],
  ["vmware", "VMware"],
  ["palo", "Palo"],
  ["alto", "Alto"],
  ["networks", "Networks"],
  ["sangoma", "Sangoma"],
  ["pbxact", "PBXAct"],
  ["check", "Check"],
  ["point", "Point"],
  ["esxi", "ESXi"],
  ["vcenter", "vCenter"],
  ["safari", "Safari"],
  ["chrome", "Chrome"],
  ["firefox", "Firefox"],
  ["edge", "Edge"],
  ["apache", "Apache"],
  ["mariadb", "MariaDB"],
  ["mysql", "MySQL"],
  ["asterisk", "Asterisk"],
  ["f5", "F5"],
  ["citrix", "Citrix"],
  ["juniper", "Juniper"],
  ["sonicwall", "SonicWall"],
  ["sophos", "Sophos"],
  ["ivanti", "Ivanti"],
  ["atlassian", "Atlassian"],
  ["confluence", "Confluence"],
  ["jira", "Jira"],
  ["github", "GitHub"],
  ["gitlab", "GitLab"],
  ["json", "JSON"],
  ["cli", "CLI"],
  ["fqdn", "FQDN"],
  ["edr", "EDR"],
  ["amsi", "AMSI"],
  ["mdav", "MDAV"],
  ["oas", "OAS"],
  ["sans", "SANS"],
  ["pat", "PAT"],
  ["pats", "PATs"],
  ["aws", "AWS"],
  ["gcp", "GCP"],
  ["azure", "Azure"],
  ["ci/cd", "CI/CD"],
  ["ttps", "TTPs"],
  ["ttp", "TTP"],
  ["csum", "CSUM"],
  ["rtl", "RTL"],
  ["apt", "APT"],
  ["worm", "Worm"],
  ["npm", "npm"],
  ["govnett", "GovNeTT"],
  ["milat", "MiLAT"],
  ["fortiadc", "FortiADC"],
  ["fortigate", "FortiGate"],
  ["fortiswitch", "FortiSwitch"],
  ["sonicos", "SonicOS"],
  ["cwe-89", "CWE-89"],
  ["cwe-20", "CWE-20"],
  ["cwe-620", "CWE-620"],
]);

export function sentenceCaseHeading(rawHeading: string): string {
  if (!rawHeading) return "";

  let text = rawHeading
    .replace(/^[\s•\-\*–—]+/g, "")
    .replace(/^section\s+\d+\s*[:–\-.]*\s*/i, "")
    .replace(/^(\d+(?:\.\d+)*|[a-z]\))\s*[:–\-.]*\s*/i, "")
    .replace(/[:–\-.\s]+$/g, "")
    .trim();

  // Strip trailing introductory prepositions/verbs e.g. "can be found at:"
  text = text.replace(/\s+(?:can\s+be\s+found\s+at|is\s+available\s+at|may\s+be\s+found\s+at)\s*:?$/i, "").trim();

  if (!text) return "";

  const tokens = text.split(/([\s/()–—|]+)/);
  let isFirstWord = true;

  const transformed = tokens.map((token) => {
    if (/^[\s/()–—|]+$/.test(token)) return token;

    if (/^cve-\d{4}-\d+$/i.test(token)) {
      isFirstWord = false;
      return token.toUpperCase();
    }

    const parenMatch = token.match(/^(\(?)(.*?)(\)?)$/);
    if (parenMatch && (parenMatch[1] || parenMatch[3])) {
      const inner = parenMatch[2];
      const lowerInner = inner.toLowerCase();
      let matched = PRESERVED_TOKENS.get(lowerInner);
      if (!matched) {
        if (/^cve-\d{4}-\d+$/i.test(inner)) matched = inner.toUpperCase();
        else if (isFirstWord) matched = inner.charAt(0).toUpperCase() + inner.slice(1).toLowerCase();
        else matched = inner.toLowerCase();
      }
      isFirstWord = false;
      return `${parenMatch[1]}${matched}${parenMatch[3]}`;
    }

    const lower = token.toLowerCase();
    const preserved = PRESERVED_TOKENS.get(lower);
    if (preserved) {
      isFirstWord = false;
      return preserved;
    }

    if (isFirstWord) {
      isFirstWord = false;
      return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
    }

    return token.toLowerCase();
  });

  return transformed.join("");
}

export const normalizeHeadingSentenceCase = sentenceCaseHeading;

export function generateDeterministicSlug(
  title: string,
  existingIds?: Set<string>
): string {
  const normalized = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  let baseSlug = normalized || "section";

  if (baseSlug === "overview" || baseSlug === "introduction" || baseSlug === "summary" || baseSlug === "background") {
    baseSlug = OVERVIEW_ID;
  } else if (baseSlug === "references" || baseSlug === "reference" || baseSlug === "references-s" || baseSlug === "external-references") {
    baseSlug = "references";
  } else if (baseSlug === "recommendations" || baseSlug === "remediation" || baseSlug === "mitigation" || baseSlug === "solutions") {
    baseSlug = "recommendations";
  } else if (baseSlug.startsWith("affected-systems") || baseSlug.startsWith("affected-products")) {
    baseSlug = "affected-systems";
  }

  if (!existingIds) return baseSlug;

  let candidate = baseSlug;
  let counter = 1;
  while (existingIds.has(candidate)) {
    counter++;
    candidate = `${baseSlug}-${counter}`;
  }
  existingIds.add(candidate);
  return candidate;
}

export function stripHeadingNumbering(value: string): string {
  if (!value) return "";
  return value
    .replace(/^section\s+\d+\s*[:–\-.]*\s*/i, "")
    .replace(/^(\d+(?:\.\d+)*|[a-z]\))\s*[:–\-.]*\s*/i, "")
    .replace(/^[\s•\-\*–—]+/g, "")
    .replace(/[:\s]+$/g, "")
    .trim();
}

export const stripNumbering = stripHeadingNumbering;

export function normalizeEditorialContent(rawText: string): { text: string; isBoilerplateOnly: boolean } {
  if (!rawText) return { text: "", isBoilerplateOnly: true };

  const boilerplateRegex = /^\s*(?:please\s+be\s+advised\s+(?:that|of\s+the\s+following|of)?|please\s+note\s+(?:that)?)\s*[:–\-.,]*\s*/i;

  if (boilerplateRegex.test(rawText)) {
    const stripped = rawText.replace(boilerplateRegex, "").trim();
    if (!stripped) {
      return { text: "", isBoilerplateOnly: true };
    }
    const normalized = stripped.charAt(0).toUpperCase() + stripped.slice(1);
    return { text: normalized, isBoilerplateOnly: false };
  }

  return { text: rawText.trim(), isBoilerplateOnly: false };
}

export function isRedundantWithLead(text: string, lead: string): boolean {
  if (!text || !lead) return false;
  const t = text.trim().toLowerCase();
  const l = lead.trim().toLowerCase();
  return t === l || l.startsWith(t) || t.startsWith(l);
}

// --- Classification Helpers ---

const MAJOR_HEADINGS_SET = new Set([
  "overview",
  "introduction",
  "background",
  "summary",
  "description",
  "vulnerability description",
  "technical details",
  "technical description",
  "technical analysis",
  "technical implementation",
  "affected systems",
  "affected products",
  "affected versions",
  "affected software",
  "affected configurations",
  "affected components",
  "affected systems and solutions",
  "affected versions and solutions",
  "affected products and solutions",
  "affected systems and configurations",
  "impact",
  "scope",
  "scope of impact",
  "recommendations",
  "recommendations and mitigation measures",
  "mitigation",
  "mitigations",
  "remediation",
  "solution",
  "solutions",
  "workaround",
  "workarounds",
  "recommended actions",
  "recommended mitigations",
  "recommended mitigation steps",
  "detection method",
  "detection methods",
  "immediate actions",
  "action required",
  "exploitation details",
  "active exploitation",
  "indicators of compromise",
  "indicators of compromise (iocs)",
  "indicators and detection",
  "indicators of potential compromise",
  "indicators of potential exploitation",
  "attack details",
  "attack vectors",
  "attack vector",
  "methods of attack",
  "attack scenarios",
  "detailed attack analysis",
  "references",
  "reference",
  "reference(s)",
  "external references",
  "resources",
  "sources",
  "additional information",
  "contact information",
  "conditions",
  "objective",
  "evasion characteristics",
  "conclusion",
  "detection",
  "platform",
  "key details",
  "event timeline",
  "what to do if compromised",
  "what to do if you suspect compromise",
  "about stolen whatsapp accounts",
  "how to recover your account",
]);

const MAJOR_SECTION_REGEXES = [
  /^(?:overview|introduction|summary|background|description)\b/i,
  /^(?:vulnerability\s+(?:description|details|analysis|overview|summary))\b/i,
  /^(?:technical\s+(?:details|description|analysis|implementation|overview|summary))\b/i,
  /^(?:threat\s+(?:details|analysis|overview|activity))\b/i,
  /^(?:affected\s+(?:systems?|products?|versions?|software|configurations?|components?|builds?|devices?))\b/i,
  /^(?:impact|business\s+impact|scope(?:\s+of\s+impact)?)\b/i,
  /^(?:recommendations?|mitigations?|remediations?|solutions?|workarounds?)\b/i,
  /^(?:recommended\s+(?:mitigations?|actions?|steps?|measures?|guidance))\b/i,
  /^(?:immediate\s+(?:actions?|steps?|measures?)|action\s+required|corrective\s+actions?)\b/i,
  /^(?:defensive\s+measures?|preventative\s+measures?|hardening(?:\s+measures)?)\b/i,
  /^(?:detection|detection\s+methods?|threat\s+hunting)\b/i,
  /^(?:indicators?\s+of\s+(?:potential\s+)?(?:compromise|exploitation)|iocs?|indicators\s+and\s+detection)\b/i,
  /^(?:exploitation\s+details|proof\s+of\s+concept|active\s+exploitation)\b/i,
  /^(?:methods?\s+of\s+attack|attack\s+(?:details|analysis|vectors?|scenarios?|pattern))\b/i,
  /^(?:what\s+to\s+do(?:\s+if\s+compromised|\s+if\s+you\s+suspect\s+compromise)?)\b/i,
  /^(?:how\s+to\s+recover(?:\s+your\s+account)?|about\s+stolen\b)/i,
  /^(?:references?|reference\(s\)|external\s+references?|resources?|sources?|further\s+reading)\b/i,
  /^(?:for\s+further\s+(?:review|reference)|kindly\s+review)\b/i,
  /^(?:key\s+details|event\s+timeline|schedule|program\s+details|registration\s+details)\b/i,
  /^(?:conditions|objective|evasion\s+characteristics|conclusion)\b/i,
];

const SUBHEADING_PATTERNS = [
  /^(?:indicators?\s+of\s+(?:potential\s+)?compromise|iocs?)\b/i,
  /^(?:recommended|suggested|immediate|required|response|remediation|mitigation)\s+(?:actions?|measures?|steps?|guidance)\b/i,
  /^what\s+to\s+do(?:\s+if\s+compromised)?\b/i,
  /^(?:additional|further|official)\s+(?:information|guidance|references?|details?)(?:\s+and\s+official\s+remediation\s+guidance)?\b/i,
  /^detection\s+methods?\b/i,
  /^(?:check\s+for|review|examine|inspect|isolate|restore|configure|activate)\s+/i,
  /^(?:access\s+restrictions?|security\s+hardening|network\s+segmentation|patch\s+availability)\b/i,
];

export function classifyTextAsHeading(
  rawText: string,
  isStandaloneBold: boolean = false
): { isHeading: boolean; isSubheading: boolean; cleanTitle: string } {
  const trimmed = rawText.trim();
  const plain = stripHtml(trimmed);

  if (!plain || plain.length < 2 || plain.length > 95) {
    return { isHeading: false, isSubheading: false, cleanTitle: "" };
  }

  let normalizedPlain = plain
    .replace(/\s+(?:can\s+be\s+found\s+at|is\s+available\s+at|may\s+be\s+found\s+at)\s*:?$/i, "")
    .trim();

  // Advisory callouts / Warnings are not section headings
  if (/^(?:please\s+note|note|warning|caution)\s*:/i.test(normalizedPlain)) {
    return { isHeading: false, isSubheading: false, cleanTitle: "" };
  }

  // If it ends with period or exclamation mark, and is not numbering like "1."
  if (/[.!]$/.test(normalizedPlain) && !/^\d+\.$/.test(normalizedPlain)) {
    return { isHeading: false, isSubheading: false, cleanTitle: "" };
  }

  const lower = normalizedPlain.toLowerCase().replace(/[:\s]+$/g, "").trim();
  const strippedNumber = stripHeadingNumbering(lower);

  // 1. Check for Reference phrasing
  if (
    /^(?:for\s+further\s+(?:review|reference)|kindly\s+review)/i.test(lower) ||
    lower === "resources" ||
    lower === "sources"
  ) {
    return {
      isHeading: true,
      isSubheading: false,
      cleanTitle: "References",
    };
  }

  // 2. Major headings
  if (MAJOR_HEADINGS_SET.has(lower) || MAJOR_HEADINGS_SET.has(strippedNumber)) {
    return {
      isHeading: true,
      isSubheading: false,
      cleanTitle: sentenceCaseHeading(normalizedPlain),
    };
  }

  // 3. Major section concept regexes
  for (const pat of MAJOR_SECTION_REGEXES) {
    if (pat.test(lower) || pat.test(strippedNumber)) {
      return {
        isHeading: true,
        isSubheading: false,
        cleanTitle: sentenceCaseHeading(normalizedPlain),
      };
    }
  }

  // 4. Subheading patterns
  for (const pat of SUBHEADING_PATTERNS) {
    if (pat.test(lower) || pat.test(strippedNumber)) {
      return {
        isHeading: true,
        isSubheading: true,
        cleanTitle: sentenceCaseHeading(normalizedPlain),
      };
    }
  }

  // Check for finite verbs in active clauses that signify full sentences
  const sentencePattern = /\b(?:is|are|was|were|has\s+been|have\s+been|can\s+be|will\s+be|could\s+allow|should\s+be|requires?|allows?|causes?|results?\s+in)\b/i;
  if (sentencePattern.test(normalizedPlain) && normalizedPlain.length > 40) {
    return { isHeading: false, isSubheading: false, cleanTitle: "" };
  }

  // 5. Structural patterns: numbering or trailing colon
  const endsWithColon = /:\s*$/.test(plain);
  const startsWithNumber = /^(\d+\.|\d+\.\d+|[a-z]\))\s+/i.test(plain);
  const words = plain.split(/\s+/).filter(Boolean);

  if ((endsWithColon || startsWithNumber) && words.length <= 10) {
    return {
      isHeading: true,
      isSubheading: true,
      cleanTitle: sentenceCaseHeading(normalizedPlain),
    };
  }

  // 6. Standalone bold short title-case block
  if (isStandaloneBold && words.length <= 6 && !/[.!?]$/.test(plain)) {
    return {
      isHeading: true,
      isSubheading: true,
      cleanTitle: sentenceCaseHeading(normalizedPlain),
    };
  }

  return { isHeading: false, isSubheading: false, cleanTitle: "" };
}

// --- Key-Value Metadata Block Detection ---

const METADATA_KEYS = new Set([
  "severity",
  "cvss",
  "cvss score",
  "affected product",
  "affected products",
  "affected systems",
  "affected system",
  "affected software",
  "affected versions",
  "affected vendor",
  "vulnerability type",
  "vector",
  "published",
  "date",
  "discovered",
  "status",
  "vendor",
  "exploitation status",
  "risk",
  "cve",
  "cwe",
  "category",
  "target",
]);

export function parseMetadataBlock(lines: string[]): Array<{ key: string; value: string }> | null {
  if (lines.length < 2) return null;
  const items: Array<{ key: string; value: string }> = [];

  for (const line of lines) {
    const plain = stripHtml(line).trim();
    if (!plain) continue;
    const match = plain.match(/^([A-Za-z\s-]+):\s*(.+)$/);
    if (!match) return null;

    const key = match[1].trim().toLowerCase();
    if (!METADATA_KEYS.has(key)) return null;

    items.push({
      key: match[1].trim(),
      value: match[2].trim(),
    });
  }

  return items.length >= 2 ? items : null;
}

export function formatMetadataSummaryList(items: Array<{ key: string; value: string }>): string {
  const rows = items
    .map(({ key, value }) => {
      let formattedValue = value;
      const lowerKey = key.toLowerCase();
      const lowerVal = value.toLowerCase();

      if (lowerKey === "severity") {
        let tagClass = "govuk-tag--grey";
        if (lowerVal.includes("critical")) tagClass = "govuk-tag--red";
        else if (lowerVal.includes("high")) tagClass = "govuk-tag--orange";
        else if (lowerVal.includes("medium")) tagClass = "govuk-tag--yellow";
        else if (lowerVal.includes("low")) tagClass = "govuk-tag--grey";
        formattedValue = `<strong class="govuk-tag ${tagClass}">${value}</strong>`;
      }

      return `
      <div class="govuk-summary-list__row">
        <dt class="govuk-summary-list__key">${key}</dt>
        <dd class="govuk-summary-list__value">${formattedValue}</dd>
      </div>`;
    })
    .join("");

  return `<dl class="govuk-summary-list govuk-summary-list--no-border govuk-!-margin-top-4 govuk-!-margin-bottom-6">${rows}</dl>`;
}

// --- DOM & Block Parser ---

function sanitizeRawHtml(rawHtml: string): string {
  let html = rawHtml;

  // 1. Strip WordPress sharing buttons & UI widgets (sharedaddy, post-meta, navigation)
  html = html.replace(
    /<div\b[^>]*\b(?:sharedaddy|sd-sharing-enabled|sd-content|post-meta|wp-block-navigation)\b[^>]*>[\s\S]*?<\/div>/gi,
    ""
  );

  // 2. Strip SVG elements and any SVG share text contamination
  html = html.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, "");
  html = html.replace(/\bsvg\s*Share\s*advisory\s*link\b/gi, "");
  html = html.replace(/\bShare\s*advisory\s*link\b/gi, "");
  html = html.replace(/\bShare\s*this:\s*/gi, "");

  // 3. Strip legacy font tags and conflicting inline presentation styles
  html = html.replace(/<\/?font[^>]*>/gi, "");
  html = html.replace(/style\s*=\s*(["'])[\s\S]*?\1/gi, "");

  // 4. Normalize HTML bullet entities
  html = html.replace(/&#8226;/g, "•").replace(/&bull;/g, "•");

  // 5. Strip empty bold/strong tags and spacer lines
  html = html.replace(/<(?:strong|b)\b[^>]*>[\s\u00a0\u200b&nbsp;&#160;&#8203;]*<\/(?:strong|b)>/gi, "");

  // 6. Strip empty paragraphs
  html = html.replace(/<p\b[^>]*>[\s\u00a0\u200b&nbsp;&#160;&#8203;]*<\/p>/gi, "");

  return html;
}

interface RawBlock {
  tag: string;
  html: string;
  text: string;
  isHeading?: boolean;
  isSubheading?: boolean;
  headingTitle?: string;
  headingId?: string;
  isTable?: boolean;
  isList?: boolean;
  isMetadataBlock?: boolean;
  isMetadataLine?: boolean;
  metaKey?: string;
  metaValue?: string;
  isWarning?: boolean;
  isCode?: boolean;
}

const PURE_METADATA_ATTRIBUTES = new Set([
  "severity",
  "cvss",
  "cvss score",
  "affected vendor",
  "date",
  "status",
  "published",
  "discovered",
  "exploitation status",
  "vector",
]);

function splitParagraphIntoSemanticBlocks(pInnerHtml: string): RawBlock[] {
  const blocks: RawBlock[] = [];
  let inner = pInnerHtml.trim();

  // Strip empty tags
  inner = inner.replace(/<(?:strong|b|span|em)>\s*<\/(?:strong|b|span|em)>/gi, "");
  if (!inner) return [];

  const plainText = stripHtml(inner);

  // CLI Command check
  const isCliCommand =
    /^(?:config\s+vpn|config\s+firewall|takeown\s+\/f|cacls\s+%|netsh\s+|sudo\s+|chmod\s+|powershell\b|Set-|Get-|DISM\b)/i.test(plainText) ||
    /^(?:takeown|cacls|icacls|chmod|chown)\s+/i.test(plainText);

  if (isCliCommand) {
    blocks.push({
      tag: "pre",
      html: `<pre class="govuk-!-font-size-14" style="background:#f3f2f1;padding:12px 16px;border-left:4px solid #1d70b8;overflow-x:auto;font-family:monospace;margin:15px 0;"><code>${plainText}</code></pre>`,
      text: plainText,
      isCode: true,
    });
    return blocks;
  }

  // Single-item metadata line check (e.g. <p><strong>Severity:</strong> Critical</p>) - only for blocks without line breaks
  if (!inner.includes("<br")) {
    const singleMetaMatch = plainText.match(/^([A-Za-z\s-]+):\s*(.+)$/);
    if (singleMetaMatch && METADATA_KEYS.has(singleMetaMatch[1].trim().toLowerCase())) {
      blocks.push({
        tag: "div",
        html: inner,
        text: plainText,
        isMetadataLine: true,
        metaKey: singleMetaMatch[1].trim(),
        metaValue: singleMetaMatch[2].trim(),
      });
      return blocks;
    }
  }

  // Check for leading embedded major heading with body prose
  const embeddedHeadingMatch = inner.match(
    /^\s*(?:<(?:strong|b)\b[^>]*>)?\s*(Impact|Workarounds?\s+and\s+Mitigations?|Mitigations?|Recommendations?|Remediation|Technical\s+Details?|Description|Affected\s+(?:Systems?|Products?|Versions?)|Solutions?)\s*:\s*(?:<\/(?:strong|b)>)?\s*(.+)$/i
  );
  if (embeddedHeadingMatch) {
    const rawHead = embeddedHeadingMatch[1].trim();
    const rawBody = embeddedHeadingMatch[2].trim();
    if (rawBody.length > 0 && !classifyTextAsHeading(rawBody).isHeading) {
      blocks.push({
        tag: "h2",
        html: rawHead,
        text: rawHead,
        isHeading: true,
        isSubheading: false,
        headingTitle: sentenceCaseHeading(rawHead),
      });
      blocks.push({
        tag: "p",
        html: rawBody,
        text: stripHtml(rawBody),
      });
      return blocks;
    }
  }

  // Check for leading bold heading inside <p> (e.g. <strong>Heading:<br></strong> or <strong>Heading:</strong><br>)
  const leadingHeadingMatch = inner.match(
    /^\s*<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>\s*(?:<br\s*\/?>)?/i
  );

  if (leadingHeadingMatch) {
    const rawHeadingText = leadingHeadingMatch[2].replace(/<br\s*\/?>/gi, " ").trim();
    const cleanHeadingLower = stripHtml(rawHeadingText).toLowerCase().replace(/[:\s]+$/g, "");

    // Do NOT treat metadata keys as section headings
    if (!METADATA_KEYS.has(cleanHeadingLower)) {
      const classification = classifyTextAsHeading(rawHeadingText, true);

      if (classification.isHeading) {
        const headingLength = leadingHeadingMatch[0].length;
        const restHtml = inner.slice(headingLength).trim();

        // Push heading block
        blocks.push({
          tag: classification.isSubheading ? "h3" : "h2",
          html: rawHeadingText,
          text: stripHtml(rawHeadingText),
          isHeading: !classification.isSubheading,
          isSubheading: classification.isSubheading,
          headingTitle: classification.cleanTitle,
        });

        if (!restHtml) return blocks;
        // Process the remainder
        inner = restHtml;
      }
    }
  }

  // Check lines separated by <br>
  const lines = inner.split(/<br\s*\/?>/gi).map((l) => l.trim()).filter(Boolean);

  // Check if this entire block is a Metadata Key-Value panel
  const metadataItems = parseMetadataBlock(lines);
  if (metadataItems) {
    blocks.push({
      tag: "div",
      html: formatMetadataSummaryList(metadataItems),
      text: lines.map((l) => stripHtml(l)).join(" "),
      isMetadataBlock: true,
    });
    return blocks;
  }

  // Check if lines contain bullet points or numbered lists
  const bulletLineRegex = /^[\s•\-\*–—]/;
  const numberLineRegex = /^\s*(\d+\.|\d+\))\s+/;

  const bulletLinesCount = lines.filter((l) => bulletLineRegex.test(stripHtml(l))).length;
  const numberLinesCount = lines.filter((l) => numberLineRegex.test(stripHtml(l))).length;

  if (bulletLinesCount >= 2 || (bulletLinesCount === 1 && lines.length === 1 && bulletLineRegex.test(stripHtml(lines[0])))) {
    // We have a bullet list!
    const listItems: string[] = [];
    let introProse = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const plain = stripHtml(line);
      if (bulletLineRegex.test(plain)) {
        // Strip bullet marker from beginning of line HTML
        const cleanLineHtml = line.replace(/^\s*(?:•|\*|–|—|-|&bull;|&#8226;)\s*/i, "").trim();
        listItems.push(cleanLineHtml);
      } else if (i === 0 && listItems.length === 0) {
        introProse = line;
      } else {
        // Line continuation
        if (listItems.length > 0) {
          listItems[listItems.length - 1] += " " + line;
        } else {
          introProse += " " + line;
        }
      }
    }

    if (introProse.trim()) {
      blocks.push({
        tag: "p",
        html: introProse.trim(),
        text: stripHtml(introProse),
      });
    }

    if (listItems.length > 0) {
      const listHtml = `<ul class="govuk-list govuk-list--bullet">\n${listItems
        .map((item) => `  <li>${item}</li>`)
        .join("\n")}\n</ul>`;

      blocks.push({
        tag: "ul",
        html: listHtml,
        text: listItems.map((item) => stripHtml(item)).join(" "),
        isList: true,
      });
    }

    return blocks;
  }

  if (numberLinesCount >= 2) {
    // We have an ordered list!
    const listItems: string[] = [];
    let introProse = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const plain = stripHtml(line);
      if (numberLineRegex.test(plain)) {
        const cleanLineHtml = line.replace(/^\s*(?:\d+\.|\d+\))\s*/i, "").trim();
        listItems.push(cleanLineHtml);
      } else if (i === 0 && listItems.length === 0) {
        introProse = line;
      } else {
        if (listItems.length > 0) {
          listItems[listItems.length - 1] += " " + line;
        } else {
          introProse += " " + line;
        }
      }
    }

    if (introProse.trim()) {
      blocks.push({
        tag: "p",
        html: introProse.trim(),
        text: stripHtml(introProse),
      });
    }

    if (listItems.length > 0) {
      const listHtml = `<ol class="govuk-list govuk-list--number">\n${listItems
        .map((item) => `  <li>${item}</li>`)
        .join("\n")}\n</ol>`;

      blocks.push({
        tag: "ol",
        html: listHtml,
        text: listItems.map((item) => stripHtml(item)).join(" "),
        isList: true,
      });
    }

    return blocks;
  }

  // If none of the above, check if it's a standalone bold heading
  const currentPlainText = stripHtml(inner);
  const isBoldWrapper =
    /^\s*<(?:strong|b)\b[^>]*>([\s\S]*?)<\/(?:strong|b)>\s*:?\s*$/i.test(inner);
  const classification = classifyTextAsHeading(currentPlainText, isBoldWrapper);

  if (isBoldWrapper && classification.isHeading) {
    blocks.push({
      tag: classification.isSubheading ? "h3" : "h2",
      html: inner,
      text: currentPlainText,
      isHeading: !classification.isSubheading,
      isSubheading: classification.isSubheading,
      headingTitle: classification.cleanTitle,
    });
    return blocks;
  }

  if (classification.isHeading && currentPlainText.length <= 60 && !/[.!?]$/.test(currentPlainText)) {
    blocks.push({
      tag: classification.isSubheading ? "h3" : "h2",
      html: inner,
      text: currentPlainText,
      isHeading: !classification.isSubheading,
      isSubheading: classification.isSubheading,
      headingTitle: classification.cleanTitle,
    });
    return blocks;
  }

  // Normal paragraph
  const isWarn = /^(?:please\s+note|warning|caution)\s*:/i.test(currentPlainText);
  blocks.push({
    tag: "p",
    html: inner,
    text: currentPlainText,
    isWarning: isWarn,
  });

  return blocks;
}

function splitEmbeddedBoldHeadings(html: string): string {
  let cleaned = html.replace(/<(?:strong|b)\b[^>]*>\s*(?:&nbsp;|\s|&#160;|&#8203;)*<\/(?:strong|b)>/gi, "");

  // Pre-split plain text headings on line breaks e.g. <br />Affected Systems:<br />
  cleaned = cleaned.replace(
    /(?:<br\s*\/?>\s*)+(Overview|Affected\s+(?:Systems?|Configurations?|Software)|Impact|Recommendations?|Mitigations?|Solutions?|Workarounds?|Technical\s+Details?|Description|Attack\s+Details?|Attack\s+Vectors?|Key\s+Details?)\s*:\s*(?:<br\s*\/?>)+/gi,
    "</p><p><strong>$1</strong></p><p>"
  );

  return cleaned.replace(
    /(?:<br\s*\/?>\s*)+(<(?:strong|b)\b[^>]*>([\s\S]*?)<\/(?:strong|b)>:?)(?:\s*<br\s*\/?>)*/gi,
    (match, fullTag, innerText) => {
      const plain = stripHtml(innerText).trim();
      if (!plain) return match;
      const lower = plain.toLowerCase().replace(/[:\s]+$/g, "").trim();
      if (PURE_METADATA_ATTRIBUTES.has(lower)) {
        return match;
      }
      const strippedNumber = stripHeadingNumbering(lower);
      if (
        MAJOR_HEADINGS_SET.has(lower) ||
        MAJOR_HEADINGS_SET.has(strippedNumber) ||
        classifyTextAsHeading(plain, true).isHeading ||
        /:\s*$/.test(plain)
      ) {
        return `</p><p>${fullTag}</p><p>`;
      }
      return match;
    }
  );
}

export function parseHtmlIntoNodes(html: string): RawBlock[] {
  if (!html) return [];

  let processedHtml = sanitizeRawHtml(html);

  // Structural Table Unwrapping for 1-column layout tables
  const tableWrapperPattern = /<table\b[^>]*>([\s\S]*?)<\/table>/gi;
  processedHtml = processedHtml.replace(tableWrapperPattern, (fullTable, tableInner) => {
    const rowMatches = tableInner.match(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi) || [];
    let isSingleColumn = true;

    for (const row of rowMatches) {
      const cells = row.match(/<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi) || [];
      if (cells.length > 1) {
        isSingleColumn = false;
        break;
      }
    }

    const hasTh = /<th\b/i.test(tableInner);
    const hasDataCells = /<td\b[^>]*>\s*<strong>(?:product|cve|solution|version|component)\b/i.test(tableInner);

    if (isSingleColumn && (rowMatches.length === 1 || (!hasTh && !hasDataCells))) {
      let unwrapped = "";
      for (const row of rowMatches) {
        const cellMatches = row.match(/<td\b[^>]*>([\s\S]*?)<\/td>/gi) || [];
        for (const cell of cellMatches) {
          let cellContent = cell.replace(/^<td\b[^>]*>/i, "").replace(/<\/td>$/i, "").trim();
          cellContent = cellContent.replace(/<(?:strong|b)\b[^>]*>\s*(?:&nbsp;|\s|&#160;|&#8203;)*<\/(?:strong|b)>/gi, "");
          cellContent = splitEmbeddedBoldHeadings(cellContent);
          cellContent = cellContent.replace(/<br\s*\/?>\s*(?:&nbsp;|\s)*<br\s*\/?>/gi, "</p><p>");
          unwrapped += `<p>${cellContent}</p>`;
        }
      }
      return unwrapped || fullTable;
    }

    return fullTable;
  });

  // Pre-split bold headings embedded in paragraphs with line breaks
  processedHtml = splitEmbeddedBoldHeadings(processedHtml);

  // Pre-split double <br> in normal content into separate paragraphs
  processedHtml = processedHtml.replace(/<br\s*\/?>\s*(?:&nbsp;|\s)*<br\s*\/?>/gi, "</p><p>");

  // Tokenize top-level HTML blocks
  const blockRegex = /<(h[1-6]|p|ul|ol|table|pre|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  const rawBlocks: RawBlock[] = [];

  while ((match = blockRegex.exec(processedHtml)) !== null) {
    const tag = match[1].toLowerCase();
    const innerHtml = match[2];
    const text = stripHtml(innerHtml);

    if (!text && !/<img\b/i.test(innerHtml) && !/<table\b/i.test(innerHtml)) {
      continue;
    }

    if (/^h[1-6]$/.test(tag)) {
      const isH2 = tag === "h2" || tag === "h1";
      rawBlocks.push({
        tag,
        html: innerHtml,
        text,
        isHeading: isH2,
        isSubheading: !isH2,
        headingTitle: sentenceCaseHeading(text),
      });
    } else if (tag === "table") {
      rawBlocks.push({
        tag,
        html: match[0],
        text,
        isTable: true,
      });
    } else if (tag === "ul" || tag === "ol") {
      // Clean up native list: strip leading bullet characters from <li>
      let cleanListHtml = match[0];
      const isUl = tag === "ul";
      cleanListHtml = cleanListHtml.replace(
        /<li\b[^>]*>([\s\S]*?)<\/li>/gi,
        (_m, liInner) => {
          let cleanedLi = liInner.trim();
          if (isUl) {
            cleanedLi = cleanedLi.replace(/^[\s•\-\*–—]+/g, "").trim();
          } else {
            cleanedLi = cleanedLi.replace(/^(\d+\.|\d+\))\s*/g, "").trim();
          }
          return `<li>${cleanedLi}</li>`;
        }
      );

      // Add GOV.UK list class
      const govukClass = isUl ? "govuk-list govuk-list--bullet" : "govuk-list govuk-list--number";
      if (!cleanListHtml.includes("govuk-list")) {
        cleanListHtml = cleanListHtml.replace(/^<(ul|ol)\b([^>]*)>/i, `<$1 class="${govukClass}"$2>`);
      }

      rawBlocks.push({
        tag,
        html: cleanListHtml,
        text,
        isList: true,
      });
    } else {
      // Paragraph: run through semantic block splitter
      const subBlocks = splitParagraphIntoSemanticBlocks(innerHtml);
      rawBlocks.push(...subBlocks);
    }
  }

  // Merge consecutive single-item metadata blocks (e.g. <p><strong>Severity:</strong> Critical</p><p><strong>CVSS Score:</strong> 9.8</p>)
  const consolidatedBlocks: RawBlock[] = [];
  let pendingMetadataItems: Array<{ key: string; value: string }> = [];

  const flushPendingMetadata = () => {
    if (pendingMetadataItems.length >= 1) {
      consolidatedBlocks.push({
        tag: "div",
        html: formatMetadataSummaryList(pendingMetadataItems),
        text: pendingMetadataItems.map((it) => `${it.key}: ${it.value}`).join(" "),
        isMetadataBlock: true,
      });
      pendingMetadataItems = [];
    }
  };

  for (let i = 0; i < rawBlocks.length; i++) {
    const blk = rawBlocks[i];
    if (blk.isMetadataLine && blk.metaKey && blk.metaValue) {
      pendingMetadataItems.push({
        key: blk.metaKey,
        value: blk.metaValue,
      });
      continue;
    }

    const plain = blk.text.trim();
    const metaMatch = plain.match(/^([A-Za-z\s-]+):\s*(.+)$/);
    if (
      metaMatch &&
      METADATA_KEYS.has(metaMatch[1].trim().toLowerCase()) &&
      !blk.isHeading &&
      !blk.isSubheading &&
      !blk.isTable &&
      !blk.isList &&
      !blk.isCode
    ) {
      pendingMetadataItems.push({
        key: metaMatch[1].trim(),
        value: metaMatch[2].trim(),
      });
      continue;
    }

    flushPendingMetadata();
    consolidatedBlocks.push(blk);
  }
  flushPendingMetadata();

  // Merge consecutive bullet/ordered paragraphs if any
  const mergedBlocks: RawBlock[] = [];
  let pendingListItems: string[] = [];
  let pendingListType: "ul" | "ol" | null = null;

  const flushPendingList = () => {
    if (pendingListItems.length > 0 && pendingListType) {
      const isUl = pendingListType === "ul";
      const govClass = isUl ? "govuk-list govuk-list--bullet" : "govuk-list govuk-list--number";
      const tag = isUl ? "ul" : "ol";
      const html = `<${tag} class="${govClass}">\n${pendingListItems
        .map((it) => `  <li>${it}</li>`)
        .join("\n")}\n</${tag}>`;

      mergedBlocks.push({
        tag,
        html,
        text: pendingListItems.map((it) => stripHtml(it)).join(" "),
        isList: true,
      });
      pendingListItems = [];
      pendingListType = null;
    }
  };

  const bulletStartRegex = /^[\s•\-\*–—]/;
  const numberStartRegex = /^\s*(\d+\.|\d+\))\s+/;

  for (const blk of consolidatedBlocks) {
    if (blk.tag === "p" && !blk.isHeading && !blk.isSubheading && !blk.isCode) {
      const plain = stripHtml(blk.html);
      if (bulletStartRegex.test(plain)) {
        if (pendingListType && pendingListType !== "ul") {
          flushPendingList();
        }
        pendingListType = "ul";
        pendingListItems.push(blk.html.replace(/^\s*(?:•|\*|–|—|-|&bull;|&#8226;)\s*/i, "").trim());
        continue;
      } else if (numberStartRegex.test(plain)) {
        if (pendingListType && pendingListType !== "ol") {
          flushPendingList();
        }
        pendingListType = "ol";
        pendingListItems.push(blk.html.replace(/^\s*(?:\d+\.|\d+\))\s*/i, "").trim());
        continue;
      }
    }

    flushPendingList();
    mergedBlocks.push(blk);
  }

  flushPendingList();
  return mergedBlocks;
}

// --- Contact Info Helpers ---

function isContactHeading(text: string): boolean {
  const clean = text.toLowerCase().trim();
  return clean === "contact information" || clean === "contact" || clean === "contact us" || clean === "queries or comments";
}

function isContactParagraph(text: string): boolean {
  const clean = text.toLowerCase();
  return (
    clean.includes("contacts@ttcsirt.gov.tt") ||
    (clean.includes("queries") && clean.includes("require assistance") && clean.includes("tt-csirt"))
  );
}

// --- Main Canonical Document Assembler ---

export function parseCanonicalAdvisoryDocument(
  rawHtml: string,
  advisoryTitle: string = "",
  fallbackExcerpt: string = ""
): CanonicalAdvisoryDocument {
  const existingIds = new Set<string>();
  const externalReferencesSet = new Set<string>();

  // Extract external reference links
  const linkMatches = rawHtml.matchAll(/href\s*=\s*["'](https?:\/\/[^"'\s>]+)["']/gi);
  for (const m of linkMatches) {
    const url = m[1];
    if (!url.includes("ttcsirt.gov.tt") && !url.includes("list-manage.com") && !url.includes("mailto:")) {
      externalReferencesSet.add(url);
    }
  }

  const rawBlocks = parseHtmlIntoNodes(rawHtml);

  const sections: CanonicalSection[] = [];
  let currentSection: CanonicalSection | null = null;
  let inContactBlock = false;
  let overviewSectionFound = false;

  const ensureSection = (title: string, customId?: string): CanonicalSection => {
    const cleanTitle = sentenceCaseHeading(title);
    const slugId = customId || generateDeterministicSlug(cleanTitle, existingIds);

    const existing = sections.find(
      (s) => s.title.toLowerCase() === cleanTitle.toLowerCase() || s.id === slugId
    );
    if (existing) {
      currentSection = existing;
      return existing;
    }

    const newSec: CanonicalSection = {
      id: slugId,
      title: cleanTitle,
      level: 2,
      nodes: [],
    };
    sections.push(newSec);
    currentSection = newSec;
    return newSec;
  };

  for (const block of rawBlocks) {
    // 1. Contact Information Suppression
    if (block.isHeading && block.headingTitle && isContactHeading(block.headingTitle)) {
      inContactBlock = true;
      continue;
    }

    if (inContactBlock) {
      if (block.isHeading && block.headingTitle && !isContactHeading(block.headingTitle)) {
        inContactBlock = false;
      } else {
        continue;
      }
    }

    if (isContactParagraph(block.text)) {
      continue;
    }

    // 2. Section Headings (H2)
    if (block.isHeading && block.headingTitle) {
      const title = block.headingTitle;
      const lower = title.toLowerCase();

      if (lower === "overview" || lower === "introduction" || lower === "summary" || lower === "background") {
        if (!overviewSectionFound) {
          currentSection = ensureSection("Overview", OVERVIEW_ID);
          overviewSectionFound = true;
        } else {
          const existingOverview = sections.find((s) => s.id === OVERVIEW_ID);
          if (existingOverview) currentSection = existingOverview;
        }
        continue;
      }

      if (
        lower === "references" ||
        lower === "reference" ||
        lower === "reference(s)" ||
        lower === "external references" ||
        lower.startsWith("for further review") ||
        lower.startsWith("kindly review") ||
        lower.startsWith("for further reference") ||
        lower === "resources" ||
        lower === "sources"
      ) {
        currentSection = ensureSection("References", "references");
        continue;
      }

      currentSection = ensureSection(title);
      continue;
    }

    // 3. Non-heading content: Ensure Overview exists as Section 1
    if (!currentSection) {
      currentSection = ensureSection("Overview", OVERVIEW_ID);
      overviewSectionFound = true;
    }

    // Subheadings (H3)
    if (block.isSubheading && block.headingTitle) {
      const subId = generateDeterministicSlug(block.headingTitle, existingIds);
      currentSection.nodes.push({
        type: "subheading",
        level: 3,
        title: sentenceCaseHeading(block.headingTitle),
        id: subId,
      });
      continue;
    }

    // Metadata Blocks
    if (block.isMetadataBlock) {
      currentSection.nodes.push({
        type: "metadata-block",
        html: block.html,
      });
      continue;
    }

    // Code blocks
    if (block.isCode) {
      currentSection.nodes.push({
        type: "code",
        html: block.html,
        text: block.text,
      });
      continue;
    }

    // Tables
    if (block.isTable) {
      const normalized = normalizeAdvisoryTable(block.html);
      if (normalized.type === "summary-list") {
        currentSection.nodes.push({
          type: "metadata-block",
          html: normalized.html,
        });
      } else if (normalized.type === "blocks") {
        currentSection.nodes.push({
          type: "paragraph",
          html: normalized.html,
          text: stripHtml(normalized.html),
        });
      } else {
        currentSection.nodes.push({
          type: "table",
          html: normalized.html,
          caption: normalized.caption,
          headers: normalized.headers,
          rows: normalized.rows,
        });
      }
      continue;
    }

    // Lists
    if (block.isList) {
      const lastNode = currentSection.nodes[currentSection.nodes.length - 1];
      if (lastNode && lastNode.type === "list") {
        const newItems = block.html.match(/<li\b[^>]*>[\s\S]*?<\/li>/gi) || [];
        if (newItems.length > 0) {
          lastNode.html = lastNode.html.replace(/<\/(?:ul|ol)>\s*$/i, `\n${newItems.join("\n")}\n</ul>`);
          continue;
        }
      }
      currentSection.nodes.push({
        type: "list",
        html: block.html,
      });
      continue;
    }

    // Warnings
    if (block.isWarning) {
      currentSection.nodes.push({
        type: "warning",
        html: block.html,
        text: block.text,
      });
      continue;
    }

    // URL List detection in References or standalone URL paragraphs
    const isRefSec = currentSection.id === "references" || /^(?:references?|resources?)\b/i.test(currentSection.title);
    const hasUrlsOnly = /^https?:\/\/[^\s]+(?:\s+https?:\/\/[^\s]+)*$/.test(block.text.trim());

    if (isRefSec || hasUrlsOnly) {
      const extractedUrls = Array.from(block.html.matchAll(/https?:\/\/[^\s<"']+/gi)).map((m) => m[0]);
      if (extractedUrls.length > 0 && (isRefSec || hasUrlsOnly)) {
        const listItems = extractedUrls.map((u) => {
          const cleanU = u.replace(/[.,;)]+$/, "");
          return `<li><a href="${cleanU}" class="govuk-link" target="_blank" rel="noopener noreferrer">${cleanU} <span class="govuk-visually-hidden">(opens in new tab)</span></a></li>`;
        });
        const lastNode = currentSection.nodes[currentSection.nodes.length - 1];
        if (lastNode && lastNode.type === "list") {
          lastNode.html = lastNode.html.replace(/<\/(?:ul|ol)>\s*$/i, `\n${listItems.join("\n")}\n</ul>`);
        } else {
          currentSection.nodes.push({
            type: "list",
            html: `<ul class="govuk-list govuk-list--bullet">\n${listItems.join("\n")}\n</ul>`,
          });
        }
        continue;
      }
    }

    // Normal Paragraphs
    const editorial = normalizeEditorialContent(block.text);
    if (editorial.isBoilerplateOnly) {
      continue;
    }
    let paraText = editorial.text;
    let paraHtml = block.html.trim();

    if (editorial.text !== block.text) {
      // Strip leading boilerplate from HTML
      paraHtml = paraHtml.replace(
        /^\s*(?:<p\b[^>]*>)?\s*(?:please\s+be\s+advised\s+(?:that|of\s+the\s+following|of)?|please\s+note\s+(?:that)?)\s*[:–\-.,]*\s*/i,
        ""
      );
      paraHtml = paraHtml.replace(/^([a-z])/, (c) => c.toUpperCase());
    }

    if (!/^\s*<p\b/i.test(paraHtml)) {
      paraHtml = `<p>${paraHtml}</p>`;
    }

    currentSection.nodes.push({
      type: "paragraph",
      html: paraHtml,
      text: paraText,
    });
  }

  // Guarantee Mandatory Overview Section
  let overviewSec = sections.find((s) => s.id === OVERVIEW_ID);

  if (!overviewSec) {
    overviewSec = {
      id: OVERVIEW_ID,
      title: "Overview",
      level: 2,
      nodes: [],
    };
    sections.unshift(overviewSec);
  } else if (sections[0].id !== OVERVIEW_ID) {
    const idx = sections.findIndex((s) => s.id === OVERVIEW_ID);
    if (idx > 0) {
      const [ov] = sections.splice(idx, 1);
      sections.unshift(ov);
    }
  }

  if (overviewSec.nodes.length === 0) {
    const leadProse = fallbackExcerpt || `${advisoryTitle || "Cyber security advisory"} published by TT-CSIRT.`;
    overviewSec.nodes.push({
      type: "paragraph",
      html: `<p>${leadProse}</p>`,
      text: leadProse,
    });
  }

  // Deduplicate sections with identical normalized titles
  const uniqueSections: CanonicalSection[] = [];
  const seenTitles = new Set<string>();

  for (const sec of sections) {
    const key = sec.title.toLowerCase();
    if (seenTitles.has(key)) {
      const existing = uniqueSections.find((s) => s.title.toLowerCase() === key);
      if (existing) {
        existing.nodes.push(...sec.nodes);
      }
    } else {
      seenTitles.add(key);
      uniqueSections.push(sec);
    }
  }

  // Extract lead paragraph for metadata/search fallback (from Overview's first paragraph)
  const firstOverviewPara = overviewSec.nodes.find(
    (n): n is Extract<CanonicalNode, { type: "paragraph" }> => n.type === "paragraph"
  );
  let leadParagraph = firstOverviewPara ? firstOverviewPara.text : "";
  // Strip any leading boilerplate or heading names from lead
  leadParagraph = leadParagraph
    .replace(/^(?:overview|introduction|summary|background|description)\s*[:–\-.]*\s*/i, "")
    .trim();

  // Build Navigation Items: Sections + Subheadings + Application-owned
  const navItems: CanonicalNavItem[] = [];

  for (const sec of uniqueSections) {
    navItems.push({
      id: sec.id,
      label: sec.title,
    });

    for (const node of sec.nodes) {
      if (node.type === "subheading") {
        navItems.push({
          id: node.id,
          label: node.title,
          isSubItem: true,
        });
      }
    }
  }

  // Application-owned sections
  navItems.push(
    { id: "emergency-reporting", label: "Emergency reporting" },
    { id: "related-resources", label: "Related resources" }
  );

  return {
    title: advisoryTitle,
    overviewId: OVERVIEW_ID,
    leadParagraph,
    sections: uniqueSections,
    navItems,
    externalReferences: Array.from(externalReferencesSet),
  };
}
