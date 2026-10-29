/**
 * Normalization and String Metrics for TT-CSIRT Site Search
 */

/**
 * Standard text normalization for search queries and indexed content:
 * - Unicode NFKD normalization
 * - Lowercase conversion
 * - Diacritic stripping
 * - Hyphen/underscore preservation where semantic, but converted to spaces for general queries
 * - Whitespace collapsing and trimming
 */
export function normalizeText(input: string | undefined | null): string {
  if (!input) return "";

  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[—–_]/g, " ")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalization for strict token matching:
 * Removes hyphens to allow matching "tt-csirt" with "ttcsirt", "cyber-security" with "cybersecurity", etc.
 */
export function normalizeCompact(input: string | undefined | null): string {
  if (!input) return "";
  return normalizeText(input).replace(/[-\s]/g, "");
}

/**
 * Splits text into unique, clean tokens of length >= 2
 */
export function tokenize(input: string | undefined | null): string[] {
  if (!input) return [];
  const normalized = normalizeText(input);
  if (!normalized) return [];

  const rawTokens = normalized.split(/[\s-]+/);
  const result: string[] = [];
  const seen = new Set<string>();

  for (const token of rawTokens) {
    const trimmed = token.trim();
    if (trimmed.length >= 2 && !seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }
  }

  return result;
}

/**
 * Extracts CVE identifiers from a string, e.g. "CVE-2026-0300"
 */
export function extractCveIdentifiers(input: string): string[] {
  if (!input) return [];
  const matches = input.match(/\bCVE-\d{4}-\d{4,}\b/gi);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.toUpperCase())));
}

/**
 * Extracts TT-CSIRT advisory identifiers from a string, e.g. "TT-CSIRT-055" or "TTCSIRT-055"
 */
export function extractAdvisoryIdentifiers(input: string): string[] {
  if (!input) return [];
  const matches = input.match(/\bTT-?CSIRT(?:-\d{2,4})?\b/gi);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.toUpperCase().replace(/\s+/g, ""))));
}

/**
 * Damerau-Levenshtein distance with adjacent transposition support
 * Handles:
 * - Insertions
 * - Deletions
 * - Substitutions (e.g. "ransomwere" -> "ransomware")
 * - Transpositions (e.g. "phisihng" -> "phishing", "incidnet" -> "incident")
 */
export function damerauLevenshteinDistance(source: string, target: string): number {
  const src = source.toLowerCase();
  const tgt = target.toLowerCase();

  const srcLen = src.length;
  const tgtLen = tgt.length;

  if (srcLen === 0) return tgtLen;
  if (tgtLen === 0) return srcLen;
  if (src === tgt) return 0;

  // 2D distance matrix with padding for boundary conditions
  const matrix: number[][] = [];
  for (let i = 0; i <= srcLen + 1; i++) {
    matrix[i] = new Array(tgtLen + 1).fill(0);
  }

  const maxDist = srcLen + tgtLen;
  matrix[0][0] = maxDist;

  for (let i = 0; i <= srcLen; i++) {
    matrix[i + 1][0] = maxDist;
    matrix[i + 1][1] = i;
  }
  for (let j = 0; j <= tgtLen; j++) {
    matrix[0][j + 1] = maxDist;
    matrix[1][j + 1] = j;
  }

  const da: Record<string, number> = {};

  for (let i = 1; i <= srcLen; i++) {
    let db = 0;
    const srcChar = src[i - 1];

    for (let j = 1; j <= tgtLen; j++) {
      const tgtChar = tgt[j - 1];
      const i1 = da[tgtChar] || 0;
      const j1 = db;
      let cost = 1;

      if (srcChar === tgtChar) {
        cost = 0;
        db = j;
      }

      matrix[i + 1][j + 1] = Math.min(
        matrix[i][j + 1] + 1, // deletion
        matrix[i + 1][j] + 1, // insertion
        matrix[i][j] + cost, // substitution
        matrix[i1][j1] + (i - i1 - 1) + 1 + (j - j1 - 1) // transposition
      );
    }

    da[srcChar] = i;
  }

  return matrix[srcLen + 1][tgtLen + 1];
}

/**
 * Calculates similarity ratio from a pre-computed edit distance and string lengths
 */
export function similarityFromDistance(distance: number, len1: number, len2: number): number {
  const maxLen = Math.max(len1, len2);
  if (maxLen === 0) return 1;
  return Math.max(0, 1 - distance / maxLen);
}

/**
 * Calculates normalized similarity ratio between 0.0 and 1.0
 * 1.0 means identical, 0.0 means completely disjoint
 */
export function calculateSimilarity(source: string, target: string): number {
  if (!source && !target) return 1;
  if (!source || !target) return 0;
  if (source === target) return 1;

  const distance = damerauLevenshteinDistance(source, target);
  return similarityFromDistance(distance, source.length, target.length);
}
