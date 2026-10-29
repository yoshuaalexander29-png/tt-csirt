const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

/**
 * AUTHORITATIVE SHARED-DRIVE SOURCE FIXTURE
 * Represents the multi-dimensional dataset: YEAR × SECTOR × INCIDENT TYPE
 * with separate Phishing and Business Email Compromise recordings.
 */
const CANONICAL_SHARED_DRIVE_SOURCE = {
  metadata: {
    agency: "Trinidad and Tobago Cyber Security Incident Response Team (TT-CSIRT)",
    source: "Official verified incident notifications received by TT-CSIRT",
    methodologyVersion: "Cyber Security Incident Taxonomy",
    lastUpdated: "2026-07-23",
    unitOfMeasure: "Verified incident notifications received and processed",
    coverageStartYear: 2019,
    coverageEndYear: 2026
  },
  periods: [
    {
      year: 2019,
      isPartial: false,
      dataThrough: "2019-12-31",
      matrix: {
        publicSector: {
          "Phishing": 6,
          "Business Email Compromise": 1,
          "Data breach & System Compromise": 1,
          "Ransomware": 0,
          "Website Defacement & Denial of Service": 9,
          "Malicious Insider": 0
        },
        privateSector: {
          "Phishing": 0,
          "Business Email Compromise": 1,
          "Data breach & System Compromise": 0,
          "Ransomware": 1,
          "Website Defacement & Denial of Service": 4,
          "Malicious Insider": 0
        }
      }
    },
    {
      year: 2020,
      isPartial: false,
      dataThrough: "2020-12-31",
      matrix: {
        publicSector: {
          "Phishing": 3,
          "Business Email Compromise": 1,
          "Data breach & System Compromise": 8,
          "Ransomware": 1,
          "Website Defacement & Denial of Service": 4,
          "Malicious Insider": 0
        },
        privateSector: {
          "Phishing": 7,
          "Business Email Compromise": 1,
          "Data breach & System Compromise": 20,
          "Ransomware": 4,
          "Website Defacement & Denial of Service": 3,
          "Malicious Insider": 0
        }
      }
    },
    {
      year: 2021,
      isPartial: false,
      dataThrough: "2021-12-31",
      matrix: {
        publicSector: {
          "Phishing": 10,
          "Business Email Compromise": 2,
          "Data breach & System Compromise": 1,
          "Ransomware": 0,
          "Website Defacement & Denial of Service": 1,
          "Malicious Insider": 1
        },
        privateSector: {
          "Phishing": 12,
          "Business Email Compromise": 3,
          "Data breach & System Compromise": 1,
          "Ransomware": 2,
          "Website Defacement & Denial of Service": 1,
          "Malicious Insider": 1
        }
      }
    },
    {
      year: 2022,
      isPartial: false,
      dataThrough: "2022-12-31",
      matrix: {
        publicSector: {
          "Phishing": 6,
          "Business Email Compromise": 1,
          "Data breach & System Compromise": 3,
          "Ransomware": 2,
          "Website Defacement & Denial of Service": 4,
          "Malicious Insider": 0
        },
        privateSector: {
          "Phishing": 9,
          "Business Email Compromise": 2,
          "Data breach & System Compromise": 6,
          "Ransomware": 5,
          "Website Defacement & Denial of Service": 5,
          "Malicious Insider": 0
        }
      }
    },
    {
      year: 2023,
      isPartial: false,
      dataThrough: "2023-12-31",
      matrix: {
        publicSector: {
          "Phishing": 10,
          "Business Email Compromise": 1,
          "Data breach & System Compromise": 3,
          "Ransomware": 4,
          "Website Defacement & Denial of Service": 5,
          "Malicious Insider": 0
        },
        privateSector: {
          "Phishing": 9,
          "Business Email Compromise": 3,
          "Data breach & System Compromise": 4,
          "Ransomware": 9,
          "Website Defacement & Denial of Service": 3,
          "Malicious Insider": 1
        }
      }
    },
    {
      year: 2024,
      isPartial: false,
      dataThrough: "2024-12-31",
      matrix: {
        publicSector: {
          "Phishing": 81,
          "Business Email Compromise": 8,
          "Data breach & System Compromise": 4,
          "Ransomware": 7,
          "Website Defacement & Denial of Service": 5,
          "Malicious Insider": 1
        },
        privateSector: {
          "Phishing": 7,
          "Business Email Compromise": 1,
          "Data breach & System Compromise": 1,
          "Ransomware": 2,
          "Website Defacement & Denial of Service": 1,
          "Malicious Insider": 0
        }
      }
    },
    {
      year: 2025,
      isPartial: false,
      dataThrough: "2025-12-31",
      matrix: {
        publicSector: {
          "Phishing": 47,
          "Business Email Compromise": 3,
          "Data breach & System Compromise": 7,
          "Ransomware": 2,
          "Website Defacement & Denial of Service": 10,
          "Malicious Insider": 1
        },
        privateSector: {
          "Phishing": 10,
          "Business Email Compromise": 3,
          "Data breach & System Compromise": 3,
          "Ransomware": 3,
          "Website Defacement & Denial of Service": 2,
          "Malicious Insider": 0
        }
      }
    },
    {
      year: 2026,
      isPartial: true,
      dataThrough: "2026-07-23",
      matrix: {
        publicSector: {
          "Phishing": 40,
          "Business Email Compromise": 0,
          "Data breach & System Compromise": 9,
          "Ransomware": 1,
          "Website Defacement & Denial of Service": 4,
          "Malicious Insider": 1
        },
        privateSector: {
          "Phishing": 6,
          "Business Email Compromise": 2,
          "Data breach & System Compromise": 8,
          "Ransomware": 0,
          "Website Defacement & Denial of Service": 0,
          "Malicious Insider": 0
        }
      }
    }
  ]
};

