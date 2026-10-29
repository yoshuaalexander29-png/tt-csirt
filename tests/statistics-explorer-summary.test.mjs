import assert from "node:assert/strict";
import test from "node:test";
import { selectStatisticsExplorerData } from "../src/services/statistics/selectors.ts";

const phishing = "Phishing & Business Email Compromise";
const dataBreach = "Data breach & System Compromise";
const series = [
  { year: 2019, label: "2019", total: 1, isPartial: false, publicSector: 1, privateSector: 0, [phishing]: 1, [dataBreach]: 0 },
  { year: 2025, label: "2025", total: 2, isPartial: false, publicSector: 1, privateSector: 1, [phishing]: 1, [dataBreach]: 1 },
  { year: 2026, label: "2026*", total: 3, isPartial: true, publicSector: 2, privateSector: 1, [phishing]: 2, [dataBreach]: 1 },
  { year: 2024, label: "2024", total: 0, isPartial: false, publicSector: 0, privateSector: 0, [phishing]: 0, [dataBreach]: 0 },
];
const categories = [phishing, dataBreach];

test("Statistics explorer derives consistent filtered series and summaries", () => {
  const total = selectStatisticsExplorerData(series, categories, 2025, 2026, "total", phishing);
  assert.deepEqual(total.series.map(({ year, value }) => [year, value]), [[2025, 2], [2026, 3]]);
  assert.equal(total.total, 5);
  assert.equal(total.rangeTotal, 5);
  assert.match(total.summary, /5 verified notifications from 2025 to 2026\*/);
  assert.match(total.summary, /Phishing & Business Email Compromise \(3 notifications, 60\.0% of the total\)/);
  assert.match(total.summary, /latest year is partial/);

  const category = selectStatisticsExplorerData(series, categories, 2026, 2026, "category", phishing);
  assert.equal(category.total, 2);
  assert.equal(category.rangeTotal, 3);
  assert.match(category.summary, /2 of 3 notifications in 2026\* \(66\.7%\)/);
  assert.match(category.summary, /latest year is partial/);

  const publicSector = selectStatisticsExplorerData(series, categories, 2025, 2026, "publicSector", phishing);
  assert.equal(publicSector.total, 3);
  assert.match(publicSector.summary, /3 of 5 notifications from 2025 to 2026\* \(60\.0%\)/);
  assert.doesNotMatch(publicSector.summary, /leading incident category/);

  const zeroCategory = selectStatisticsExplorerData(series, categories, 2019, 2019, "category", dataBreach);
  assert.equal(zeroCategory.total, 0);
  assert.match(zeroCategory.summary, /No Data breach & System Compromise notifications were recorded in 2019\./);

  const empty = selectStatisticsExplorerData(series, categories, 2024, 2024, "total", phishing);
  assert.equal(empty.total, 0);
  assert.match(empty.summary, /No verified notifications were received in 2024\./);

  const singular = selectStatisticsExplorerData(series, categories, 2019, 2019, "total", phishing);
  assert.match(singular.summary, /1 verified notification in 2019/);
  assert.match(singular.summary, /1 notification, 100\.0%/);
});
