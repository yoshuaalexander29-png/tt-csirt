const test = require("node:test");
const assert = require("node:assert");

// Load canonical data directly
const CANONICAL_INCIDENT_STATISTICS = {
  metadata: {
    agency: "Trinidad and Tobago Cyber Security Incident Response Team (TT-CSIRT)",
    source: "Official verified incident notifications received by TT-CSIRT",
    methodologyVersion: "1.2",
    lastUpdated: "2026-07-23",
    unitOfMeasure: "Verified incident notifications",
    coverageStartYear: 2019,
    coverageEndYear: 2026
  },
  periods: [
    {
      year: 2019,
      isPartial: false,
      dataThrough: "2019-12-31",
      categories: {
        "Data breach & System Compromise": 1,
        "Ransomware": 1,
        "Phishing & Business Email Compromise": 8,
        "Website Defacement & Denial of Service": 13,
        "Malicious Insider": 0
      },
      sectors: { publicSector: 17, privateSector: 6 }
    },
    {
      year: 2020,
      isPartial: false,
      dataThrough: "2020-12-31",
      categories: {
        "Data breach & System Compromise": 28,
        "Ransomware": 5,
        "Phishing & Business Email Compromise": 12,
        "Website Defacement & Denial of Service": 7,
        "Malicious Insider": 0
      },
      sectors: { publicSector: 17, privateSector: 35 }
    },
    {
      year: 2021,
      isPartial: false,
      dataThrough: "2021-12-31",
      categories: {
        "Data breach & System Compromise": 2,
        "Ransomware": 2,
        "Phishing & Business Email Compromise": 27,
        "Website Defacement & Denial of Service": 2,
        "Malicious Insider": 2
      },
      sectors: { publicSector: 15, privateSector: 20 }
    },
    {
      year: 2022,
      isPartial: false,
      dataThrough: "2022-12-31",
      categories: {
        "Data breach & System Compromise": 9,
        "Ransomware": 7,
        "Phishing & Business Email Compromise": 18,
        "Website Defacement & Denial of Service": 9,
        "Malicious Insider": 0
      },
      sectors: { publicSector: 16, privateSector: 27 }
    },
    {
      year: 2023,
      isPartial: false,
      dataThrough: "2023-12-31",
      categories: {
        "Data breach & System Compromise": 7,
        "Ransomware": 13,
        "Phishing & Business Email Compromise": 23,
        "Website Defacement & Denial of Service": 8,
        "Malicious Insider": 1
      },
      sectors: { publicSector: 23, privateSector: 29 }
    },
    {
      year: 2024,
      isPartial: false,
      dataThrough: "2024-12-31",
      categories: {
        "Data breach & System Compromise": 5,
        "Ransomware": 9,
        "Phishing & Business Email Compromise": 97,
        "Website Defacement & Denial of Service": 6,
        "Malicious Insider": 1
      },
      sectors: { publicSector: 106, privateSector: 12 }
    },
    {
      year: 2025,
      isPartial: false,
      dataThrough: "2025-12-31",
      categories: {
        "Data breach & System Compromise": 10,
        "Ransomware": 5,
        "Phishing & Business Email Compromise": 63,
        "Website Defacement & Denial of Service": 12,
        "Malicious Insider": 1
      },
      sectors: { publicSector: 70, privateSector: 21 }
    },
    {
      year: 2026,
      isPartial: true,
      dataThrough: "2026-07-23",
      categories: {
        "Data breach & System Compromise": 17,
        "Ransomware": 1,
        "Phishing & Business Email Compromise": 48,
        "Website Defacement & Denial of Service": 4,
        "Malicious Insider": 1
      },
      sectors: { publicSector: 55, privateSector: 16 }
    }
  ]
};

