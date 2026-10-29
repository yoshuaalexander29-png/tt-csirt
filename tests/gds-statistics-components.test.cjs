const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

test("GDS Component Architecture & Integrity Suite", async (t) => {
  const pageSource = fs.readFileSync(
    path.join(__dirname, "../src/pages/StatisticsPage.tsx"),
    "utf8"
  );
  const insightsSource = fs.readFileSync(
    path.join(__dirname, "../src/services/statistics/insights.ts"),
    "utf8"
  );
  const selectorsSource = fs.readFileSync(
    path.join(__dirname, "../src/services/statistics/selectors.ts"),
    "utf8"
  );
  const noticeSource = fs.readFileSync(
    path.join(__dirname, "../src/components/Notice.tsx"),
    "utf8"
  );
  const detailsSource = fs.readFileSync(
    path.join(__dirname, "../src/components/gcds/Details.tsx"),
    "utf8"
  );
  const dataTableSource = fs.readFileSync(
    path.join(__dirname, "../src/components/GcdsDataTable.tsx"),
    "utf8"
  );

  await t.test("1. Public copy excludes internal cache and methodology metadata", () => {
    assert.ok(pageSource.includes("TT-CSIRT publishes verified incident notifications"));
    assert.ok(!pageSource.includes("Publication status"));
    assert.ok(!pageSource.includes("Methodology version"));
    assert.ok(!pageSource.includes("Verified fallback"));
  });

  await t.test("2. Partial-period warning uses the shared GCDS Notice component", () => {
    assert.ok(pageSource.includes('<Notice') && pageSource.includes('type="warning"'), "Must use the warning Notice variant");
    assert.ok(noticeSource.includes("<GcdsNotice noticeRole={type}"), "Notice must delegate to GcdsNotice");
    assert.ok(!pageSource.includes("govuk-notification-banner"), "Must not misuse Notification Banner for statistics");
  });

  await t.test("3. Statistics figures use semantic figure and figcaption", () => {
    assert.ok(pageSource.includes("<figure"), "Must use semantic <figure>");
    assert.ok(pageSource.includes("<figcaption"), "Must use semantic <figcaption>");
  });

  await t.test("3a. Interactive chart identifies its action, measure, coverage and period", () => {
    assert.ok(pageSource.includes(">Compare annual notifications</h3>"));
    assert.ok(pageSource.includes("const chartSubtitle = `${selectedMeasureLabel} received by TT-CSIRT in Trinidad and Tobago, ${explorerPeriodLabel}.`;"));
  });

  await t.test("3b. Statistics tables keep the shared GCDS table and accessible captions", () => {
    assert.ok(!pageSource.includes("function StatisticsTable"), "StatisticsPage must not define a second local table renderer");
    assert.ok(pageSource.includes("<GcdsDataTable"));
    assert.ok(dataTableSource.includes("<GcdsTable"));
    assert.ok(dataTableSource.includes('slot="caption"'));
    assert.ok(pageSource.includes('captionClassName="govuk-visually-hidden"'), "Table captions stay available to assistive technology without repeating visible section headings");
    assert.ok(pageSource.includes('rowHeader: true'), "Tables should identify useful row headers");
    assert.ok(pageSource.includes('caption={`Annual category counts and cumulative totals'));
  });

  await t.test("4. Technical breakdowns use the shared GCDS Details component", () => {
    assert.ok(pageSource.includes("<Details title="), "Must use the shared Details component");
    assert.ok(detailsSource.includes("<GcdsDetails"), "Details must delegate to GcdsDetails");
    assert.ok(pageSource.includes("How category percentages are calculated"), "Must explain category percentages");
    assert.ok(pageSource.includes("count divided by the total for that reporting period"), "Must define the category percentage denominator");
    assert.ok(pageSource.includes("What the published checks cover"), "Must describe the checks and their limits");
  });

  await t.test("5. Scope and limitations are readable public content", () => {
    assert.ok(pageSource.includes("These figures count incident notifications recorded"));
    assert.ok(pageSource.includes("not every cyber incident"));
    assert.ok(pageSource.includes("Incidents that are not reported are not included"));
  });

  await t.test("10. Trend descriptions distinguish notifications from incidents and partial periods", () => {
    assert.ok(selectorsSource.includes("completed-year peak"));
    assert.ok(selectorsSource.includes("current partial period"));
    assert.ok(!selectorsSource.includes("recorded ${analysis.latestCompletedPeriod?.totalIncidents} incidents"));
    assert.ok(pageSource.includes('className="statistics-explorer-summary" aria-live="polite">{explorerSelection.summary}</p>'));
    assert.ok(selectorsSource.includes("The latest year is partial and is not directly comparable with full-year totals."));
    assert.ok(pageSource.includes("Annual notification benchmarks"));
    assert.ok(pageSource.includes("latest year partial"));
  });

  await t.test("6. No template leakage in source files or text", () => {
    // Check that there are no un-interpolated template literal markers in string literals
    assert.ok(!insightsSource.includes('"${'), "Must not contain raw un-interpolated template strings in insights");
    assert.ok(!insightsSource.includes("'${"), "Must not contain raw un-interpolated template strings in insights");
    assert.ok(!selectorsSource.includes('"${'), "Must not contain raw un-interpolated template strings in selectors");
    assert.ok(!selectorsSource.includes("'${"), "Must not contain raw un-interpolated template strings in selectors");

    // Check JSX return markup for literal template tags
    const jsxReturn = pageSource.substring(pageSource.lastIndexOf("return ("));
    // Check for literal unresolved placeholders, without flagging valid nested array syntax.
    assert.ok(!/\[\[year\]\]|\{\{year\}\}|\{\{dataThrough\}\}|\$\{year\}|\$\{dataThrough\}/.test(jsxReturn));
  });

  await t.test("7. Status tags are not overused (zero-pill discipline)", () => {
    // Persistence table rows and data summary should NOT be overloaded with tag pills
    assert.ok(!pageSource.includes("govuk-tag--blue"), "Persistence rows must not have arbitrary tag pills");
    assert.ok(!pageSource.includes("govuk-tag--yellow"), "Persistence rows must not have arbitrary tag pills");
  });

  await t.test("8. Headings do not contain '(Partial year)'", () => {
    assert.ok(!pageSource.includes("(Partial year)"), "Headings must not contain '(Partial year)'");
  });

  await t.test("9. Taxonomy relationship table follows GOV.UK semantic table patterns and avoids tag badges", () => {
    // Must NOT use govuk-tag in the taxonomy table
    assert.ok(!pageSource.includes("govuk-tag--grey"), "Must not use grey tags for taxonomy relationships");

    // Must use restrained semantic classes
    assert.ok(pageSource.includes('className="taxonomy-subcategory"'), "Must use taxonomy-subcategory");
    assert.ok(pageSource.includes('className="taxonomy-relationship"'), "Must use plain taxonomy relationship text");
    assert.ok(pageSource.includes('className="classification-note"'), "Must use classification-note");

    // Keep the taxonomy mapping focused on operational category and technical classification.
    assert.ok(pageSource.includes("Operational category"), "Must have Operational category header");
    assert.ok(pageSource.includes("Taxonomy classification"), "Must have Taxonomy classification header");
    assert.ok(pageSource.includes("Technical description"), "Must describe taxonomy classifications");
    assert.ok(!pageSource.includes("Published guidance"), "Must not repeat guidance links in every taxonomy row");

    // Must have accessible scroll container with role and tabIndex
    assert.ok(pageSource.includes('tabIndex={0}'), "Must have tabIndex={0} on responsive scroll container");
    assert.ok(dataTableSource.includes('role="region"'), "Shared table wrapper must expose a named region");
    assert.ok(pageSource.includes('id="taxonomy-relationship-table"'), "Must have id on taxonomy relationship table");
  });
});
