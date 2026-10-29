/**
 * Curated Aliases and Acronyms for TT-CSIRT Search Engine
 *
 * Tier 3 Matching:
 * Provides deterministic, bidirectional or one-way expansions for high-frequency
 * institutional and cybersecurity terms without uncontrolled synonym explosion.
 */

import { normalizeText, normalizeCompact } from "./searchNormalize";

export interface CuratedAlias {
  canonical: string;
  aliases: string[];
}

export const CURATED_ALIASES: CuratedAlias[] = [
  {
    canonical: "business email compromise",
    aliases: ["bec", "email compromise", "wire fraud scam"],
  },
  {
    canonical: "cyber security",
    aliases: ["cybersecurity", "infosec", "information security"],
  },
  {
    canonical: "tt-csirt",
    aliases: ["ttcsirt", "tt csirt", "csirt", "national csirt"],
  },
  {
    canonical: "denial of service",
    aliases: ["dos"],
  },
  {
    canonical: "distributed denial of service",
    aliases: ["ddos", "ddos attack"],
  },
  {
    canonical: "multi-factor authentication",
    aliases: ["mfa", "2fa", "two factor authentication", "multi factor authentication"],
  },
  {
    canonical: "incident response",
    aliases: ["ir", "incident handling", "triage"],
  },
  {
    canonical: "capture the flag",
    aliases: ["ctf", "cyber challenge"],
  },
  {
    canonical: "tabletop exercise",
    aliases: ["ttx", "crisis simulation"],
  },
  {
    canonical: "data protection act",
    aliases: ["dpa", "privacy act"],
  },
  {
    canonical: "vulnerability",
    aliases: ["cve", "flaw", "exploit", "patch"],
  },
  {
    canonical: "national cyber security strategy",
    aliases: ["ncss", "cyber strategy", "national strategy"],
  },
  {
    canonical: "ransomware",
    aliases: ["cryptolocker", "extortionware"],
  },
  {
    canonical: "phishing",
    aliases: ["smishing", "vishing", "spear phishing", "social engineering"],
  },
];

// Precompute bidirectional lookup maps for fast matching
const ALIAS_TO_CANONICAL = new Map<string, string>();
const CANONICAL_TO_ALIASES = new Map<string, string[]>();

for (const entry of CURATED_ALIASES) {
  const normCanonical = normalizeText(entry.canonical);
  const normCompactCanonical = normalizeCompact(entry.canonical);
  const aliasList: string[] = [];

  for (const alias of entry.aliases) {
    const normAlias = normalizeText(alias);
    const normCompactAlias = normalizeCompact(alias);
    aliasList.push(normAlias);

    ALIAS_TO_CANONICAL.set(normAlias, normCanonical);
    ALIAS_TO_CANONICAL.set(normCompactAlias, normCanonical);
  }

  CANONICAL_TO_ALIASES.set(normCanonical, aliasList);
  CANONICAL_TO_ALIASES.set(normCompactCanonical, aliasList);
}

/**
 * Returns the canonical term for a given alias or acronym, if one exists
 */
export function resolveAliasToCanonical(term: string): string | undefined {
  const norm = normalizeText(term);
  const compact = normalizeCompact(term);
  return ALIAS_TO_CANONICAL.get(norm) || ALIAS_TO_CANONICAL.get(compact);
}

/**
 * Returns alternative aliases for a canonical term
 */
export function getAliasesForCanonical(term: string): string[] {
  const norm = normalizeText(term);
  const compact = normalizeCompact(term);
  return CANONICAL_TO_ALIASES.get(norm) || CANONICAL_TO_ALIASES.get(compact) || [];
}

/**
 * Resolves all expansions for a query string
 * E.g., "bec" -> ["business email compromise"]
 * "cybersecurity" -> ["cyber security"]
 */
export function getQueryExpansions(query: string): string[] {
  const norm = normalizeText(query);
  const compact = normalizeCompact(query);
  const results = new Set<string>();

  const canonical = ALIAS_TO_CANONICAL.get(norm) || ALIAS_TO_CANONICAL.get(compact);
  if (canonical) {
    results.add(canonical);
  }

  const aliases = CANONICAL_TO_ALIASES.get(norm) || CANONICAL_TO_ALIASES.get(compact);
  if (aliases) {
    for (const a of aliases) {
      results.add(a);
    }
  }

  return Array.from(results);
}
