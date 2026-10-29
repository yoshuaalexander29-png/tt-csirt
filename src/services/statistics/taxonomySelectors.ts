/**
 * Safe Helper Selectors for Cyber Security Incident Taxonomy Analytics
 *
 * ANALYTICS GOVERNANCE PRINCIPLE:
 * Use the taxonomy to improve discoverability and interpretation, not to manufacture
 * conclusions or policy.
 *
 * Relationships automated:
 * Statistics finding -> Incident type -> Official Cyber Security Incident Taxonomy classification -> Existing TT-CSIRT guidance.
 *
 * NOT automated:
 * Does NOT generate automated government cybersecurity advice, controls, recommendations,
 * legal conclusions, or policy statements.
 */

import type {
  TaxonomyCategory,
  TaxonomySubcategory,
  TaxonomyEntry
} from "../taxonomy/cyberSecurityIncidentTaxonomy.ts";
import {
  CYBER_SECURITY_INCIDENT_TAXONOMY,
  OFFICIAL_TAXONOMY_CATEGORIES,
  getSubcategoriesForCategory
} from "../taxonomy/cyberSecurityIncidentTaxonomy.ts";
import type {
  StatisticsIncidentType,
  StatisticsTaxonomyMapping
} from "./taxonomyMapping.ts";
import {
  STATISTICS_TAXONOMY_MAPPINGS,
  getMappingsForIncidentType,
  getPrimaryMappingForIncidentType,
  getMappingsForTaxonomyCategory
} from "./taxonomyMapping.ts";
import { GUIDANCE_SUMMARIES } from "../guidance/manifest.ts";
import type { GuidanceSummary } from "../guidance/types.ts";
import type { CanonicalStatisticsDataset } from "./schema.ts";

/**
 * Returns the entire authoritative Cyber Security Incident Taxonomy registry.
 */
export function getTaxonomyRegistry(): readonly TaxonomyEntry[] {
  return CYBER_SECURITY_INCIDENT_TAXONOMY;
}

/**
 * Returns all official high-level categories.
 */
export function getOfficialCategories(): readonly TaxonomyCategory[] {
  return OFFICIAL_TAXONOMY_CATEGORIES;
}

/**
 * Returns official subcategories under a specific category.
 */
export function getOfficialSubcategories(category: TaxonomyCategory): TaxonomySubcategory[] {
  return getSubcategoriesForCategory(category);
}

/**
 * Returns all controlled taxonomy mappings for a reported incident type.
 */
export function getTaxonomyMappingsForType(
  type: StatisticsIncidentType | string
): StatisticsTaxonomyMapping[] {
  return getMappingsForIncidentType(type);
}

/**
 * Returns the primary controlled taxonomy mapping for a reported incident type.
 */
export function getPrimaryTaxonomyMapping(
  type: StatisticsIncidentType | string
): StatisticsTaxonomyMapping | undefined {
  return getPrimaryMappingForIncidentType(type);
}

/**
 * Resolves authoritative guidance summaries linked to a reported incident type via the taxonomy mappings.
 */
export function getGuidanceForIncidentType(
  type: StatisticsIncidentType | string
): GuidanceSummary[] {
  const mappings = getMappingsForIncidentType(type);
  const slugSet = new Set<string>();

  for (const m of mappings) {
    if (m.relevantGuidanceSlugs) {
      for (const slug of m.relevantGuidanceSlugs) {
        slugSet.add(slug);
      }
    }
  }

  return GUIDANCE_SUMMARIES.filter((g) => slugSet.has(g.slug));
}

/**
 * Resolves authoritative guidance summaries linked to a specific taxonomy category.
 */
export function getGuidanceForTaxonomyCategory(
  category: TaxonomyCategory
): GuidanceSummary[] {
  const mappings = getMappingsForTaxonomyCategory(category);
  const slugSet = new Set<string>();

  for (const m of mappings) {
    if (m.relevantGuidanceSlugs) {
      for (const slug of m.relevantGuidanceSlugs) {
        slugSet.add(slug);
      }
    }
  }

  return GUIDANCE_SUMMARIES.filter((g) => slugSet.has(g.slug));
}

export interface TaxonomyCoverageSummary {
  readonly totalOfficialEntries: number;
  readonly totalCategories: number;
  readonly mappedIncidentTypesCount: number;
  readonly totalMappingsCount: number;
  readonly mappedCategories: TaxonomyCategory[];
}

/**
 * Computes metadata coverage summary showing how reporting categories map into the taxonomy.
 */
export function getTaxonomyCoverageSummary(): TaxonomyCoverageSummary {
  const mappedCategories = Array.from(
    new Set(STATISTICS_TAXONOMY_MAPPINGS.map((m) => m.taxonomyCategory))
  );
  const mappedTypes = new Set(STATISTICS_TAXONOMY_MAPPINGS.map((m) => m.statisticsIncidentType));

  return {
    totalOfficialEntries: CYBER_SECURITY_INCIDENT_TAXONOMY.length,
    totalCategories: OFFICIAL_TAXONOMY_CATEGORIES.length,
    mappedIncidentTypesCount: mappedTypes.size,
    totalMappingsCount: STATISTICS_TAXONOMY_MAPPINGS.length,
    mappedCategories
  };
}

/**
 * Selects reporting statistics associated with a taxonomy category without generating policy.
 */
export function getStatisticsForTaxonomyCategory(
  category: TaxonomyCategory,
  dataset: CanonicalStatisticsDataset
): {
  relatedStatisticsTypes: StatisticsIncidentType[];
  latestYearIncidentVolume: number;
  historicalCumulativeVolume: number;
} {
  const mappings = getMappingsForTaxonomyCategory(category);
  const relatedTypes = Array.from(new Set(mappings.map((m) => m.statisticsIncidentType)));

  let latestVol = 0;
  let cumulativeVol = 0;

  const latestPeriod = dataset.periods[dataset.periods.length - 1];

  for (const p of dataset.periods) {
    if (p.matrix) {
      for (const type of relatedTypes) {
        const pub = p.matrix.publicSector[type] || 0;
        const priv = p.matrix.privateSector[type] || 0;
        const total = pub + priv;
        cumulativeVol += total;
        if (p.year === latestPeriod.year) {
          latestVol += total;
        }
      }
    }
  }

  return {
    relatedStatisticsTypes: relatedTypes,
    latestYearIncidentVolume: latestVol,
    historicalCumulativeVolume: cumulativeVol
  };
}