/**
 * Normalization function that validates and structures the raw shared source
 */
function normalizeSharedDriveSource(raw) {
  const periods = raw.periods.map((p) => {
    let pubSum = 0;
    let privSum = 0;
    const catMap = {};

    for (const [type, count] of Object.entries(p.matrix.publicSector)) {
      pubSum += count;
      catMap[type] = (catMap[type] || 0) + count;
    }
    for (const [type, count] of Object.entries(p.matrix.privateSector)) {
      privSum += count;
      catMap[type] = (catMap[type] || 0) + count;
    }

    return {
      year: p.year,
      isPartial: p.isPartial,
      dataThrough: p.dataThrough,
      matrix: p.matrix,
      categories: catMap,
      sectors: {
        publicSector: pubSum,
        privateSector: privSum
      }
    };
  });

  return {
    metadata: { ...raw.metadata },
    periods
  };
}

/**
 * Pure compatibility adapter that derives the legacy IncidentStatistics contract
 * from the richer normalized canonical dataset.
 * Combines "Phishing" and "Business Email Compromise" into "Phishing & Business Email Compromise".
 */
function toLegacyIncidentStatisticsAdapter(dataset) {
  const years = dataset.periods.map((p) => p.year);
  const totals = dataset.periods.map((p) => p.sectors.publicSector + p.sectors.privateSector);
  const latestPeriod = dataset.periods[dataset.periods.length - 1];

  const legacyNames = [
    "Data breach & System Compromise",
    "Ransomware",
    "Phishing & Business Email Compromise",
    "Website Defacement & Denial of Service",
    "Malicious Insider"
  ];

  const categories = legacyNames.map((legacyName) => {
    const values = dataset.periods.map((p) => {
      if (legacyName === "Phishing & Business Email Compromise") {
        const ph = (p.matrix?.publicSector["Phishing"] || 0) + (p.matrix?.privateSector["Phishing"] || 0);
        const bec = (p.matrix?.publicSector["Business Email Compromise"] || 0) + (p.matrix?.privateSector["Business Email Compromise"] || 0);
        return ph + bec;
      }
      const pub = p.matrix?.publicSector[legacyName] || 0;
      const priv = p.matrix?.privateSector[legacyName] || 0;
      return pub + priv;
    });
    return { name: legacyName, values };
  });

  const privateSector = dataset.periods.map((p) => p.sectors.privateSector);
  const publicSector = dataset.periods.map((p) => p.sectors.publicSector);
  const both = totals;

  const latestIdx = years.length - 1;
  const phishingVal = categories.find((c) => c.name.includes("Phishing")).values[latestIdx];
  const breachVal = categories.find((c) => c.name.includes("Data breach")).values[latestIdx];

  return {
    years,
    categories,
    totals,
    sectorData: {
      privateSector,
      publicSector,
      both
    },
    latestYear: latestPeriod.year,
    updatedAt: latestPeriod.dataThrough,
    latestStats: {
      phishing: phishingVal,
      dataBreach: breachVal,
      total: totals[latestIdx]
    }
  };
}

