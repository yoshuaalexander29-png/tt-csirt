import { CANONICAL_INCIDENT_STATISTICS } from "./canonicalData";
import { deriveStatisticsAnalysis } from "./analysis";
import { generatePrioritizedInsights } from "./insights";
import { selectStatisticsPresentation } from "./selectors";
import { generateStatisticsCsv } from "./export";
import { validateCanonicalDataset } from "./validation";
import {
  CanonicalStatisticsDataset,
  FullDerivedAnalysis,
  ValidationReport,
  AnalyticalInsight,
  DerivedPeriodAnalysis,
  CategoryMetric,
  SectorMetric,
  ConcentrationMetrics,
  CategoryPersistence,
  CompletedPeriodBenchmarks
} from "./schema";

export * from "./schema";
export * from "./canonicalData";
export * from "./validation";
export * from "./analysis";
export * from "./richAnalysis";
export * from "./insights";
export * from "./selectors";
export * from "./export";
export * from "./taxonomy";
export * from "./taxonomySelectors";

/**
 * Legacy Adapter for existing interfaces (App.tsx, legacy test suites)
 */
export type IncidentCategory = {
  name: string;
  values: number[];
};

export type SectorStatistics = {
  privateSector: number[];
  publicSector: number[];
  both: number[];
};

export type IncidentStatistics = {
  years: number[];
  categories: IncidentCategory[];
  totals: number[];
  sectorData: SectorStatistics;
  latestYear: number;
  updatedAt: string;
  latestStats: {
    phishing: number;
    dataBreach: number;
    total: number;
  };
};

/**
 * Adapts modern validated Canonical Dataset or FullDerivedAnalysis into legacy IncidentStatistics structure.
 *
 * Automatically derives combined "Phishing & Business Email Compromise" from
 * separate "Phishing" and "Business Email Compromise" in the richer canonical source.
 */
export function toLegacyIncidentStatistics(
  source: CanonicalStatisticsDataset | FullDerivedAnalysis
): IncidentStatistics {
  // If FullDerivedAnalysis is passed
  if ("allPeriods" in source && "latestPeriod" in source) {
    const analysis = source as FullDerivedAnalysis;
    const years = analysis.allPeriods.map((p) => p.year);
    const totals = analysis.allPeriods.map((p) => p.totalIncidents);
    const latestP = analysis.latestPeriod;

    // Check if categories in analysis are already legacy or canonical
    const hasCombinedPhishing = analysis.persistence.some((p) =>
      p.name.includes("&") && p.name.toLowerCase().includes("phishing")
    );

    let categories: IncidentCategory[];

    if (hasCombinedPhishing) {
      categories = analysis.persistence.map((persist) => {
        const values = analysis.allPeriods.map((p) => {
          const match = p.categoryMetrics.find((c) => c.name === persist.name);
          return match ? match.count : 0;
        });
        return { name: persist.name, values };
      });
    } else {
      // Derive legacy categories combining Phishing and Business Email Compromise
      const legacyCategoryNames = [
        "Data breach & System Compromise",
        "Ransomware",
        "Phishing & Business Email Compromise",
        "Website Defacement & Denial of Service",
        "Malicious Insider"
      ];

      categories = legacyCategoryNames.map((legacyName) => {
        const values = analysis.allPeriods.map((p) => {
          if (legacyName === "Phishing & Business Email Compromise") {
            const phishing = p.categoryMetrics.find((c) => c.name === "Phishing")?.count || 0;
            const bec = p.categoryMetrics.find((c) => c.name === "Business Email Compromise")?.count || 0;
            const combined = p.categoryMetrics.find((c) => c.name === legacyName)?.count;
            return combined !== undefined ? combined : phishing + bec;
          }
          const match = p.categoryMetrics.find((c) => c.name === legacyName);
          return match ? match.count : 0;
        });
        return { name: legacyName, values };
      });
    }

    const privateSector = analysis.allPeriods.map(
      (p) => p.sectorMetrics.find((s) => s.sector === "private")?.count || 0
    );
    const publicSector = analysis.allPeriods.map(
      (p) => p.sectorMetrics.find((s) => s.sector === "public")?.count || 0
    );
    const both = totals;

    const phishingCat = categories.find((c) => c.name.toLowerCase().includes("phishing"));
    const breachCat = categories.find((c) => c.name.toLowerCase().includes("data breach"));
    const latestIdx = years.length - 1;

    return {
      years,
      categories,
      totals,
      sectorData: {
        privateSector,
        publicSector,
        both
      },
      latestYear: latestP.year,
      updatedAt: latestP.dataThrough,
      latestStats: {
        phishing: phishingCat?.values[latestIdx] || 0,
        dataBreach: breachCat?.values[latestIdx] || 0,
        total: latestP.totalIncidents
      }
    };
  }

  // If CanonicalStatisticsDataset is passed directly
  const dataset = source as CanonicalStatisticsDataset;
  const periods = dataset.periods;
  const years = periods.map((p) => p.year);
  const totals = periods.map((p) => p.sectors.publicSector + p.sectors.privateSector);
  const latestPeriod = periods[periods.length - 1];

  const legacyCategoryNames = [
    "Data breach & System Compromise",
    "Ransomware",
    "Phishing & Business Email Compromise",
    "Website Defacement & Denial of Service",
    "Malicious Insider"
  ];

  const categories: IncidentCategory[] = legacyCategoryNames.map((catName) => {
    const values = periods.map((p) => {
      if (catName === "Phishing & Business Email Compromise") {
        if (p.categories["Phishing & Business Email Compromise"] !== undefined) {
          return p.categories["Phishing & Business Email Compromise"];
        }
        const phishingInCat = p.categories["Phishing"] || 0;
        const becInCat = p.categories["Business Email Compromise"] || 0;
        if (phishingInCat > 0 || becInCat > 0) {
          return phishingInCat + becInCat;
        }
        if (p.matrix) {
          const phPub = p.matrix.publicSector["Phishing"] || 0;
          const phPriv = p.matrix.privateSector["Phishing"] || 0;
          const becPub = p.matrix.publicSector["Business Email Compromise"] || 0;
          const becPriv = p.matrix.privateSector["Business Email Compromise"] || 0;
          return phPub + phPriv + becPub + becPriv;
        }
        return 0;
      }

      if (p.categories[catName] !== undefined) {
        return p.categories[catName];
      }
      if (p.matrix) {
        const pub = p.matrix.publicSector[catName] || 0;
        const priv = p.matrix.privateSector[catName] || 0;
        return pub + priv;
      }
      return 0;
    });
    return { name: catName, values };
  });

  const privateSector = periods.map((p) => p.sectors.privateSector);
  const publicSector = periods.map((p) => p.sectors.publicSector);
  const both = totals;

  const latestIdx = years.length - 1;
  const phishingVal = categories.find((c) => c.name.includes("Phishing"))?.values[latestIdx] || 0;
  const breachVal = categories.find((c) => c.name.includes("Data breach"))?.values[latestIdx] || 0;

  return {
    years,
    categories,
    totals,
    sectorData: {
      privateSector,
      publicSector,
      both
    },
    latestYear: latestPeriod.year,
    updatedAt: latestPeriod.dataThrough,
    latestStats: {
      phishing: phishingVal,
      dataBreach: breachVal,
      total: totals[latestIdx]
    }
  };
}

