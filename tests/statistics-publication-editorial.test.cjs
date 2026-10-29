const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const page = fs.readFileSync(path.join(__dirname, "../src/pages/StatisticsPage.tsx"), "utf8");
const insights = fs.readFileSync(path.join(__dirname, "../src/services/statistics/insights.ts"), "utf8");
const document = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");

test("Statistics publication stays concise, descriptive and public-facing", async (t) => {
  await t.test("removes mechanical link groups and implementation labels", () => {
    assert.ok(!page.includes("Related guidance:"));
    assert.ok(!page.includes("Publication status"));
    assert.ok(!page.includes("Verified fallback"));
    assert.ok(!page.includes("Visual proportion"));
    assert.ok(!page.includes("Reporting status"));
    assert.ok(page.includes("statistics-data-table--category-history"));
    assert.ok(page.includes("Annual category counts and cumulative totals"));
  });

  await t.test("keeps one insight for each distinct analytical contribution", () => {
    assert.equal((insights.match(/findings\.push\(/g) || []).length, 3);
    assert.ok(insights.includes("category-concentration"));
    assert.ok(insights.includes("sector-distribution"));
    assert.ok(insights.includes("category-persistence"));
    assert.ok(page.includes("resource.description"));
    assert.ok(page.includes("resource.title"));
  });

  await t.test("keeps category and year tables readable without redundant summaries", () => {
    assert.ok(page.includes("Share of notifications"));
    assert.ok(page.includes("Full-year summary"));
    assert.ok(page.includes("Notifications by category"));
    assert.ok(!page.includes('govuk-table__header">Visual proportion'));
  });

  await t.test("provides page-specific title and description without disabling indexing", () => {
    assert.ok(page.includes('meta[name="description"]'));
    assert.ok(document.includes("TT-CSIRT provides cyber security incident response"));
    assert.ok(!document.includes("noindex"));
  });
});
