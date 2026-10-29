import {
  CanonicalStatisticsDataset,
  SectorTotals,
  IncidentTypeSectorBreakdown,
  CategoryRankingItem,
  HistoricalTrendItem,
  CompositionChangeItem,
  ConcentrationMetrics,
  CategoryPersistence
} from "./schema";

/**
 * RICH SOURCE CAPABILITIES ENGINE
 *
 * Provides pure, derived analytical selectors operating directly
 * on the validated canonical multi-dimensional dataset (YEAR × SECTOR × INCIDENT TYPE).
 *
 * Implements:
 * - year totals
 * - incident type totals
 * - sector totals
 * - incident type × sector totals
 * - incident type share
 * - sector share
 * - incident type share within sector
 * - sector share within incident type
 * - historical trends
 * - category rankings
 * - persistence
 * - concentration
 * - composition changes
 */

/**
 * Helper to round to 1 decimal place.
 */
function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

/**
 * 1. Year Totals
 * Returns a dictionary mapping year to total verified incident notification count.
 */
export function getYearTotals(dataset: CanonicalStatisticsDataset): Record<number, number> {
  const result: Record<number, number> = {};
  for (const p of dataset.periods) {
    const total = p.sectors.publicSector + p.sectors.privateSector;
    result[p.year] = total;
  }
  return result;
}

/**
 * 2. Incident Type Totals
 * Returns total incident notifications per incident type across all periods.
 * Derives from the multi-dimensional matrix when available, or categories.
 */
export function getIncidentTypeTotals(dataset: CanonicalStatisticsDataset): Record<string, number> {
  const totals: Record<string, number> = {};

  for (const p of dataset.periods) {
    if (p.matrix) {
      for (const [type, count] of Object.entries(p.matrix.publicSector)) {
        totals[type] = (totals[type] || 0) + count;
      }
      for (const [type, count] of Object.entries(p.matrix.privateSector)) {
        totals[type] = (totals[type] || 0) + count;
      }
    } else {
      for (const [type, count] of Object.entries(p.categories)) {
        totals[type] = (totals[type] || 0) + count;
      }
    }
  }

  return totals;
}

/**
 * 3. Sector Totals
 * Returns cumulative public and private sector totals, combined total, and percentage shares.
 */
export function getSectorTotals(dataset: CanonicalStatisticsDataset): SectorTotals {
  let publicSector = 0;
  let privateSector = 0;

  for (const p of dataset.periods) {
    publicSector += p.sectors.publicSector;
    privateSector += p.sectors.privateSector;
  }

  const total = publicSector + privateSector;
  const publicShare = total > 0 ? round1((publicSector / total) * 100) : 0;
  const privateShare = total > 0 ? round1((privateSector / total) * 100) : 0;

  return {
    publicSector,
    privateSector,
    total,
    publicShare,
    privateShare
  };
}

/**
 * 4. Incident Type × Sector Totals
 * Computes incident type × sector matrix totals and cross-sector shares within each incident type.
 */
export function getIncidentTypeSectorTotals(dataset: CanonicalStatisticsDataset): IncidentTypeSectorBreakdown {
  const breakdown: IncidentTypeSectorBreakdown = {};

  for (const p of dataset.periods) {
    if (p.matrix) {
      for (const [type, count] of Object.entries(p.matrix.publicSector)) {
        if (!breakdown[type]) {
          breakdown[type] = { publicSector: 0, privateSector: 0, total: 0, publicShareWithinType: 0, privateShareWithinType: 0 };
        }
        breakdown[type].publicSector += count;
        breakdown[type].total += count;
      }
      for (const [type, count] of Object.entries(p.matrix.privateSector)) {
        if (!breakdown[type]) {
          breakdown[type] = { publicSector: 0, privateSector: 0, total: 0, publicShareWithinType: 0, privateShareWithinType: 0 };
        }
        breakdown[type].privateSector += count;
        breakdown[type].total += count;
      }
    } else {
      for (const [type, count] of Object.entries(p.categories)) {
        if (!breakdown[type]) {
          breakdown[type] = { publicSector: 0, privateSector: 0, total: 0, publicShareWithinType: 0, privateShareWithinType: 0 };
        }
        breakdown[type].total += count;
      }
    }
  }

  // Calculate percentage shares within each type
  for (const type of Object.keys(breakdown)) {
    const item = breakdown[type];
    if (item.total > 0) {
      item.publicShareWithinType = round1((item.publicSector / item.total) * 100);
      item.privateShareWithinType = round1((item.privateSector / item.total) * 100);
    }
  }

  return breakdown;
}

/**
 * 5. Incident Type Share
 * Calculates percentage share of each incident type for a specific year, or cumulatively across all years.
 */
