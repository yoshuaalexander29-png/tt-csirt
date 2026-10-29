import { AnalyticalInsight, FullDerivedAnalysis } from "./schema";

/** Describes the requested completed-year comparison from the canonical derived series. */
export function getFullYearComparisonSummary(analysis: FullDerivedAnalysis): string | null {
  const completedPeriod = (year: number) => analysis.allPeriods.find((period) => period.year === year && !period.isPartial);
  const period2023 = completedPeriod(2023);
  const period2024 = completedPeriod(2024);
  const period2025 = completedPeriod(2025);
  const categoryName = "Phishing & Business Email Compromise";
  const category2023 = period2023?.categoryMetrics.find((category) => category.name === categoryName);
  const category2024 = period2024?.categoryMetrics.find((category) => category.name === categoryName);

  if (!period2023 || !period2024 || !period2025 || !category2023 || !category2024) return null;

  const otherCategories2023 = period2023.totalIncidents - category2023.count;
  const otherCategories2024 = period2024.totalIncidents - category2024.count;
  const describeChange = (before: number, after: number, includePercentage = true): string => {
    const difference = after - before;
    if (difference === 0) return `did not change, remaining at ${after}`;
    const direction = difference > 0 ? "increased" : "decreased";
    const percentage = !includePercentage || before === 0 ? "" : ` (${((Math.abs(difference) / Math.abs(before)) * 100).toFixed(1)}%)`;
    return `${direction} by ${Math.abs(difference)}${percentage}, from ${before} to ${after}`;
  };

  return `Notifications ${describeChange(period2023.totalIncidents, period2024.totalIncidents)} between 2023 and 2024, then ${describeChange(period2024.totalIncidents, period2025.totalIncidents)} between 2024 and 2025. Phishing and business email compromise notifications ${describeChange(category2023.count, category2024.count, false)}; notifications across the other categories ${describeChange(otherCategories2023, otherCategories2024, false)} from 2023 to 2024. These are changes in notifications received and do not establish why the counts changed.`;
}

/** Build a small set of evidence-led findings that add context beyond the tables. */
export function generatePrioritizedInsights(analysis: FullDerivedAnalysis): AnalyticalInsight[] {
  const findings: AnalyticalInsight[] = [];
  const latest = analysis.latestPeriod;
  const [first, second] = latest.categoryMetrics;

  if (first && second) {
    findings.push({
      id: "category-concentration",
      type: "concentration",
      priorityScore: 90,
      title: "Two categories account for most notifications",
      observation: `${first.name} and ${second.name} together accounted for ${latest.concentration.top2Share}% of the ${latest.totalIncidents} notifications in ${latest.year}.`,
      evidence: {
        primaryValue: `${latest.concentration.top2Share}%`,
        comparisonValue: first.count + second.count,
        periodLabel: String(latest.year),
        sampleDescription: `${latest.totalIncidents} notifications`
      },
      caveat: "This describes notifications received, not the likelihood or severity of each type of incident."
    });
  }

  const publicSector = latest.sectorMetrics.find((sector) => sector.sector === "public");
  const privateSector = latest.sectorMetrics.find((sector) => sector.sector === "private");
  if (publicSector && privateSector) {
    findings.push({
      id: "sector-distribution",
      type: "sector-distribution",
      priorityScore: 85,
      title: "Most notifications came from public sector organisations",
      observation: `${publicSector.count} of ${latest.totalIncidents} notifications (${publicSector.sharePercentage}%) came from public sector organisations. Private sector organisations submitted ${privateSector.count} (${privateSector.sharePercentage}%).`,
      evidence: {
        primaryValue: `${publicSector.sharePercentage}% public / ${privateSector.sharePercentage}% private`,
        comparisonValue: publicSector.count,
        periodLabel: String(latest.year),
        sampleDescription: `${latest.totalIncidents} notifications`
      },
      caveat: "These figures count notifications received by TT-CSIRT and are not a direct comparison of underlying risk. This page does not establish whether a particular public body has a separate administrative reporting duty."
    });
  }

  const phishing = analysis.persistence.find((category) =>
    category.name.toLowerCase().includes("phishing")
  );
  if (phishing) {
    findings.push({
      id: "category-persistence",
      type: "persistence",
      priorityScore: 80,
      title: "Phishing has led the published series",
      observation: `Since ${analysis.metadata.coverageStartYear}, ${phishing.name} accounts for ${phishing.totalHistoricalVolume} of ${analysis.cumulativeTotals.totalIncidents} notifications (${phishing.historicalShare}%) and ranked first in ${phishing.yearsRankedFirst} of ${analysis.allPeriods.length} reporting periods.`,
      evidence: {
        primaryValue: `${phishing.historicalShare}%`,
        comparisonValue: `${phishing.yearsRankedFirst} of ${analysis.allPeriods.length} periods`,
        periodLabel: `${analysis.metadata.coverageStartYear}–${analysis.metadata.coverageEndYear}`,
        sampleDescription: `${analysis.cumulativeTotals.totalIncidents} notifications`
      },
    });
  }

  return findings;
}