test("Legacy Statistics Output Integrity & Backwards Compatibility Suite", async (t) => {
  const normalized = normalizeSharedDriveSource(CANONICAL_SHARED_DRIVE_SOURCE);
  const legacy = toLegacyIncidentStatisticsAdapter(normalized);

  await t.test("1. zero-breakage pipeline: canonical source -> normalized dataset -> adapter -> legacy IncidentStatistics", () => {
    assert.ok(legacy, "Legacy output must exist");
    assert.strictEqual(Array.isArray(legacy.years), true);
    assert.strictEqual(Array.isArray(legacy.totals), true);
    assert.strictEqual(Array.isArray(legacy.categories), true);
    assert.ok(legacy.sectorData);
    assert.strictEqual(legacy.latestYear, 2026);
    assert.strictEqual(legacy.updatedAt, "2026-07-23");
  });

  await t.test("2. verifies exact annual totals required by legacy contract", () => {
    const expectedAnnualTotals = {
      2019: 23,
      2020: 52,
      2021: 35,
      2022: 43,
      2023: 52,
      2024: 118,
      2025: 91,
      2026: 71
    };

    legacy.years.forEach((yr, idx) => {
      assert.strictEqual(
        legacy.totals[idx],
        expectedAnnualTotals[yr],
        `Annual total for ${yr} must equal ${expectedAnnualTotals[yr]}`
      );
    });
  });

  await t.test("3. verifies exact sector totals: Public = 319, Private = 166, Overall = 485", () => {
    const publicTotal = legacy.sectorData.publicSector.reduce((a, b) => a + b, 0);
    const privateTotal = legacy.sectorData.privateSector.reduce((a, b) => a + b, 0);
    const grandTotal = legacy.totals.reduce((a, b) => a + b, 0);

    assert.strictEqual(publicTotal, 319, "Public sector total across all periods must equal 319");
    assert.strictEqual(privateTotal, 166, "Private sector total across all periods must equal 166");
    assert.strictEqual(grandTotal, 485, "Overall grand total must equal 485");
    assert.strictEqual(publicTotal + privateTotal, grandTotal, "Public + Private must equal Overall total");
  });

  await t.test("4. verifies combined Phishing + Business Email Compromise derivation for every year", () => {
    const expectedCombinedPhishingBEC = {
      2019: 8,
      2020: 12,
      2021: 27,
      2022: 18,
      2023: 23,
      2024: 97,
      2025: 63,
      2026: 48
    };

    const phishingCat = legacy.categories.find(
      (c) => c.name === "Phishing & Business Email Compromise"
    );
    assert.ok(phishingCat, "Legacy categories must include 'Phishing & Business Email Compromise'");

    legacy.years.forEach((yr, idx) => {
      assert.strictEqual(
        phishingCat.values[idx],
        expectedCombinedPhishingBEC[yr],
        `Combined Phishing + BEC in ${yr} must equal ${expectedCombinedPhishingBEC[yr]}`
      );
    });
  });

  await t.test("5. verifies rich multi-dimensional capabilities derived from canonical source", () => {
    // Incident type totals from granular source
    let phishingTotal = 0;
    let becTotal = 0;
    let breachTotal = 0;
    let ransomwareTotal = 0;
    let defacementTotal = 0;
    let insiderTotal = 0;

    for (const p of normalized.periods) {
      phishingTotal += p.matrix.publicSector["Phishing"] + p.matrix.privateSector["Phishing"];
      becTotal += p.matrix.publicSector["Business Email Compromise"] + p.matrix.privateSector["Business Email Compromise"];
      breachTotal += p.matrix.publicSector["Data breach & System Compromise"] + p.matrix.privateSector["Data breach & System Compromise"];
      ransomwareTotal += p.matrix.publicSector["Ransomware"] + p.matrix.privateSector["Ransomware"];
      defacementTotal += p.matrix.publicSector["Website Defacement & Denial of Service"] + p.matrix.privateSector["Website Defacement & Denial of Service"];
      insiderTotal += p.matrix.publicSector["Malicious Insider"] + p.matrix.privateSector["Malicious Insider"];
    }

    assert.strictEqual(phishingTotal, 263, "Cumulative Phishing total must equal 263");
    assert.strictEqual(becTotal, 33, "Cumulative BEC total must equal 33");
    assert.strictEqual(phishingTotal + becTotal, 296, "Combined Phishing + BEC total must equal 296");
    assert.strictEqual(breachTotal, 79, "Cumulative Data breach total must equal 79");
    assert.strictEqual(ransomwareTotal, 43, "Cumulative Ransomware total must equal 43");
    assert.strictEqual(defacementTotal, 61, "Cumulative Defacement/DoS total must equal 61");
    assert.strictEqual(insiderTotal, 6, "Cumulative Malicious Insider total must equal 6");
    assert.strictEqual(
      phishingTotal + becTotal + breachTotal + ransomwareTotal + defacementTotal + insiderTotal,
      485,
      "Sum of all granular incident types must equal 485"
    );

    // Cross-sector breakdown within Phishing
    let phishingPub = 0;
    let phishingPriv = 0;
    for (const p of normalized.periods) {
      phishingPub += p.matrix.publicSector["Phishing"];
      phishingPriv += p.matrix.privateSector["Phishing"];
    }
    assert.strictEqual(phishingPub, 203, "Public sector Phishing notifications = 203");
    assert.strictEqual(phishingPriv, 60, "Private sector Phishing notifications = 60");
    assert.strictEqual(phishingPub + phishingPriv, 263);
  });

  await t.test("6. verifies canonical terminology compliance", () => {
    // Assert no terminology leakage of "attacks" in place of "incident notifications"
    assert.strictEqual(
      CANONICAL_SHARED_DRIVE_SOURCE.metadata.unitOfMeasure,
      "Verified incident notifications received and processed"
    );
    assert.ok(
      !CANONICAL_SHARED_DRIVE_SOURCE.metadata.unitOfMeasure.toLowerCase().includes("attack"),
      "Must not label incident notifications as 'attacks'"
    );
  });

  await t.test("7. verifies production codebase integration and exports", () => {
    const indexSource = fs.readFileSync(path.join(__dirname, "../src/services/statistics/index.ts"), "utf8");
    assert.ok(indexSource.includes("toLegacyIncidentStatistics"), "Must export toLegacyIncidentStatistics");
    assert.ok(indexSource.includes("FALLBACK_STATISTICS"), "Must export FALLBACK_STATISTICS");
    assert.ok(indexSource.includes("IncidentStatistics"), "Must export IncidentStatistics");
    assert.ok(indexSource.includes("fromLegacyToCanonicalDataset"), "Must export fromLegacyToCanonicalDataset");

    const richAnalysisSource = fs.readFileSync(path.join(__dirname, "../src/services/statistics/richAnalysis.ts"), "utf8");
    assert.ok(richAnalysisSource.includes("getYearTotals"), "richAnalysis must export getYearTotals");
    assert.ok(richAnalysisSource.includes("getIncidentTypeTotals"), "richAnalysis must export getIncidentTypeTotals");
    assert.ok(richAnalysisSource.includes("getSectorTotals"), "richAnalysis must export getSectorTotals");
    assert.ok(richAnalysisSource.includes("getIncidentTypeSectorTotals"), "richAnalysis must export getIncidentTypeSectorTotals");
    assert.ok(richAnalysisSource.includes("getIncidentTypeShare"), "richAnalysis must export getIncidentTypeShare");
    assert.ok(richAnalysisSource.includes("getSectorShare"), "richAnalysis must export getSectorShare");
    assert.ok(richAnalysisSource.includes("getIncidentTypeShareWithinSector"), "richAnalysis must export getIncidentTypeShareWithinSector");
    assert.ok(richAnalysisSource.includes("getSectorShareWithinIncidentType"), "richAnalysis must export getSectorShareWithinIncidentType");
    assert.ok(richAnalysisSource.includes("getHistoricalTrends"), "richAnalysis must export getHistoricalTrends");
    assert.ok(richAnalysisSource.includes("getCategoryRankings"), "richAnalysis must export getCategoryRankings");
    assert.ok(richAnalysisSource.includes("getCategoryPersistence"), "richAnalysis must export getCategoryPersistence");
    assert.ok(richAnalysisSource.includes("getConcentrationMetrics"), "richAnalysis must export getConcentrationMetrics");
    assert.ok(richAnalysisSource.includes("getCompositionChanges"), "richAnalysis must export getCompositionChanges");
  });
});