export function getIncidentTypeShare(dataset: CanonicalStatisticsDataset, year?: number): Record<string, number> {
  const typeCounts: Record<string, number> = {};
  let grandTotal = 0;

  const periods = year !== undefined
    ? dataset.periods.filter((p) => p.year === year)
    : dataset.periods;

  for (const p of periods) {
    if (p.matrix) {
      for (const [type, count] of Object.entries(p.matrix.publicSector)) {
        typeCounts[type] = (typeCounts[type] || 0) + count;
        grandTotal += count;
      }
      for (const [type, count] of Object.entries(p.matrix.privateSector)) {
        typeCounts[type] = (typeCounts[type] || 0) + count;
        grandTotal += count;
      }
    } else {
      for (const [type, count] of Object.entries(p.categories)) {
        typeCounts[type] = (typeCounts[type] || 0) + count;
        grandTotal += count;
      }
    }
  }

  const shares: Record<string, number> = {};
  for (const [type, count] of Object.entries(typeCounts)) {
    shares[type] = grandTotal > 0 ? round1((count / grandTotal) * 100) : 0;
  }
  return shares;
}

/**
 * 6. Sector Share
 * Calculates percentage share of public vs private sectors (optionally filtered to a year).
 */
export function getSectorShare(dataset: CanonicalStatisticsDataset, year?: number): { publicSector: number; privateSector: number } {
  const periods = year !== undefined
    ? dataset.periods.filter((p) => p.year === year)
    : dataset.periods;

  let pub = 0;
  let priv = 0;
  for (const p of periods) {
    pub += p.sectors.publicSector;
    priv += p.sectors.privateSector;
  }
  const total = pub + priv;
  return {
    publicSector: total > 0 ? round1((pub / total) * 100) : 0,
    privateSector: total > 0 ? round1((priv / total) * 100) : 0
  };
}

/**
 * 7. Incident Type Share Within Sector
 * Computes the distribution of incident types within a specified sector (e.g. what % of public sector notifications are Phishing).
 */
export function getIncidentTypeShareWithinSector(
  dataset: CanonicalStatisticsDataset,
  sector: "publicSector" | "privateSector",
  year?: number
): Record<string, number> {
  const counts: Record<string, number> = {};
  let sectorTotal = 0;

  const periods = year !== undefined
    ? dataset.periods.filter((p) => p.year === year)
    : dataset.periods;

  for (const p of periods) {
    if (p.matrix && p.matrix[sector]) {
      for (const [type, count] of Object.entries(p.matrix[sector])) {
        counts[type] = (counts[type] || 0) + count;
        sectorTotal += count;
      }
    }
  }

  const shares: Record<string, number> = {};
  for (const [type, count] of Object.entries(counts)) {
    shares[type] = sectorTotal > 0 ? round1((count / sectorTotal) * 100) : 0;
  }
  return shares;
}

/**
 * 8. Sector Share Within Incident Type
 * Computes what proportion of a specific incident type originated from the public vs private sector.
 */
export function getSectorShareWithinIncidentType(
  dataset: CanonicalStatisticsDataset,
  incidentType: string,
  year?: number
): { publicSector: number; privateSector: number } {
  const periods = year !== undefined
    ? dataset.periods.filter((p) => p.year === year)
    : dataset.periods;

  let pub = 0;
  let priv = 0;

  for (const p of periods) {
    if (p.matrix) {
      pub += p.matrix.publicSector[incidentType] || 0;
      priv += p.matrix.privateSector[incidentType] || 0;
    }
  }

  const total = pub + priv;
  return {
    publicSector: total > 0 ? round1((pub / total) * 100) : 0,
    privateSector: total > 0 ? round1((priv / total) * 100) : 0
  };
}

/**
 * 9. Historical Trends
 * Returns chronological multi-period trend points.
 */
export function getHistoricalTrends(dataset: CanonicalStatisticsDataset): HistoricalTrendItem[] {
  return dataset.periods.map((p) => ({
    year: p.year,
    isPartial: p.isPartial,
    totalIncidents: p.sectors.publicSector + p.sectors.privateSector,
    categories: { ...p.categories },
    sectors: { ...p.sectors }
  }));
}

/**
 * 10. Category Rankings
 * Ranks categories/incident types by notification volume and share.
 */
export function getCategoryRankings(dataset: CanonicalStatisticsDataset, year?: number): CategoryRankingItem[] {
  const counts: Record<string, number> = {};
  let total = 0;

  const periods = year !== undefined
    ? dataset.periods.filter((p) => p.year === year)
    : dataset.periods;

  for (const p of periods) {
    for (const [catName, count] of Object.entries(p.categories)) {
      counts[catName] = (counts[catName] || 0) + count;
      total += count;
    }
  }

  const items = Object.entries(counts).map(([name, count]) => ({
    name,
    count,
    sharePercentage: total > 0 ? round1((count / total) * 100) : 0,
    rank: 0
  }));

  items.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  items.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return items;
}

/**
 * 11. Category Persistence
 * Measures how persistently threat categories remain active across multi-year reporting.
 */