/**
 * Adapts legacy IncidentStatistics structure into canonical CanonicalStatisticsDataset
 */
export function fromLegacyToCanonicalDataset(legacy: IncidentStatistics): CanonicalStatisticsDataset {
  const years = legacy.years || [];
  const latestYear = legacy.latestYear || (years.length > 0 ? years[years.length - 1] : 2026);
  const updatedAt = legacy.updatedAt || `${latestYear}-12-31`;

  const periods: CanonicalStatisticsDataset["periods"] = years.map((yr, idx) => {
    const isLatest = idx === years.length - 1;
    const isPartial = isLatest && updatedAt.includes(String(yr)) && !updatedAt.includes(`${yr}-12-31`);
    const dataThrough = isPartial ? updatedAt : `${yr}-12-31`;

    const categories: Record<string, number> = {};
    for (const cat of legacy.categories || []) {
      categories[cat.name] = cat.values[idx] || 0;
    }

    const publicSector = legacy.sectorData?.publicSector?.[idx] || 0;
    const privateSector = legacy.sectorData?.privateSector?.[idx] || 0;

    return {
      year: yr,
      isPartial,
      dataThrough,
      categories,
      sectors: {
        publicSector,
        privateSector
      }
    };
  });

  return {
    metadata: {
      agency: CANONICAL_INCIDENT_STATISTICS.metadata.agency,
      source: CANONICAL_INCIDENT_STATISTICS.metadata.source,
      methodologyVersion: CANONICAL_INCIDENT_STATISTICS.metadata.methodologyVersion,
      lastUpdated: updatedAt,
      unitOfMeasure: CANONICAL_INCIDENT_STATISTICS.metadata.unitOfMeasure,
      coverageStartYear: years[0] || 2019,
      coverageEndYear: latestYear,
      scopeNote: CANONICAL_INCIDENT_STATISTICS.metadata.scopeNote,
      limitations: CANONICAL_INCIDENT_STATISTICS.metadata.limitations
    },
    periods
  };
}

// Global cached singletons for the app runtime
let cachedAnalysis: FullDerivedAnalysis | null = null;

export function getCanonicalAnalysis(): FullDerivedAnalysis {
  if (!cachedAnalysis) {
    cachedAnalysis = deriveStatisticsAnalysis(CANONICAL_INCIDENT_STATISTICS);
  }
  return cachedAnalysis;
}

export const FALLBACK_STATISTICS: IncidentStatistics = toLegacyIncidentStatistics(getCanonicalAnalysis());
