import { useState, useEffect, useMemo } from "react";
import { getSynchronousStatistics, getResilientStatistics } from "../services/statisticsCache";
import {
  getCanonicalAnalysis,
  deriveStatisticsAnalysis,
  fromLegacyToCanonicalDataset,
  generatePrioritizedInsights,
  selectStatisticsPresentation,
  generateStatisticsCsv,
  generateStatisticsTableCsv,
  FullDerivedAnalysis,
  STATISTICS_TAXONOMY_MAPPINGS,
  getTaxonomyEntry,
  TAXONOMY_NAME
} from "../services/statistics/index";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { PageNavigation } from "../components/PageNavigation";
import { Notice } from "@/components/Notice";
import { Details } from "@/components/gcds/Details";
import { Button } from "@/components/gcds/Button";
import { FilterSelect } from "@/components/FilterSelect";
import { GcdsDataTable } from "../components/GcdsDataTable";
import { GcdsGrid } from "@gcds-core/components-react";
import type { ReactTableColumn } from "@gcds-core/components-react";
import { selectStatisticsExplorerData, type StatisticsExplorerMeasure } from "../services/statistics/selectors";
import { getFullYearComparisonSummary } from "../services/statistics/insights";

interface Props {
  onNavigateHome: () => void;
}

export function StatisticsPage({ onNavigateHome }: Props) {
  const initialCache = getSynchronousStatistics();
  const [currentAnalysis, setCurrentAnalysis] = useState<FullDerivedAnalysis>(() => {
    if (initialCache && initialCache.data) {
      try {
        const canonical = fromLegacyToCanonicalDataset(initialCache.data);
        return deriveStatisticsAnalysis(canonical);
      } catch {
        return getCanonicalAnalysis();
      }
    }
    return getCanonicalAnalysis();
  });

  const [fromYear, setFromYear] = useState(() => currentAnalysis.metadata.coverageStartYear);
  const [toYear, setToYear] = useState(() => currentAnalysis.latestPeriod.year);
  const [measure, setMeasure] = useState<StatisticsExplorerMeasure>("total");
  const [category, setCategory] = useState("");
  const [display, setDisplay] = useState("both");
  const [sortOrder, setSortOrder] = useState<"oldest" | "newest">("oldest");

  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!description) return;

    const previousDescription = description.content;
    description.content =
      "National cyber incident notifications reported to TT-CSIRT from 2019 onwards, with current-period figures, annual trends, category and sector breakdowns, and data limitations.";

    return () => {
      description.content = previousDescription;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    getResilientStatistics().then((res) => {
      if (!isMounted) return;
      try {
        const canonical = fromLegacyToCanonicalDataset(res.data);
        const derived = deriveStatisticsAnalysis(canonical);
        setCurrentAnalysis(derived);
      } catch (e) {
        console.error("Failed to parse resilient statistics:", e);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const presentation = useMemo(
    () => selectStatisticsPresentation(currentAnalysis),
    [currentAnalysis]
  );
  const insights = useMemo(
    () => generatePrioritizedInsights(currentAnalysis),
    [currentAnalysis]
  );
  const fullYearComparisonSummary = getFullYearComparisonSummary(currentAnalysis);

  const explorerYears = presentation.years;
  const explorerFrom = fromYear;
  const explorerTo = toYear;
  const explorerCategory = category || presentation.categoryNames[0] || "";
  const explorerSelection = selectStatisticsExplorerData(
    presentation.trendChart.series,
    presentation.categoryNames,
    explorerFrom,
    explorerTo,
    measure,
    explorerCategory,
  );
  const explorerSeries = explorerSelection.series;
  const explorerIncludesPartial = explorerSelection.includesPartialYear;
  const selectedMeasureLabel = explorerSelection.measureLabel;
  const explorerPeriodLabel = `${explorerFrom} to ${explorerTo}${explorerIncludesPartial ? "*" : ""}`;
  const chartSubtitle = `${selectedMeasureLabel} received by TT-CSIRT in Trinidad and Tobago, ${explorerPeriodLabel}.`;
  const sortedExplorerSeries = [...explorerSeries].sort((left, right) =>
    sortOrder === "newest" ? right.year - left.year : left.year - right.year,
  );

  const startCsvDownload = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  const handleDownloadCSV = () => startCsvDownload(
    generateStatisticsTableCsv(currentAnalysis),
    `ttcsirt-incident-statistics-${currentAnalysis.metadata.coverageStartYear}-${currentAnalysis.latestPeriod.year}-single-table.csv`,
  );

  const handleDownloadLegacyCSV = () => startCsvDownload(
    generateStatisticsCsv(currentAnalysis),
    `ttcsirt-incident-statistics-${currentAnalysis.metadata.coverageStartYear}-${currentAnalysis.latestPeriod.year}.csv`,
  );

  const navItems = [
    { id: "latest-reporting-position", label: "Reports received in " + currentAnalysis.latestPeriod.year },
    { id: "key-analytical-findings", label: "Key findings" },
    { id: "reporting-trend", label: "Notifications over time" },
    { id: "category-composition", label: "Incident categories" },
    { id: "sector-distribution", label: "Notifications by sector" },
    { id: "reporting-scope-and-validation", label: "About the figures" }
  ];

  // Validation Failure Safe State
  if (!currentAnalysis.validation.isValid) {
    return (
      <div className="govuk-grid-row app-page-grid-row">
        <div className="govuk-grid-column-two-thirds app-page-content">
          <h1 className="govuk-heading-xl" id="statistics-page-heading">
            National cyber incident statistics
          </h1>
          <div className="govuk-error-summary" aria-labelledby="error-summary-title" role="alert">
            <h2 className="govuk-error-summary__title" id="error-summary-title">
              Statistics are temporarily unavailable
            </h2>
            <div className="govuk-error-summary__body">
              <p className="govuk-body">
                The national cyber incident publication dataset is currently undergoing official data reconciliation.
              </p>
              <p className="govuk-body">
                For urgent statistical inquiries or historical records, please contact the TT-CSIRT coordination centre directly at{" "}
                <a href="mailto:contactus@ttcsirt.gov.tt" className="govuk-link">contactus@ttcsirt.gov.tt</a>.
              </p>
            </div>
          </div>
          <div className="govuk-!-margin-top-6">
            <a
              href="/"
              className="govuk-back-link"
              onClick={(e) => {
                e.preventDefault();
                onNavigateHome();
              }}
            >
              Return to homepage
            </a>
          </div>
        </div>
      </div>
    );
  }

  const latest = presentation.latestPosition;
  const meta = currentAnalysis.metadata;
  const benchmarks = currentAnalysis.completedBenchmarks;

  return (
    <div className="govuk-grid-row app-page-grid-row">
      <PageNavigation navItems={navItems} defaultActiveId={navItems[0]?.id} />

      <div className="govuk-grid-column-two-thirds app-page-content">
        {/* Page title */}
        <h1 className="govuk-heading-xl" id="statistics-page-heading">
          National cyber incident statistics
        </h1>

        {/* Publication scope */}
        <p className="govuk-body-l govuk-!-margin-bottom-6">
          TT-CSIRT publishes verified incident notifications received from {meta.coverageStartYear} onwards. These figures describe reports received by the team, not every cyber incident in Trinidad and Tobago.
        </p>

        {/* Current reporting position */}
        <section id="latest-reporting-position" className="govuk-!-margin-bottom-9">
          <h2 className="govuk-heading-l govuk-!-margin-bottom-3" id="latest-reporting-position-heading">
            {latest.periodHeading}
          </h2>
          {/* Partial-period warning text placed above statistics grid */}
          {latest.isPartial && (
            <Notice
              type="warning"
              title="Partial reporting period"
              titleAs="h3"
              id="latest-reporting-warning"
              className="govuk-!-margin-bottom-6"
            >
              <p className="govuk-body">
                The {currentAnalysis.latestPeriod.year} reporting period is partial. Do not compare it directly with full-year totals.
              </p>
            </Notice>
          )}

          <div id="latest-statistics-grid" className="statistics-latest-summary govuk-!-margin-bottom-6">
            <figure id="metric-phishing-bec" className="statistics-primary-finding govuk-!-margin-0">
              <figcaption className="statistics-primary-finding__label">
                <span className="statistics-metric-kicker">Most reported category</span>
                <span className="statistics-metric-name">{latest.topCategory.name}</span>
              </figcaption>
              <p className="statistics-primary-finding__value govuk-heading-xl govuk-!-font-tabular-numbers govuk-!-margin-bottom-0">
                {latest.topCategory.count}<span className="statistics-metric-unit"> notifications</span>
              </p>
              <p className="statistics-metric-share govuk-body-s govuk-!-margin-bottom-0">
                <strong>{latest.topCategory.sharePercentage}%</strong> of all {latest.totalIncidents} verified notifications in this period
              </p>
              <p className="govuk-body-s govuk-!-margin-top-2 govuk-!-margin-bottom-0">
                <a href="/guidance/phishing-scams" className="govuk-link">Recognise and prevent phishing</a>
              </p>
            </figure>

            <div className="statistics-secondary-findings">
              <figure id="metric-data-breach" className="statistics-secondary-finding govuk-!-margin-0">
                <figcaption className="statistics-secondary-finding__label">
                  <span className="statistics-metric-kicker">Second most reported category</span>
                  <span className="statistics-metric-name">{latest.secondCategory.name}</span>
                </figcaption>
                <p className="statistics-secondary-finding__value govuk-heading-l govuk-!-font-tabular-numbers govuk-!-margin-bottom-0">{latest.secondCategory.count}<span className="statistics-metric-unit"> notifications</span></p>
                <p className="statistics-metric-share govuk-body-s govuk-!-margin-bottom-0">
                  <strong>{latest.secondCategory.sharePercentage}%</strong> of all {latest.totalIncidents} verified notifications in this period
                </p>
                <p className="govuk-body-s govuk-!-margin-top-2 govuk-!-margin-bottom-0">
                  <a href="/guidance/responding-to-a-suspected-cyber-incident" className="govuk-link">Respond to a suspected compromise</a>
                </p>
              </figure>

              <figure id="metric-total-incidents" className="statistics-secondary-finding govuk-!-margin-0">
                <figcaption className="statistics-secondary-finding__label">
                  <span className="statistics-metric-kicker">All categories combined</span>
                  <span className="statistics-metric-name">Verified notifications received this period</span>
                </figcaption>
                <p className="statistics-secondary-finding__value govuk-heading-l govuk-!-font-tabular-numbers govuk-!-margin-bottom-0">{latest.totalIncidents}<span className="statistics-metric-unit"> notifications</span></p>
                <p className="statistics-metric-share govuk-body-s govuk-!-margin-bottom-0">
                  <strong>100%</strong> of the period total
                </p>
                <p className="govuk-body-s govuk-!-margin-top-2 govuk-!-margin-bottom-0">
                  <a href="/report-an-incident" className="govuk-link">Report a cyber incident to TT-CSIRT</a>
                </p>
              </figure>
            </div>
          </div>
        </section>

        {/* Key findings */}
        <section id="key-analytical-findings" className="govuk-!-margin-bottom-9">
          <h2 className="govuk-heading-l govuk-!-margin-bottom-3">
            Key findings
          </h2>
          <div className="govuk-!-margin-bottom-4">
            {insights.map((item) => (
              <article key={item.id} className="statistics-finding">
                <h3 className="govuk-heading-m govuk-!-margin-bottom-2">
                  {item.title}
                </h3>
                <p className="govuk-body govuk-!-margin-bottom-2">
                  {item.observation} {item.caveat}
                  {item.id === "category-concentration" && <> The <a href="/guidance/understanding-incident-categories" className="govuk-link">incident category guide</a> explains these reporting groups and their limits.</>}
                  {item.id === "sector-distribution" && <> Organisations can find the TT-CSIRT reporting route in <a href="/guidance/organisation-specific-incident-reporting" className="govuk-link">guidance on how to report an incident</a>.</>}
                  {item.id === "category-persistence" && <> Organisations can reduce payment-diversion and mailbox-takeover risk with <a href="/guidance/business-email-compromise" className="govuk-link">business email compromise guidance</a>.</>}
                </p>

                {item.relatedResources?.map((resource) => (
                  <p key={resource.href} className="govuk-body govuk-!-margin-bottom-3">
                    {resource.description}{" "}
                    <a href={resource.href} className="govuk-link">{resource.title}</a>.
                  </p>
                ))}
              </article>
            ))}
          </div>
        </section>

        {/* Reporting trend */}
        <section id="reporting-trend" className="govuk-!-margin-bottom-9">
          <h2 className="govuk-heading-l govuk-!-margin-bottom-3">
            Explore the notifications data
          </h2>
          <p className="govuk-body govuk-!-margin-bottom-4">
            Choose a period and measure to compare annual notification counts.
          </p>
          {fullYearComparisonSummary && (
            <p className="govuk-body statistics-trend-analysis">{fullYearComparisonSummary}</p>
          )}

          <div className="statistics-explorer-controls filter-panel" role="group" aria-label="Statistics filters">
            <GcdsGrid
              className="statistics-explorer-grid"
              columns="minmax(0, 1fr)"
              columnsTablet="repeat(2, minmax(0, 1fr))"
              columnsDesktop="repeat(3, minmax(0, 1fr))"
              gap="300"
              tag="div"
            >
              <FilterSelect id="statistics-from-year" name="fromYear" label="From year" value={String(explorerFrom)} onChange={(value) => { const year = Number(value); setFromYear(year); if (year > toYear) setToYear(year); }}>
                {explorerYears.map((year) => <option key={year} value={year}>{year}{currentAnalysis.allPeriods.find((period) => period.year === year)?.isPartial ? " (partial)" : ""}</option>)}
              </FilterSelect>
              <FilterSelect id="statistics-to-year" name="toYear" label="To year" value={String(explorerTo)} onChange={(value) => { const year = Number(value); setToYear(year); if (year < fromYear) setFromYear(year); }}>
                {explorerYears.map((year) => <option key={year} value={year}>{year}{currentAnalysis.allPeriods.find((period) => period.year === year)?.isPartial ? " (partial)" : ""}</option>)}
              </FilterSelect>
              <FilterSelect id="statistics-measure" name="measure" label="Measure" value={measure} onChange={(value) => { setMeasure(value as StatisticsExplorerMeasure); if (value === "category" && !category) setCategory(presentation.categoryNames[0] || ""); }}>
                <option value="total">Total notifications</option>
                <option value="publicSector">Public sector</option>
                <option value="privateSector">Private sector</option>
                <option value="category">Incident category</option>
              </FilterSelect>
              <FilterSelect id="statistics-category" name="category" label="Incident category" value={category} onChange={setCategory} disabled={measure !== "category"}>
                <option value="">Select an incident category</option>
                {presentation.categoryNames.map((name) => <option key={name} value={name}>{name}</option>)}
              </FilterSelect>
              <FilterSelect id="statistics-display" name="display" label="Display" value={display} onChange={setDisplay}>
                <option value="both">Chart and table</option>
                <option value="chart">Chart only</option>
                <option value="table">Table only</option>
              </FilterSelect>
              <FilterSelect id="statistics-sort" name="sort" label="Sort by" value={sortOrder} onChange={(value) => setSortOrder(value as "oldest" | "newest")} disabled={display === "chart"}>
                <option value="oldest">Oldest first</option>
                <option value="newest">Newest first</option>
              </FilterSelect>
            </GcdsGrid>
            <div className="statistics-explorer-actions">
              <Button type="button" role="secondary" className="statistics-reset" onClick={() => { setFromYear(currentAnalysis.metadata.coverageStartYear); setToYear(currentAnalysis.latestPeriod.year); setMeasure("total"); setCategory(""); setDisplay("both"); setSortOrder("oldest"); }}>
                Show all data
              </Button>
            </div>
          </div>
          <p className="statistics-explorer-summary" aria-live="polite">{explorerSelection.summary}</p>

          {(display === "both" || display === "chart") && <figure className="statistics-explorer-chart govuk-!-margin-bottom-4">
            <figcaption className="statistics-explorer-chart-copy">
              <h3 className="govuk-heading-s statistics-explorer-chart-title">Compare annual notifications</h3>
              <p className="govuk-body-s statistics-explorer-chart-subtitle">{chartSubtitle}</p>
            </figcaption>
            <div role="img" aria-label={`Line chart showing ${selectedMeasureLabel.toLowerCase()} received by TT-CSIRT in Trinidad and Tobago from ${explorerPeriodLabel}${explorerIncludesPartial ? ", with the latest year partial" : ""}.`}>
            <div style={{ height: "300px", width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={explorerSeries} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#b1b4b6" />
                  <XAxis
                    dataKey="period"
                    tick={{ fill: "#0b0c0c", fontSize: 16, fontFamily: '"GDS Transport", Arial, sans-serif' }}
                    axisLine={{ stroke: "#0b0c0c", strokeWidth: 2 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#0b0c0c", fontSize: 16, fontFamily: '"GDS Transport", Arial, sans-serif' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      fontFamily: '"GDS Transport", Arial, sans-serif',
                      borderRadius: 0,
                      border: "2px solid #0b0c0c",
                      boxShadow: "4px 4px 0 #0b0c0c"
                    }}
                    itemStyle={{ color: "#0b0c0c", fontWeight: "bold" }}
                    formatter={(value: number) => [`${value} notifications`, selectedMeasureLabel]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={selectedMeasureLabel}
                    stroke="#1d70b8"
                    strokeWidth={4}
                    activeDot={{ r: 8 }}
                    dot={{ strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            </div>
          </figure>}

          {(display === "both" || display === "table" || display === "chart") && (
            <>
              <h3 className={`govuk-heading-m govuk-!-margin-bottom-3${display === "chart" ? " govuk-visually-hidden" : ""}`}>
                Annual notification counts
              </h3>
              <GcdsDataTable captionClassName="govuk-visually-hidden"
                className={`statistics-explorer-table${display === "chart" ? " govuk-visually-hidden" : ""}`}
                tabIndex={0}
                caption={`Annual notification counts by year for ${selectedMeasureLabel.toLowerCase()}, ${explorerFrom} to ${explorerTo}${explorerIncludesPartial ? "; latest year partial" : ""}`}
                columns={[
                  { field: "period", header: "Year", rowHeader: true },
                  { field: "value", header: selectedMeasureLabel, alignment: "end" },
                ]}
                rows={sortedExplorerSeries.map((point) => ({ id: point.year, period: point.period, value: point.value }))}
              />
            </>
          )}

          {/* Full-year summary */}
          <h3 className="govuk-heading-m govuk-!-margin-bottom-3">Full-year summary</h3>
          <GcdsDataTable captionClassName="govuk-visually-hidden"
            className="statistics-data-table--annual-summary"
            caption={`Annual notification benchmarks from ${benchmarks.completedYears[0]} to ${benchmarks.completedYears[benchmarks.completedYears.length - 1]}`}
            columns={[{ field: "measure", header: "Measure", rowHeader: true }, { field: "notifications", header: "Notifications", alignment: "end" }]}
            rows={[
              { measure: `Highest annual total (${benchmarks.peak.year})`, notifications: benchmarks.peak.value },
              { measure: `Lowest annual total (${benchmarks.low.year})`, notifications: benchmarks.low.value },
              { measure: "Median annual total", notifications: benchmarks.median },
              { measure: "Mean annual total", notifications: benchmarks.mean },
              { measure: "Range (highest minus lowest)", notifications: benchmarks.range },
            ]}
          />
        </section>

        {/* Category breakdown */}
        <section id="category-composition" className="govuk-!-margin-bottom-9">
          <h2 className="govuk-heading-l govuk-!-margin-bottom-3">
            Incident categories
          </h2>
          <p className="govuk-body govuk-!-margin-bottom-4">
            Categories are ordered from most to fewest notifications.
          </p>

          <Details title="How category percentages are calculated" className="statistics-details govuk-!-margin-bottom-6">
              <p className="govuk-body">
                Each category's share is its notification count divided by the total for that reporting period, multiplied by 100 and rounded to one decimal place. Percentages rounded separately may not sum to exactly 100%. These shares describe notifications received by TT-CSIRT, not all cyber incidents or their severity.
              </p>
          </Details>

          {/* Category Share Distribution Table for Latest Period */}
          <div className="govuk-!-margin-bottom-6">
            <h3 className="govuk-heading-m govuk-!-margin-bottom-3">
                  Reports by incident category in {currentAnalysis.latestPeriod.year}
            </h3>
            <GcdsDataTable captionClassName="govuk-visually-hidden"
              className="statistics-data-table--latest-category"
              tabIndex={0}
              caption={`Category notification counts and shares of the ${currentAnalysis.latestPeriod.year} period total`}
              columns={[
                { field: "category", header: "Incident category", rowHeader: true },
                { field: "notifications", header: "Notifications", alignment: "end" },
                { field: "share", header: "Share of notifications", alignment: "end" },
              ]}
              rows={[
                ...currentAnalysis.latestPeriod.categoryMetrics.map((cat) => ({ category: cat.name, notifications: cat.count, share: `${cat.sharePercentage}%` })),
                { category: `Total (${currentAnalysis.latestPeriod.year})`, notifications: currentAnalysis.latestPeriod.totalIncidents, share: "100.0%" },
              ]}
            />

            {/* Operational reporting categories use a separate, finer-grained taxonomy. */}
            <Details id="taxonomy-mapping-details" title={`How these categories map to the ${TAXONOMY_NAME}`} className="statistics-details govuk-!-margin-top-6 govuk-!-margin-bottom-6">
                <p className="govuk-body govuk-!-margin-bottom-4">
                  The table shows how the published operational categories are linked to classifications in the national taxonomy. An operational category may link to more than one taxonomy classification; the available publication data does not document a case-level classification procedure.
                </p>

                <h3 className="govuk-heading-s govuk-!-margin-bottom-3">Category-to-taxonomy crosswalk</h3>
                <GcdsDataTable captionClassName="govuk-visually-hidden"
                  className="statistics-data-table--taxonomy"
                  id="taxonomy-relationship-table"
                  tabIndex={0}
                  caption="Operational reporting categories and their linked national taxonomy classifications"
                  columns={[
                    { field: "operational", header: "Operational category", rowHeader: true },
                    {
                      field: "classification", header: "Taxonomy classification",
                      renderCell: ({ row }) => (
                        <>
                          <span className="taxonomy-subcategory">{String(row.taxonomyClassification)}</span>
                          <span className="taxonomy-relationship">{String(row.relationship)}</span>
                        </>
                      ),
                    },
                    { field: "description", header: "Technical description", renderCell: ({ value }) => <span className="classification-note">{String(value)}</span> },
                  ]}
                  rows={STATISTICS_TAXONOMY_MAPPINGS.map((mapping) => {
                    const entry = getTaxonomyEntry(mapping.taxonomyCategory, mapping.taxonomySubcategory);
                    return {
                      id: mapping.id,
                      operational: mapping.statisticsIncidentType,
                      classification: `${mapping.taxonomyCategory} — ${mapping.taxonomySubcategory}`,
                      taxonomyClassification: `${mapping.taxonomyCategory} — ${mapping.taxonomySubcategory}`,
                      relationship: mapping.relationshipLabel,
                      description: [entry?.description, mapping.justification].filter(Boolean).join(" "),
                    };
                  })}
                />
            </Details>
          </div>

          {/* Full Multi-Year Cross-Tabulation Matrix */}
          <h3 className="govuk-heading-m govuk-!-margin-bottom-3">
            Notifications by category, {meta.coverageStartYear} to {currentAnalysis.latestPeriod.year}
          </h3>
          <GcdsDataTable captionClassName="govuk-visually-hidden"
            className="statistics-data-table--category-history"
            tabIndex={0}
            caption={`Annual category counts and cumulative totals from ${meta.coverageStartYear} to ${currentAnalysis.latestPeriod.year}`}
            columns={[
              { field: "category", header: "Incident category", rowHeader: true },
              ...currentAnalysis.allPeriods.map((period) => ({ field: `year-${period.year}`, header: `${period.year}${period.isPartial ? "*" : ""}`, alignment: "end" as const })),
              { field: "total", header: "Total", alignment: "end" },
            ]}
            rows={[
              ...presentation.matrixRows.map((row) => ({ category: row.categoryName, ...Object.fromEntries(currentAnalysis.allPeriods.map((period) => [`year-${period.year}`, row.valuesByYear[period.year] ?? 0])), total: row.totalHistorical })),
              { category: "Total notifications", ...Object.fromEntries(currentAnalysis.allPeriods.map((period) => [`year-${period.year}`, period.totalIncidents])), total: currentAnalysis.cumulativeTotals.totalIncidents },
            ]}
          />
          <p className="govuk-hint">
            * The current year is partial and is not directly comparable with full-year totals.
          </p>
        </section>

        {/* Sector breakdown */}
        <section id="sector-distribution" className="govuk-!-margin-bottom-9">
          <h2 className="govuk-heading-l govuk-!-margin-bottom-3">
            Notifications by sector
          </h2>

          <div className="govuk-!-margin-bottom-6" aria-hidden="true">
            <div style={{ height: "350px", width: "100%", marginLeft: "-15px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={presentation.trendChart.series} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#b1b4b6" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#0b0c0c", fontSize: 16, fontFamily: '"GDS Transport", Arial, sans-serif' }}
                    axisLine={{ stroke: "#0b0c0c", strokeWidth: 2 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#0b0c0c", fontSize: 16, fontFamily: '"GDS Transport", Arial, sans-serif' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      fontFamily: '"GDS Transport", Arial, sans-serif',
                      borderRadius: 0,
                      border: "2px solid #0b0c0c",
                      boxShadow: "4px 4px 0 #0b0c0c"
                    }}
                    formatter={(value: any, name: any) => [`${value} notifications`, name]}
                  />
                  <Legend
                    wrapperStyle={{ fontFamily: '"GDS Transport", Arial, sans-serif', fontSize: "16px", paddingTop: "20px" }}
                    iconType="circle"
                  />
                  <Line
                    type="monotone"
                    dataKey="publicSector"
                    name="Public sector"
                    stroke="#005ea5"
                    strokeWidth={4}
                    dot={{ strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="privateSector"
                    name="Private sector"
                    stroke="#d53880"
                    strokeWidth={4}
                    dot={{ strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="govuk-visually-hidden">
            <p>
              Line chart comparing public and private sector notifications from {meta.coverageStartYear} to {currentAnalysis.latestPeriod.year}.
              Public sector accounts for {currentAnalysis.cumulativeTotals.publicPercentage}% of cumulative notifications ({currentAnalysis.cumulativeTotals.publicSector} reports)
              and private sector accounts for {currentAnalysis.cumulativeTotals.privatePercentage}% ({currentAnalysis.cumulativeTotals.privateSector} reports).
            </p>
          </div>

          {/* Sector Data Table */}
          <h3 id="sector-reporting-heading" className="govuk-heading-m govuk-!-margin-top-6 govuk-!-margin-bottom-3">
            Notifications by sector, {meta.coverageStartYear} to {currentAnalysis.latestPeriod.year}
          </h3>
          <GcdsDataTable captionClassName="govuk-visually-hidden"
            className="statistics-data-table--sector"
            tabIndex={0}
            caption={`Annual public and private sector counts and cumulative shares from ${meta.coverageStartYear} to ${currentAnalysis.latestPeriod.year}`}
            columns={[
              { field: "sector", header: "Sector", rowHeader: true },
              ...currentAnalysis.allPeriods.map((period) => ({ field: `year-${period.year}`, header: `${period.year}${period.isPartial ? "*" : ""}`, alignment: "end" as const })),
              { field: "total", header: "Total", alignment: "end" },
              { field: "share", header: "Share of notifications", alignment: "end" },
            ]}
            rows={[
              { sector: "Public sector", ...Object.fromEntries(currentAnalysis.allPeriods.map((period, index) => [`year-${period.year}`, presentation.sectorTotalsByYear.publicSector[index]])), total: currentAnalysis.cumulativeTotals.publicSector, share: `${currentAnalysis.cumulativeTotals.publicPercentage}%` },
              { sector: "Private sector", ...Object.fromEntries(currentAnalysis.allPeriods.map((period, index) => [`year-${period.year}`, presentation.sectorTotalsByYear.privateSector[index]])), total: currentAnalysis.cumulativeTotals.privateSector, share: `${currentAnalysis.cumulativeTotals.privatePercentage}%` },
              { sector: "Total notifications", ...Object.fromEntries(currentAnalysis.allPeriods.map((period, index) => [`year-${period.year}`, presentation.sectorTotalsByYear.both[index]])), total: currentAnalysis.cumulativeTotals.totalIncidents, share: "100.0%" },
            ]}
          />
        </section>

        {/* Scope, limitations and download */}
        <section id="reporting-scope-and-validation" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l govuk-!-margin-bottom-3">
            About the figures
          </h2>
          <p className="govuk-body">
            These figures count incident notifications recorded in TT-CSIRT's publication data. They are not an estimate of every cyber incident, affected person, device or financial loss in Trinidad and Tobago.
          </p>

          <Details title="What the published checks cover" className="statistics-details govuk-!-margin-bottom-6">
              <p className="govuk-body">
                The source data records counts by year and incident category, together with public and private sector totals. The publication checks that category and sector counts reconcile for each year. The dataset labels its unit as verified notifications, but the available records do not define what verification includes or how related reports are handled.
              </p>
          </Details>

          <h3 className="govuk-heading-m govuk-!-margin-bottom-3">Limitations</h3>
          <ul className="govuk-list govuk-list--bullet govuk-!-margin-bottom-6">
            <li>
              Reports received by TT-CSIRT are not a complete count of cyber incidents in Trinidad and Tobago. Incidents that are not reported are not included.
            </li>
            <li>
              Changes in notification counts may reflect awareness, detection, reporting or other factors, not only changes in cyber activity.
            </li>
            <li>
              The 2026 reporting period runs through 23 July 2026 and is partial. It is not directly comparable with full-year totals.
            </li>
            <li>
              Sector shares describe submitted notifications, not relative exposure or inherent risk.
            </li>
          </ul>

          <div className="govuk-!-margin-top-6 govuk-!-margin-bottom-8">
            <h3 className="govuk-heading-m govuk-!-margin-bottom-2">
              Download the data
            </h3>
            <p className="govuk-body govuk-!-margin-bottom-4">
              The dataset covers 2019 to 23 July 2026; 2026 is partial. The source is the TT-CSIRT incident statistics dataset, and the unit is notifications received. The single-table file has one header row; each record is an annual total, category count, sector count or cumulative series total. Annual shares use that year's total; cumulative shares use the full series total through the latest reporting cutoff. The existing multi-section export remains available for compatibility.
            </p>
            <div className="statistics-download-actions">
              <Button type="button" role="secondary" onClick={handleDownloadCSV} id="download-statistics-csv-btn">
                Download single-table data (CSV)
              </Button>
              <Button type="button" role="secondary" onClick={handleDownloadLegacyCSV} id="download-statistics-legacy-csv-btn">
                Download existing multi-section CSV
              </Button>
            </div>
            {downloadSuccess && (
              <p className="govuk-body govuk-!-margin-top-2" role="status" aria-live="polite">
                Download started.
              </p>
            )}
          </div>

          <div className="govuk-!-margin-top-8 govuk-!-margin-bottom-8">
            <a
              href="/"
              className="govuk-back-link"
              onClick={(e) => {
                e.preventDefault();
                onNavigateHome();
              }}
            >
              Return to homepage
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