function validateDataset(dataset) {
  const discrepancies = [];
  const periods = dataset.periods || [];

  for (const period of periods) {
    let catSum = 0;
    for (const val of Object.values(period.categories)) {
      catSum += val;
    }
    const sectorSum = period.sectors.publicSector + period.sectors.privateSector;

    if (catSum !== sectorSum) {
      discrepancies.push({
        year: period.year,
        dimension: "category_sector_mismatch",
        expected: sectorSum,
        actual: catSum,
        difference: catSum - sectorSum
      });
    }
  }

  return {
    isValid: discrepancies.length === 0,
    discrepancies,
    verifiedPeriodsCount: periods.length
  };
}

test("Canonical Statistics Upgrade Validation Suite", async (t) => {
  await t.test("1. zero-variance reconciliation across all 8 periods in canonical dataset", () => {
    const val = validateDataset(CANONICAL_INCIDENT_STATISTICS);
    assert.strictEqual(val.isValid, true);
    assert.strictEqual(val.discrepancies.length, 0);
    assert.strictEqual(val.verifiedPeriodsCount, 8);
  });

  await t.test("2. verifies completed 12-month period benchmarks exclude partial 2026", () => {
    const completedPeriods = CANONICAL_INCIDENT_STATISTICS.periods.filter((p) => !p.isPartial);
    assert.strictEqual(completedPeriods.length, 7);

    const totals = completedPeriods.map((p) => {
      return Object.values(p.categories).reduce((a, b) => a + b, 0);
    });

    // Totals for 2019..2025: 23, 52, 35, 43, 52, 118, 91
    assert.deepStrictEqual(totals, [23, 52, 35, 43, 52, 118, 91]);

    const sorted = [...totals].sort((a, b) => a - b); // [23, 35, 43, 52, 52, 91, 118]
    const median = sorted[Math.floor(sorted.length / 2)];
    assert.strictEqual(median, 52);

    const sum = totals.reduce((a, b) => a + b, 0); // 414
    assert.strictEqual(sum, 414);
    const mean = Math.round((sum / totals.length) * 10) / 10;
    assert.strictEqual(mean, 59.1);

    const peak = Math.max(...totals);
    const low = Math.min(...totals);
    assert.strictEqual(peak, 118);
    assert.strictEqual(low, 23);
    assert.strictEqual(peak - low, 95);
  });

  await t.test("3. validates latest period (2026) concentration and vector share", () => {
    const p2026 = CANONICAL_INCIDENT_STATISTICS.periods.find((p) => p.year === 2026);
    assert.ok(p2026);
    assert.strictEqual(p2026.isPartial, true);

    const total = Object.values(p2026.categories).reduce((a, b) => a + b, 0);
    assert.strictEqual(total, 71);

    const phishing = p2026.categories["Phishing & Business Email Compromise"];
    const breach = p2026.categories["Data breach & System Compromise"];
    const phishingShare = Math.round((phishing / total) * 1000) / 10;
    const breachShare = Math.round((breach / total) * 1000) / 10;

    assert.strictEqual(phishingShare, 67.6);
    assert.strictEqual(breachShare, 23.9);

    const top2Share = Math.round(((phishing + breach) / total) * 1000) / 10;
    assert.strictEqual(top2Share, 91.5);
  });

  await t.test("4. validates cumulative sector distribution (2019-2026)", () => {
    let cumulativePub = 0;
    let cumulativePriv = 0;

    for (const p of CANONICAL_INCIDENT_STATISTICS.periods) {
      cumulativePub += p.sectors.publicSector;
      cumulativePriv += p.sectors.privateSector;
    }

    assert.strictEqual(cumulativePub, 319);
    assert.strictEqual(cumulativePriv, 166);
    const grandTotal = cumulativePub + cumulativePriv;
    assert.strictEqual(grandTotal, 485);

    const pubShare = Math.round((cumulativePub / grandTotal) * 1000) / 10;
    const privShare = Math.round((cumulativePriv / grandTotal) * 1000) / 10;

    assert.strictEqual(pubShare, 65.8);
    assert.strictEqual(privShare, 34.2);
    assert.strictEqual(Math.round((pubShare + privShare) * 10) / 10, 100.0);
  });
});
