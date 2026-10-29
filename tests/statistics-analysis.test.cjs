const test = require("node:test");
const assert = require("node:assert");

// Load the compiled or direct fallback data
const FALLBACK_STATISTICS = {
  years: [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
  categories: [
    { name: "Data breach & System Compromise", values: [1, 28, 2, 9, 7, 5, 10, 17] },
    { name: "Ransomware", values: [1, 5, 2, 7, 13, 9, 5, 1] },
    { name: "Phishing & Business Email Compromise", values: [8, 12, 27, 18, 23, 97, 63, 48] },
    { name: "Website Defacement & Denial of Service", values: [13, 7, 2, 9, 8, 6, 12, 4] },
    { name: "Malicious Insider", values: [0, 0, 2, 0, 1, 1, 1, 1] }
  ],
  totals: [23, 52, 35, 43, 52, 118, 91, 71],
  sectorData: {
    privateSector: [6, 35, 20, 27, 29, 12, 21, 16],
    publicSector: [17, 17, 15, 16, 23, 106, 70, 55],
    both: [23, 52, 35, 43, 52, 118, 91, 71]
  },
  latestYear: 2026,
  updatedAt: "2026-07-23",
  latestStats: { phishing: 48, dataBreach: 17, total: 71 }
};

test("TT-CSIRT Statistics Analysis Suite", async (t) => {
  // We can dynamically compile or test the logic directly in JavaScript matching the TypeScript module
  
  function validateIncidentStatistics(stats) {
    const discrepancies = [];
    const yearsCount = stats.years.length;

    if (stats.totals.length !== yearsCount) {
      discrepancies.push({ year: 0, dimension: "array_length", expected: yearsCount, actual: stats.totals.length });
    }

    for (const cat of stats.categories) {
      if (cat.values.length !== yearsCount) {
        discrepancies.push({ year: 0, dimension: "array_length", expected: yearsCount, actual: cat.values.length });
      }
    }

    let categoryReconciled = true;
    let sectorReconciled = true;

    for (let i = 0; i < yearsCount; i++) {
      const year = stats.years[i];
      const reportedTotal = stats.totals[i];

      let catSum = 0;
      for (const cat of stats.categories) {
        catSum += cat.values[i] || 0;
      }

      if (catSum !== reportedTotal) {
        categoryReconciled = false;
        discrepancies.push({ year, dimension: "category_sum", expected: reportedTotal, actual: catSum });
      }

      const pub = stats.sectorData.publicSector[i] || 0;
      const priv = stats.sectorData.privateSector[i] || 0;
      const sectorSum = pub + priv;

      if (sectorSum !== reportedTotal) {
        sectorReconciled = false;
        discrepancies.push({ year, dimension: "sector_sum", expected: reportedTotal, actual: sectorSum });
      }
    }

    return {
      isValid: discrepancies.length === 0,
      categoryReconciled,
      sectorReconciled,
      discrepancies,
      verifiedYearsCount: yearsCount
    };
  }

  await t.test("1. validates that FALLBACK_STATISTICS reconciles with zero mathematical variance", () => {
    const validation = validateIncidentStatistics(FALLBACK_STATISTICS);
    assert.strictEqual(validation.isValid, true);
    assert.strictEqual(validation.categoryReconciled, true);
    assert.strictEqual(validation.sectorReconciled, true);
    assert.strictEqual(validation.discrepancies.length, 0);
    assert.strictEqual(validation.verifiedYearsCount, 8);
  });

  await t.test("2. detects category sum discrepancies accurately when corrupted", () => {
    const corrupted = JSON.parse(JSON.stringify(FALLBACK_STATISTICS));
    corrupted.categories[0].values[7] = 999; // Corrupt 2026 data breach count
    const validation = validateIncidentStatistics(corrupted);
    assert.strictEqual(validation.isValid, false);
    assert.strictEqual(validation.categoryReconciled, false);
    assert.strictEqual(validation.discrepancies.length, 1);
    assert.strictEqual(validation.discrepancies[0].year, 2026);
    assert.strictEqual(validation.discrepancies[0].dimension, "category_sum");
  });

  await t.test("3. detects sector sum discrepancies accurately when corrupted", () => {
    const corrupted = JSON.parse(JSON.stringify(FALLBACK_STATISTICS));
    corrupted.sectorData.publicSector[5] = 50; // Corrupt 2024 public sector (was 106)
    const validation = validateIncidentStatistics(corrupted);
    assert.strictEqual(validation.isValid, false);
    assert.strictEqual(validation.sectorReconciled, false);
    assert.strictEqual(validation.discrepancies.length, 1);
    assert.strictEqual(validation.discrepancies[0].year, 2024);
    assert.strictEqual(validation.discrepancies[0].dimension, "sector_sum");
  });

  await t.test("4. verifies 2026 share calculations", () => {
    const total2026 = 71;
    const phishing2026 = 48;
    const breach2026 = 17;
    const public2026 = 55;
    const private2026 = 16;

    const phishingShare = Math.round((phishing2026 / total2026) * 1000) / 10;
    const breachShare = Math.round((breach2026 / total2026) * 1000) / 10;
    const publicShare = Math.round((public2026 / total2026) * 1000) / 10;
    const privateShare = Math.round((private2026 / total2026) * 1000) / 10;

    assert.strictEqual(phishingShare, 67.6);
    assert.strictEqual(breachShare, 23.9);
    assert.strictEqual(publicShare, 77.5);
    assert.strictEqual(privateShare, 22.5);
    assert.strictEqual(Math.round((publicShare + privateShare) * 10) / 10, 100.0);
  });
});
