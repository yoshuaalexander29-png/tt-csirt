import type { FullDerivedAnalysis } from "./schema";

export interface TrendChartPoint {
  year: number;
  label: string;
  total: number;
  isPartial: boolean;
  publicSector: number;
  privateSector: number;
  [categoryName: string]: number | string | boolean;
}

export interface TrendChartViewModel {
  title: string;
  accessibleSummary: string;
  series: TrendChartPoint[];
  categoryNames: string[];
  maxVal: number;
}

export type StatisticsExplorerMeasure = "total" | "publicSector" | "privateSector" | "category";

export interface StatisticsExplorerPoint extends TrendChartPoint {
  value: number;
  period: string;
}

export interface StatisticsExplorerSelection {
  series: StatisticsExplorerPoint[];
  total: number;
  rangeTotal: number;
  includesPartialYear: boolean;
  measureLabel: string;
  summary: string;
}

/** Select the single filtered dataset used by the Statistics chart, table and summary. */
export function selectStatisticsExplorerData(
  series: TrendChartPoint[],
  categoryNames: string[],
  fromYear: number,
  toYear: number,
  measure: StatisticsExplorerMeasure,
  category: string,
): StatisticsExplorerSelection {
  const range = series.filter((point) => point.year >= fromYear && point.year <= toYear);
  const selectedCategory = category || categoryNames[0] || "incident category";
  const selectedSeries = range.map((point) => ({
    ...point,
    value: measure === "publicSector"
      ? point.publicSector
      : measure === "privateSector"
        ? point.privateSector
        : measure === "category"
          ? Number(point[selectedCategory] || 0)
          : point.total,
    period: `${point.year}${point.isPartial ? "*" : ""}`,
  }));
  const total = selectedSeries.reduce((sum, point) => sum + point.value, 0);
  const rangeTotal = range.reduce((sum, point) => sum + point.total, 0);
  const includesPartialYear = range.some((point) => point.isPartial);
  const measureLabel = measure === "publicSector"
    ? "Public sector notifications"
    : measure === "privateSector"
      ? "Private sector notifications"
      : measure === "category"
        ? `${selectedCategory} notifications`
        : "Total notifications";
  const start = range[0];
  const end = range[range.length - 1];
  const formatYear = (point: TrendChartPoint | undefined, fallback: number) =>
    `${point?.year ?? fallback}${point?.isPartial ? "*" : ""}`;
  const startYear = formatYear(start, fromYear);
  const endYear = formatYear(end, toYear);
  const period = startYear === endYear ? `in ${startYear}` : `from ${startYear} to ${endYear}`;
  const formatCount = (count: number) => count.toLocaleString();
  const notificationWord = (count: number) => count === 1 ? "notification" : "notifications";
  const countOfTotal = (count: number, denominator: number) =>
    `${formatCount(count)} of ${formatCount(denominator)} ${notificationWord(denominator)}`;
  const share = rangeTotal > 0 ? ((total / rangeTotal) * 100).toFixed(1) : "0.0";

  let summary: string;
  if (rangeTotal === 0) {
    summary = measure === "category"
      ? `No ${selectedCategory} notifications were recorded ${period}.`
      : measure === "publicSector"
        ? `No public sector notifications were recorded ${period}.`
        : measure === "privateSector"
          ? `No private sector notifications were recorded ${period}.`
          : `No verified notifications were received ${period}.`;
  } else if (measure === "category") {
    summary = total === 0
      ? `No ${selectedCategory} notifications were recorded ${period}.`
      : `${selectedCategory} accounted for ${countOfTotal(total, rangeTotal)} ${period} (${share}%).`;
  } else if (measure === "publicSector" || measure === "privateSector") {
    const sector = measure === "publicSector" ? "public" : "private";
    summary = `${sector[0].toUpperCase()}${sector.slice(1)} sector notifications accounted for ${countOfTotal(total, rangeTotal)} ${period} (${share}%).`;
  } else {
    const leadingCategory = categoryNames
      .map((name) => ({
        name,
        count: range.reduce((sum, point) => sum + Number(point[name] || 0), 0),
      }))
      .sort((left, right) => right.count - left.count)[0];
    summary = `TT-CSIRT received ${formatCount(total)} verified ${notificationWord(total)} ${period}.`;
    if (leadingCategory && leadingCategory.count > 0) {
      const leadingShare = ((leadingCategory.count / rangeTotal) * 100).toFixed(1);
      summary += ` The leading incident category was ${leadingCategory.name} (${formatCount(leadingCategory.count)} ${notificationWord(leadingCategory.count)}, ${leadingShare}% of the total).`;
    }
  }

  if (includesPartialYear) {
    summary += " The latest year is partial and is not directly comparable with full-year totals.";
  }

  return { series: selectedSeries, total, rangeTotal, includesPartialYear, measureLabel, summary };
}

export interface LatestPositionViewModel {
  periodHeading: string;
  periodLabel: string;
  dataThroughFormatted: string;
  isPartial: boolean;
  totalIncidents: number;
  topCategory: {
    name: string;
    count: number;
    sharePercentage: number;
  };
  secondCategory: {
    name: string;
    count: number;
    sharePercentage: number;
  };
  sectorSplit: {
    publicCount: number;
    publicShare: number;
    privateCount: number;
    privateShare: number;
  };
  concentration: {
    top2Share: number;
    top3Share: number;
    hhi: number;
    level: string;
  };
}

export interface MatrixTableRow {
  categoryName: string;
  valuesByYear: Record<number, number>;
  totalHistorical: number;
  historicalShare: number;
  latestRank: number;
}

