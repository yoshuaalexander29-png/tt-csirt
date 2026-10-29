/**
 * Type Contracts and Data Schemas for TT-CSIRT National Cyber Incident Statistics
 *
 * Enforces the Single Source of Truth architecture:
 * Raw Canonical Data -> Runtime Validation -> Derived Analysis -> Presentation Selectors -> Export
 */

import type {
  TaxonomyCategory,
  TaxonomySubcategory,
  TaxonomyEntry
} from "../taxonomy/cyberSecurityIncidentTaxonomy";
import type {
  StatisticsIncidentType,
  StatisticsTaxonomyMapping,
  StatisticsTaxonomyRelationship
} from "./taxonomyMapping";

export type {
  TaxonomyCategory,
  TaxonomySubcategory,
  TaxonomyEntry,
  StatisticsIncidentType,
  StatisticsTaxonomyMapping,
  StatisticsTaxonomyRelationship
};

export type IncidentYear = number;

export type Sector = "publicSector" | "privateSector";

export interface SectorIncidentCounts {
  publicSector: Record<string, number>;
  privateSector: Record<string, number>;
}

export interface PeriodRecord {
  year: IncidentYear;
  isPartial: boolean;
  dataThrough: string; // ISO date format YYYY-MM-DD
  // Multi-dimensional canonical source matrix: YEAR × SECTOR × INCIDENT TYPE
  matrix?: SectorIncidentCounts;
  categories: Record<string, number>;
  sectors: {
    publicSector: number;
    privateSector: number;
  };
}

export type AnnualIncidentRecord = PeriodRecord;

export interface PublicationMetadata {
  agency: string;
  source: string;
  methodologyVersion: string;
  lastUpdated: string;
  unitOfMeasure: string;
  coverageStartYear: number;
  coverageEndYear: number;
  scopeNote: string;
  limitations: string[];
}

export interface CanonicalStatisticsDataset {
  metadata: PublicationMetadata;
  periods: PeriodRecord[];
}

// Validation contracts
export interface DiscrepancyRecord {
  year: number;
  dimension:
    | "category_sum"
    | "sector_sum"
    | "negative_count"
    | "non_integer"
    | "invalid_date"
    | "partial_period"
    | "metadata_mismatch"
    | "taxonomy_invalid";
  expected: number | string;
  actual: number | string;
  detail: string;
}

export interface ValidationReport {
  isValid: boolean;
  verifiedPeriodCount: number;
  completedPeriodCount: number;
  partialPeriodCount: number;
  discrepancies: DiscrepancyRecord[];
  auditStatement: string;
  validatedAt: string;
}

// Derived Analysis contracts
export interface CategoryMetric {
  name: string;
  count: number;
  sharePercentage: number; // Rounded to 1 decimal place (e.g. 67.6)
  rank: number; // 1 = highest
}

export interface SectorMetric {
  sector: "public" | "private";
  label: string;
  count: number;
  sharePercentage: number;
}

export interface ConcentrationMetrics {
  top1Share: number;
  top2Share: number;
  top3Share: number;
  residualShare: number;
  herfindahlIndex: number; // 0 to 10,000 index of category concentration
  concentrationLevel: "high" | "moderate" | "unconcentrated";
}

export interface CategoryPersistence {
  name: string;
  totalHistoricalVolume: number;
  historicalShare: number;
  yearsPresent: number;
  yearsRankedFirst: number;
  yearsInTopTwo: number;
  latestRank: number;
  latestShare: number;
  status: "persistently_dominant" | "emerging" | "intermittent" | "declining";
}

export interface CompletedPeriodBenchmarks {
  completedYears: number[];
  count: number;
  peak: { year: number; value: number };
  low: { year: number; value: number };
  mean: number;
  median: number;
  range: number;
  latestCompletedYear: number | null;
  latestCompletedPositionInRange: number | null; // 0.0 to 1.0
  latestCompletedRank: number | null; // 1 = highest ever
}

export interface PeriodComparison {
  isAvailable: boolean;
  baseYear: number;
  targetYear: number;
  absoluteChange: number | null;
  percentageChange: number | null;
  unavailabilityReason?: string;
}

export interface DerivedPeriodAnalysis {
  year: number;
  isPartial: boolean;
  dataThrough: string;
  totalIncidents: number;
  categoryMetrics: CategoryMetric[];
  sectorMetrics: SectorMetric[];
  concentration: ConcentrationMetrics;
}

export interface FullDerivedAnalysis {
  validation: ValidationReport;
  metadata: PublicationMetadata;
  allPeriods: DerivedPeriodAnalysis[];
  latestPeriod: DerivedPeriodAnalysis;
  previousPeriod: DerivedPeriodAnalysis | null;
  latestCompletedPeriod: DerivedPeriodAnalysis | null;
  previousCompletedPeriod: DerivedPeriodAnalysis | null;
  completedBenchmarks: CompletedPeriodBenchmarks;
  persistence: CategoryPersistence[];
  cumulativeTotals: {
    totalIncidents: number;
    publicSector: number;
    privateSector: number;
    publicPercentage: number;
    privatePercentage: number;
  };
  comparison: {
    latestCompletedVsPreviousCompleted: PeriodComparison;
  };
}

// Insight contracts
export type InsightType =
  | "dominant-category"
  | "concentration"
  | "sector-distribution"
  | "historical-context"
  | "persistence"
  | "composition-change"
  | "data-quality";

export interface AnalyticalInsight {
  id: string;
  type: InsightType;
  priorityScore: number; // Higher is prioritized
  title: string;
  observation: string;
  evidence: {
    primaryValue?: string | number;
    comparisonValue?: string | number;
    periodLabel?: string;
    sampleDescription?: string;
  };
  interpretation?: string;
  caveat?: string;
  relatedResources?: Array<{
    title: string;
    href: string;
    description: string;
  }>;
}

// Rich Analytical Dimensions contracts (Authoritative Shared-Drive Source Capabilities)
export interface SectorTotals {
  publicSector: number;
  privateSector: number;
  total: number;
  publicShare: number;
  privateShare: number;
}

export interface IncidentTypeSectorBreakdown {
  [incidentType: string]: {
    publicSector: number;
    privateSector: number;
    total: number;
    publicShareWithinType: number; // percentage (0-100)
    privateShareWithinType: number; // percentage (0-100)
  };
}

export interface CategoryRankingItem {
  name: string;
  count: number;
  sharePercentage: number;
  rank: number;
}

export interface HistoricalTrendItem {
  year: number;
  isPartial: boolean;
  totalIncidents: number;
  categories: Record<string, number>;
  sectors: {
    publicSector: number;
    privateSector: number;
  };
}

export interface CompositionChangeItem {
  name: string;
  baseCount: number;
  targetCount: number;
  baseShare: number;
  targetShare: number;
  shareDelta: number;
  countDelta: number;
}

