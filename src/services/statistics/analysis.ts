import {
  CanonicalStatisticsDataset,
  CategoryMetric,
  CategoryPersistence,
  CompletedPeriodBenchmarks,
  ConcentrationMetrics,
  DerivedPeriodAnalysis,
  FullDerivedAnalysis,
  PeriodComparison,
  SectorMetric
} from "./schema";
import { validateCanonicalDataset } from "./validation";

/**
 * Pure Deterministic Statistical Analysis Engine
 *
 * All metrics, rankings, benchmarks, and historical context are derived mathematically.
 * No UI dependencies, no side effects, year-agnostic.
 */
export function deriveStatisticsAnalysis(dataset: CanonicalStatisticsDataset): FullDerivedAnalysis {
  const validation = validateCanonicalDataset(dataset);
  const periods = dataset.periods;

  const allPeriods: DerivedPeriodAnalysis[] = periods.map((period) => {
    // 1. Calculate total from categories
    const catKeys = Object.keys(period.categories);
    let totalIncidents = 0;
    for (const k of catKeys) {
      totalIncidents += period.categories[k] || 0;
    }

    // 2. Derive Category Metrics
    const rawCategories = catKeys.map((name) => ({
      name,
      count: period.categories[name] || 0
    }));

    // Sort descending by count, with name tie-breaker for strict determinism
    rawCategories.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    const categoryMetrics: CategoryMetric[] = rawCategories.map((c, idx) => ({
      name: c.name,
      count: c.count,
      sharePercentage: totalIncidents > 0 ? Math.round((c.count / totalIncidents) * 1000) / 10 : 0,
      rank: idx + 1
    }));

    // 3. Derive Sector Metrics
    const pub = period.sectors.publicSector || 0;
    const priv = period.sectors.privateSector || 0;
    const sectorMetrics: SectorMetric[] = [
      {
        sector: "public",
        label: "Public sector",
        count: pub,
        sharePercentage: totalIncidents > 0 ? Math.round((pub / totalIncidents) * 1000) / 10 : 0
      },
      {
        sector: "private",
        label: "Private sector",
        count: priv,
        sharePercentage: totalIncidents > 0 ? Math.round((priv / totalIncidents) * 1000) / 10 : 0
      }
    ];

    // 4. Derive Concentration Metrics
    const top1 = categoryMetrics[0]?.sharePercentage || 0;
    const top2 = (categoryMetrics[0]?.sharePercentage || 0) + (categoryMetrics[1]?.sharePercentage || 0);
    const top3 =
      (categoryMetrics[0]?.sharePercentage || 0) +
      (categoryMetrics[1]?.sharePercentage || 0) +
      (categoryMetrics[2]?.sharePercentage || 0);
    const residual = Math.max(0, Math.round((100 - top3) * 10) / 10);

    // Herfindahl-Hirschman Index: sum of squares of market shares (0 to 10,000)
    let hhi = 0;
    for (const c of categoryMetrics) {
      hhi += Math.pow(c.sharePercentage, 2);
    }
    hhi = Math.round(hhi);

    let concentrationLevel: "high" | "moderate" | "unconcentrated" = "unconcentrated";
    if (hhi > 2500) concentrationLevel = "high";
    else if (hhi >= 1500) concentrationLevel = "moderate";

    const concentration: ConcentrationMetrics = {
      top1Share: top1,
      top2Share: Math.round(top2 * 10) / 10,
      top3Share: Math.round(top3 * 10) / 10,
      residualShare: residual,
      herfindahlIndex: hhi,
      concentrationLevel
    };

    return {
      year: period.year,
      isPartial: period.isPartial,
      dataThrough: period.dataThrough,
      totalIncidents,
      categoryMetrics,
      sectorMetrics,
      concentration
    };
  });

  // Cumulative Totals
  let cumTotal = 0;
  let cumPub = 0;
  let cumPriv = 0;
  for (const p of allPeriods) {
    cumTotal += p.totalIncidents;
    const pubMetric = p.sectorMetrics.find((s) => s.sector === "public");
    const privMetric = p.sectorMetrics.find((s) => s.sector === "private");
    cumPub += pubMetric?.count || 0;
    cumPriv += privMetric?.count || 0;
  }

  const cumulativeTotals = {
    totalIncidents: cumTotal,
    publicSector: cumPub,
    privateSector: cumPriv,
    publicPercentage: cumTotal > 0 ? Math.round((cumPub / cumTotal) * 1000) / 10 : 0,
    privatePercentage: cumTotal > 0 ? Math.round((cumPriv / cumTotal) * 1000) / 10 : 0
  };

  // Segregate Completed Periods for Honest Benchmarking
  const completedPeriods = allPeriods.filter((p) => !p.isPartial);
  let peakVal = -Infinity;
  let peakYr = completedPeriods[0]?.year || 0;
  let lowVal = Infinity;
  let lowYr = completedPeriods[0]?.year || 0;
  let completedSum = 0;

  const completedTotals: number[] = [];

  for (const cp of completedPeriods) {
    completedSum += cp.totalIncidents;
    completedTotals.push(cp.totalIncidents);

    if (cp.totalIncidents > peakVal) {
      peakVal = cp.totalIncidents;
      peakYr = cp.year;
    }
    if (cp.totalIncidents < lowVal) {
      lowVal = cp.totalIncidents;
      lowYr = cp.year;
    }
  }

  // Calculate Median of Completed Periods
  let median = 0;
  if (completedTotals.length > 0) {
    const sorted = [...completedTotals].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      median = Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
    } else {
      median = sorted[mid];
    }
  }

  const completedMean =
    completedPeriods.length > 0 ? Math.round((completedSum / completedPeriods.length) * 10) / 10 : 0;
  const completedRange = peakVal >= lowVal && isFinite(peakVal) && isFinite(lowVal) ? peakVal - lowVal : 0;

  const latestCompletedPeriod = completedPeriods.length > 0 ? completedPeriods[completedPeriods.length - 1] : null;
  const previousCompletedPeriod = completedPeriods.length > 1 ? completedPeriods[completedPeriods.length - 2] : null;

  let latestCompletedPositionInRange: number | null = null;
  let latestCompletedRank: number | null = null;

  if (latestCompletedPeriod && completedRange > 0) {
    latestCompletedPositionInRange =
      Math.round(((latestCompletedPeriod.totalIncidents - lowVal) / completedRange) * 1000) / 1000;

    const rankOrder = [...completedTotals].sort((a, b) => b - a);
    latestCompletedRank = rankOrder.indexOf(latestCompletedPeriod.totalIncidents) + 1;
  }

  const completedBenchmarks: CompletedPeriodBenchmarks = {
    completedYears: completedPeriods.map((p) => p.year),
    count: completedPeriods.length,
    peak: { year: peakYr, value: peakVal },
    low: { year: lowYr, value: lowVal },
    mean: completedMean,
    median,
    range: completedRange,
    latestCompletedYear: latestCompletedPeriod?.year || null,
    latestCompletedPositionInRange,
    latestCompletedRank
  };

  // Comparison between completed full periods
  let completedComparison: PeriodComparison;
  if (latestCompletedPeriod && previousCompletedPeriod && previousCompletedPeriod.totalIncidents > 0) {
    const absChange = latestCompletedPeriod.totalIncidents - previousCompletedPeriod.totalIncidents;
    const pctChange =
      Math.round(((absChange) / previousCompletedPeriod.totalIncidents) * 1000) / 10;
    completedComparison = {
      isAvailable: true,
      baseYear: previousCompletedPeriod.year,
      targetYear: latestCompletedPeriod.year,
      absoluteChange: absChange,
      percentageChange: pctChange
    };
  } else {
    completedComparison = {
      isAvailable: false,
      baseYear: 0,
      targetYear: 0,
      absoluteChange: null,
      percentageChange: null,
      unavailabilityReason: "Insufficient completed historical periods for full-year comparison."
    };
  }

  // Persistence Analysis across all available periods
  const categoryNamesSet = new Set<string>();
  for (const p of dataset.periods) {
    for (const k of Object.keys(p.categories)) {
      categoryNamesSet.add(k);
    }
  }

  const persistence: CategoryPersistence[] = Array.from(categoryNamesSet).map((catName) => {
    let totalVol = 0;
    let yearsPresent = 0;
    let yearsRankedFirst = 0;
    let yearsInTopTwo = 0;

    for (const p of allPeriods) {
      const match = p.categoryMetrics.find((c) => c.name === catName);
      if (match && match.count > 0) {
        totalVol += match.count;
        yearsPresent++;
        if (match.rank === 1) yearsRankedFirst++;
        if (match.rank <= 2) yearsInTopTwo++;
      }
    }

    const histShare = cumTotal > 0 ? Math.round((totalVol / cumTotal) * 1000) / 10 : 0;
    const latestP = allPeriods[allPeriods.length - 1];
    const latestMatch = latestP.categoryMetrics.find((c) => c.name === catName);
    const latestRank = latestMatch?.rank || 99;
    const latestShare = latestMatch?.sharePercentage || 0;

    let status: CategoryPersistence["status"] = "declining";
    if (yearsRankedFirst >= 3 || (yearsRankedFirst >= 1 && latestRank === 1 && histShare >= 25)) {
      status = "persistently_dominant";
    } else if (latestRank <= 2 && yearsRankedFirst === 0 && latestShare > 15) {
      status = "emerging";
    } else if (yearsPresent < allPeriods.length / 2) {
      status = "intermittent";
    }

    return {
      name: catName,
      totalHistoricalVolume: totalVol,
      historicalShare: histShare,
      yearsPresent,
      yearsRankedFirst,
      yearsInTopTwo,
      latestRank,
      latestShare,
      status
    };
  });

  // Sort persistence descending by total volume
  persistence.sort((a, b) => b.totalHistoricalVolume - a.totalHistoricalVolume);

  const latestPeriod = allPeriods[allPeriods.length - 1];
  const previousPeriod = allPeriods.length > 1 ? allPeriods[allPeriods.length - 2] : null;

  return {
    validation,
    metadata: dataset.metadata,
    allPeriods,
    latestPeriod,
    previousPeriod,
    latestCompletedPeriod,
    previousCompletedPeriod,
    completedBenchmarks,
    persistence,
    cumulativeTotals,
    comparison: {
      latestCompletedVsPreviousCompleted: completedComparison
    }
  };
}
