const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const pageSource = fs.readFileSync(
  path.join(__dirname, '../src/pages/StatisticsPage.tsx'),
  'utf8'
);
const styles = fs.readFileSync(
  path.join(__dirname, '../src/styles/homepage.css'),
  'utf8'
);

describe('Latest reporting position hierarchy', () => {
  it('places the partial-period warning before the summary', () => {
    assert.ok(pageSource.includes('id="latest-reporting-position-heading"'));
    assert.ok(pageSource.includes('{latest.periodHeading}'));
    const warningIndex = pageSource.indexOf('id="latest-reporting-warning"');
    const summaryIndex = pageSource.indexOf('id="latest-statistics-grid"');
    assert.ok(warningIndex > 0 && warningIndex < summaryIndex);
    assert.ok(pageSource.includes('The {currentAnalysis.latestPeriod.year} reporting period is partial. Do not compare it directly with full-year totals.'));
  });

  it('uses one full-width primary figure followed by two comparable measures', () => {
    const summary = pageSource.substring(
      pageSource.indexOf('id="latest-statistics-grid"'),
      pageSource.indexOf('</section>', pageSource.indexOf('id="latest-statistics-grid"'))
    );
    assert.ok(summary.includes('statistics-primary-finding'));
    assert.ok(summary.includes('statistics-secondary-findings'));
    assert.ok(summary.includes('id="metric-phishing-bec"'));
    assert.ok(summary.includes('id="metric-data-breach"'));
    assert.ok(summary.includes('id="metric-total-incidents"'));
    assert.ok(summary.indexOf('id="metric-phishing-bec"') < summary.indexOf('statistics-secondary-findings'));
    assert.ok(summary.includes('govuk-!-font-tabular-numbers'));
    assert.ok(styles.includes('grid-template-columns: repeat(2, minmax(0, 1fr))'));
    assert.ok(styles.includes('grid-template-columns: minmax(0, 1fr)'));
    assert.ok(!summary.includes('bg-[#f3f2f1]'));
  });

  it('labels each figure, unit, share, and reporting period explicitly', () => {
    assert.match(pageSource, /<figure id="metric-phishing-bec"[\s\S]*?<figcaption/);
    assert.ok(pageSource.includes('{latest.topCategory.count}'));
    assert.ok(pageSource.includes('{latest.secondCategory.count}'));
    assert.ok(pageSource.includes('{latest.totalIncidents}'));
    assert.ok(pageSource.includes('Most reported category'));
    assert.ok(pageSource.includes('Second most reported category'));
    assert.ok(pageSource.includes('All categories combined'));
    assert.ok(pageSource.includes('statistics-metric-unit'));
    assert.ok(pageSource.includes('<strong>{latest.topCategory.sharePercentage}%</strong>'));
    assert.ok(pageSource.includes('<strong>{latest.secondCategory.sharePercentage}%</strong>'));
    assert.ok(pageSource.includes('of all {latest.totalIncidents} verified notifications in this period'));
    assert.ok(pageSource.includes('{latest.periodHeading}'));
  });
});