export interface StatisticsPresentationModel {
  latestPosition: LatestPositionViewModel;
  trendChart: TrendChartViewModel;
  categoryNames: string[];
  years: number[];
  matrixRows: MatrixTableRow[];
  sectorTotalsByYear: {
    years: number[];
    publicSector: number[];
    privateSector: number[];
    both: number[];
  };
}

/**
 * Transforms raw analytical figures into accessible, presentation-ready view models.
 */
export function selectStatisticsPresentation(analysis: FullDerivedAnalysis): StatisticsPresentationModel {
  const latest = analysis.latestPeriod;
  const metadata = analysis.metadata;
  const allP = analysis.allPeriods;

  // Format date helper: "2026-07-23" -> "23 July 2026"
  const formatDate = (isoStr: string) => {
    try {
      const parts = isoStr.split("-");
      if (parts.length === 3) {
        const year = parts[0];
        const monthIdx = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const months = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];
        return `${day} ${months[monthIdx]} ${year}`;
      }
    } catch {
      // Fallback
    }
    return isoStr;
  };

  const topCat = latest.categoryMetrics[0] || { name: "None", count: 0, sharePercentage: 0 };
  const secCat = latest.categoryMetrics[1] || { name: "None", count: 0, sharePercentage: 0 };

  const pubMetric = latest.sectorMetrics.find((s) => s.sector === "public") || { count: 0, sharePercentage: 0 };
  const privMetric = latest.sectorMetrics.find((s) => s.sector === "private") || { count: 0, sharePercentage: 0 };

  const dataThroughFormatted = formatDate(latest.dataThrough);
  const periodHeading = latest.isPartial
    ? `Reports received from 1 January to ${dataThroughFormatted}`
    : `Reports received in ${latest.year}`;
  const periodLabel = latest.isPartial
    ? `1 January to ${dataThroughFormatted}`
    : `${latest.year}`;

  const latestPosition: LatestPositionViewModel = {
    periodHeading,
    periodLabel,
    dataThroughFormatted,
    isPartial: latest.isPartial,
    totalIncidents: latest.totalIncidents,
    topCategory: {
      name: topCat.name,
      count: topCat.count,
      sharePercentage: topCat.sharePercentage
    },
    secondCategory: {
      name: secCat.name,
      count: secCat.count,
      sharePercentage: secCat.sharePercentage
    },
    sectorSplit: {
      publicCount: pubMetric.count,
      publicShare: pubMetric.sharePercentage,
      privateCount: privMetric.count,
      privateShare: privMetric.sharePercentage
    },
    concentration: {
      top2Share: latest.concentration.top2Share,
      top3Share: latest.concentration.top3Share,
      hhi: latest.concentration.herfindahlIndex,
      level: latest.concentration.concentrationLevel
    }
  };

  // Extract distinct category names across all periods
  const categoryNames = analysis.persistence.map((p) => p.name);

  // Build Trend Chart points
  let maxVal = 0;
  const trendSeries: TrendChartPoint[] = allP.map((p) => {
    const pub = p.sectorMetrics.find((s) => s.sector === "public")?.count || 0;
    const priv = p.sectorMetrics.find((s) => s.sector === "private")?.count || 0;
    if (p.totalIncidents > maxVal) maxVal = p.totalIncidents;

    const point: TrendChartPoint = {
      year: p.year,
      label: p.isPartial ? `${p.year}*` : `${p.year}`,
      total: p.totalIncidents,
      isPartial: p.isPartial,
      publicSector: pub,
      privateSector: priv
    };

    for (const c of p.categoryMetrics) {
      point[c.name] = c.count;
    }

    return point;
  });

  const accessibleSummary = `TT-CSIRT notifications from ${allP[0]?.year} to ${latest.year}. The completed-year peak was ${analysis.completedBenchmarks.peak.value} notifications in ${analysis.completedBenchmarks.peak.year}. The most recent completed year (${analysis.latestCompletedPeriod?.year}) had ${analysis.latestCompletedPeriod?.totalIncidents} notifications. The current partial period runs through ${formatDate(latest.dataThrough)} and has ${latest.totalIncidents} notifications.`;

  const trendChart: TrendChartViewModel = {
    title: "How notification totals have changed since 2019",
    accessibleSummary,
    series: trendSeries,
    categoryNames,
    maxVal
  };

  // Build full matrix rows
  const matrixRows: MatrixTableRow[] = categoryNames.map((catName) => {
    const valuesByYear: Record<number, number> = {};
    for (const p of allP) {
      const match = p.categoryMetrics.find((c) => c.name === catName);
      valuesByYear[p.year] = match ? match.count : 0;
    }

    const persistItem = analysis.persistence.find((p) => p.name === catName);

    return {
      categoryName: catName,
      valuesByYear,
      totalHistorical: persistItem?.totalHistoricalVolume || 0,
      historicalShare: persistItem?.historicalShare || 0,
      latestRank: persistItem?.latestRank || 99
    };
  });

  // Sector totals by year
  const years = allP.map((p) => p.year);
  const pubByYear = allP.map((p) => p.sectorMetrics.find((s) => s.sector === "public")?.count || 0);
  const privByYear = allP.map((p) => p.sectorMetrics.find((s) => s.sector === "private")?.count || 0);
  const bothByYear = allP.map((p) => p.totalIncidents);

  return {
    latestPosition,
    trendChart,
    categoryNames,
    years,
    matrixRows,
    sectorTotalsByYear: {
      years,
      publicSector: pubByYear,
      privateSector: privByYear,
      both: bothByYear
    }
  };
}
