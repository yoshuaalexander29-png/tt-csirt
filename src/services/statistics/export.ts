import { FullDerivedAnalysis } from "./schema";

const csvCell = (value: string | number | undefined): string => {
  const text = value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const legacyQuotedCell = (value: string): string => `"${value.replace(/"/g, '""')}"`;

/** Existing multi-section export retained for consumers of the current CSV format. */
export function generateStatisticsCsv(analysis: FullDerivedAnalysis): string {
  const { metadata, allPeriods: periods } = analysis;
  const lines: string[] = [
    "# TT-CSIRT National Cyber Incident Statistics Publication Dataset",
    `# Agency: ${metadata.agency}`,
    `# Source: ${metadata.source}`,
    `# Methodology Version: ${metadata.methodologyVersion}`,
    `# Reporting cutoff: ${analysis.latestPeriod.dataThrough}`,
    `# Unit of Measure: ${metadata.unitOfMeasure}`,
    `# Scope Note: ${metadata.scopeNote.replace(/,/g, ";")}`,
    `# Aggregate Validation: ${analysis.validation.auditStatement.replace(/,/g, ";")}`,
    "#",
    "Year,PeriodStatus,DataThrough,IncidentCategory,CategoryCount,CategorySharePct,PublicSectorCount,PrivateSectorCount,TotalYearIncidents",
  ];

  for (const period of periods) {
    const status = period.isPartial ? "Partial" : "Complete";
    const publicSector = period.sectorMetrics.find((sector) => sector.sector === "public")?.count ?? 0;
    const privateSector = period.sectorMetrics.find((sector) => sector.sector === "private")?.count ?? 0;
    for (const category of period.categoryMetrics) {
      lines.push(`${period.year},${status},${period.dataThrough},${legacyQuotedCell(category.name)},${category.count},${category.sharePercentage},${publicSector},${privateSector},${period.totalIncidents}`);
    }
  }

  lines.push("", "# Summary Matrix: Incident Category Counts by Year");
  const years = periods.map((period) => (period.isPartial ? `${period.year} (Partial)` : String(period.year)));
  lines.push(["Incident Category", ...years, "Cumulative Total", "Historical Share (%)"].map(legacyQuotedCell).join(","));

  for (const category of analysis.persistence) {
    const counts = periods.map((period) => period.categoryMetrics.find((metric) => metric.name === category.name)?.count ?? 0);
    lines.push([legacyQuotedCell(category.name), ...counts, category.totalHistoricalVolume, category.historicalShare].join(","));
  }

  lines.push([
    legacyQuotedCell("TOTAL INCIDENTS"),
    ...periods.map((period) => period.totalIncidents),
    analysis.cumulativeTotals.totalIncidents,
    "100.0",
  ].map(csvCell).join(","));

  return lines.join("\r\n");
}

/** Exports one rectangular, machine-readable table from the canonical analysis. */
export function generateStatisticsTableCsv(analysis: FullDerivedAnalysis): string {
  const rows: Array<Array<string | number | undefined>> = [[
    "record_type",
    "year",
    "period_status",
    "data_through",
    "incident_category",
    "sector",
    "notifications",
    "share_percent",
  ]];

  for (const period of analysis.allPeriods) {
    const periodStatus = period.isPartial ? "partial" : "complete";
    const publicSector = period.sectorMetrics.find((sector) => sector.sector === "public")?.count ?? 0;
    const privateSector = period.sectorMetrics.find((sector) => sector.sector === "private")?.count ?? 0;

    rows.push(["annual_total", period.year, periodStatus, period.dataThrough, undefined, undefined, period.totalIncidents, 100]);

    for (const category of period.categoryMetrics) {
      rows.push(["category", period.year, periodStatus, period.dataThrough, category.name, undefined, category.count, category.sharePercentage]);
    }

    for (const [sector, count] of [["public", publicSector], ["private", privateSector]] as const) {
      rows.push([
        "sector",
        period.year,
        periodStatus,
        period.dataThrough,
        undefined,
        sector,
        count,
        period.totalIncidents ? Number(((count / period.totalIncidents) * 100).toFixed(1)) : 0,
      ]);
    }
  }

  const latestCutoff = analysis.latestPeriod.dataThrough;
  for (const category of analysis.persistence) {
    rows.push(["series_category", undefined, "cumulative", latestCutoff, category.name, undefined, category.totalHistoricalVolume, category.historicalShare]);
  }

  for (const [sector, count, share] of [
    ["public", analysis.cumulativeTotals.publicSector, analysis.cumulativeTotals.publicPercentage],
    ["private", analysis.cumulativeTotals.privateSector, analysis.cumulativeTotals.privatePercentage],
  ] as const) {
    rows.push(["series_sector", undefined, "cumulative", latestCutoff, undefined, sector, count, share]);
  }

  rows.push(["series_total", undefined, "cumulative", latestCutoff, undefined, undefined, analysis.cumulativeTotals.totalIncidents, 100]);

  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