export function getCategoryPersistence(dataset: CanonicalStatisticsDataset): CategoryPersistence[] {
  const periods = dataset.periods;
  const allCategoryNames = Array.from(
    new Set(periods.flatMap((p) => Object.keys(p.categories)))
  );

  let grandTotal = 0;
  for (const p of periods) {
    grandTotal += p.sectors.publicSector + p.sectors.privateSector;
  }

  const latestPeriod = periods[periods.length - 1];
  const latestRankings = getCategoryRankings(dataset, latestPeriod.year);

  // Compute yearly rankings for historical rank analysis
  const yearlyRankings = new Map<number, CategoryRankingItem[]>();
  for (const p of periods) {
    yearlyRankings.set(p.year, getCategoryRankings(dataset, p.year));
  }

  return allCategoryNames
    .map((name) => {
      let yearsPresent = 0;
      let totalVolume = 0;
      let yearsRankedFirst = 0;
      let yearsInTopTwo = 0;

      for (const p of periods) {
        const c = p.categories[name] || 0;
        if (c > 0) yearsPresent++;
        totalVolume += c;

        const ranks = yearlyRankings.get(p.year) || [];
        const found = ranks.find((r) => r.name === name);
        if (found) {
          if (found.rank === 1) yearsRankedFirst++;
          if (found.rank <= 2) yearsInTopTwo++;
        }
      }

      const latestRankMatch = latestRankings.find((r) => r.name === name);
      const latestRank = latestRankMatch ? latestRankMatch.rank : 99;
      const latestShare = latestRankMatch ? latestRankMatch.sharePercentage : 0;

      let status: "persistently_dominant" | "emerging" | "intermittent" | "declining" = "intermittent";
      if (yearsRankedFirst >= 2 || yearsInTopTwo >= Math.ceil(periods.length / 2)) {
        status = "persistently_dominant";
      } else if (latestRank <= 2 && yearsInTopTwo <= 2) {
        status = "emerging";
      } else if (latestRank > 3 && yearsInTopTwo >= 2) {
        status = "declining";
      }

      return {
        name,
        totalHistoricalVolume: totalVolume,
        historicalShare: grandTotal > 0 ? round1((totalVolume / grandTotal) * 100) : 0,
        yearsPresent,
        yearsRankedFirst,
        yearsInTopTwo,
        latestRank,
        latestShare,
        status
      };
    })
    .sort((a, b) => b.totalHistoricalVolume - a.totalHistoricalVolume);
}

/**
 * 12. Concentration Metrics
 * Computes Herfindahl-Hirschman Index (HHI) and top-N category concentration.
 */
export function getConcentrationMetrics(dataset: CanonicalStatisticsDataset, year?: number): ConcentrationMetrics {
  const rankings = getCategoryRankings(dataset, year);
  const top1Share = rankings[0]?.sharePercentage || 0;
  const top2Share = round1((rankings[0]?.sharePercentage || 0) + (rankings[1]?.sharePercentage || 0));
  const top3Share = round1(
    (rankings[0]?.sharePercentage || 0) +
    (rankings[1]?.sharePercentage || 0) +
    (rankings[2]?.sharePercentage || 0)
  );
  const residualShare = round1(Math.max(0, 100 - top3Share));

  let hhi = 0;
  for (const r of rankings) {
    hhi += Math.round(r.sharePercentage * r.sharePercentage);
  }

  let concentrationLevel: "high" | "moderate" | "unconcentrated" = "unconcentrated";
  if (hhi >= 2500) {
    concentrationLevel = "high";
  } else if (hhi >= 1500) {
    concentrationLevel = "moderate";
  }

  return {
    top1Share,
    top2Share,
    top3Share,
    residualShare,
    herfindahlIndex: hhi,
    concentrationLevel
  };
}

/**
 * 13. Composition Changes
 * Evaluates structural shifts in category shares between two distinct recording years.
 */
export function getCompositionChanges(
  dataset: CanonicalStatisticsDataset,
  baseYear: number,
  targetYear: number
): CompositionChangeItem[] {
  const baseRankings = getCategoryRankings(dataset, baseYear);
  const targetRankings = getCategoryRankings(dataset, targetYear);

  const baseMap = new Map(baseRankings.map((r) => [r.name, r]));
  const targetMap = new Map(targetRankings.map((r) => [r.name, r]));

  const allNames = Array.from(new Set([...baseMap.keys(), ...targetMap.keys()]));

  return allNames.map((name) => {
    const base = baseMap.get(name) || { count: 0, sharePercentage: 0 };
    const target = targetMap.get(name) || { count: 0, sharePercentage: 0 };

    return {
      name,
      baseCount: base.count,
      targetCount: target.count,
      baseShare: base.sharePercentage,
      targetShare: target.sharePercentage,
      shareDelta: round1(target.sharePercentage - base.sharePercentage),
      countDelta: target.count - base.count
    };
  }).sort((a, b) => Math.abs(b.shareDelta) - Math.abs(a.shareDelta));
}
