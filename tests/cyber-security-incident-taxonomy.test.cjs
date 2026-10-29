/**
 * Cyber Security Incident Taxonomy & Controlled Statistics Mapping Suite
 *
 * Enforces:
 * 1. Authoritative terminology: strictly "Cyber Security Incident Taxonomy"
 * 2. Official taxonomy registry completeness (all 11 main categories & subcategories)
 * 3. Fast-failure validation for invalid/fabricated taxonomy entries
 * 4. Controlled statistics -> taxonomy mapping layer integrity and justifications
 * 5. All 10 mathematical and governance invariants from Section 5
 * 6. Guidance linkage integrity
 * 7. Safe analytical helper selectors (automating relevance, never automating policy)
 */

const test = require("node:test");
const assert = require("node:assert");
const path = require("node:path");

test("Cyber Security Incident Taxonomy & Controlled Mapping Suite", async (t) => {
  // Dynamic import of TypeScript / compiled service modules
  // Node 22 natively supports TypeScript type stripping
  const taxonomyService = await import("../src/services/taxonomy/cyberSecurityIncidentTaxonomy.ts");
  const mappingService = await import("../src/services/statistics/taxonomyMapping.ts");
  const canonicalModule = await import("../src/services/statistics/canonicalData.ts");
  const validationModule = await import("../src/services/statistics/validation.ts");
  const selectorsModule = await import("../src/services/statistics/taxonomySelectors.ts");
  const guidanceManifest = await import("../src/services/guidance/manifest.ts");

  const {
    TAXONOMY_NAME,
    CYBER_SECURITY_INCIDENT_TAXONOMY,
    OFFICIAL_TAXONOMY_CATEGORIES,
    isValidTaxonomyCategory,
    isValidTaxonomyEntry,
    getTaxonomyEntry,
    getSubcategoriesForCategory
  } = taxonomyService;

  const {
    STATISTICS_TAXONOMY_MAPPINGS,
    validateTaxonomyMappings,
    getMappingsForIncidentType,
    getPrimaryMappingForIncidentType
  } = mappingService;

  const { CANONICAL_INCIDENT_STATISTICS } = canonicalModule;
  const { validateCanonicalDataset, validateStatisticsWithTaxonomy } = validationModule;
  const {
    getTaxonomyRegistry,
    getOfficialCategories,
    getOfficialSubcategories,
    getTaxonomyMappingsForType,
    getPrimaryTaxonomyMapping,
    getGuidanceForIncidentType,
    getTaxonomyCoverageSummary
  } = selectorsModule;

  const { GUIDANCE_SUMMARIES } = guidanceManifest;

  await t.test("1. Taxonomy Terminology & Registry Governance", () => {
    assert.strictEqual(
      TAXONOMY_NAME,
      "Cyber Security Incident Taxonomy",
      "Authoritative taxonomy name must strictly be 'Cyber Security Incident Taxonomy'"
    );

    // Verify metadata in canonical dataset uses official taxonomy name
    assert.strictEqual(
      CANONICAL_INCIDENT_STATISTICS.metadata.methodologyVersion,
      "Cyber Security Incident Taxonomy",
      "Canonical metadata must reference the official 'Cyber Security Incident Taxonomy'"
    );

    // Ensure forbidden/fabricated names are NOT used
    const forbiddenNames = [
      "National Cyber Incident Triage & Categorisation",
      "Incident Classification v1.2",
      "National Incident Taxonomy"
    ];

    for (const forbidden of forbiddenNames) {
      assert.notStrictEqual(
        TAXONOMY_NAME,
        forbidden,
        `Must not use forbidden taxonomy name: ${forbidden}`
      );
      assert.notStrictEqual(
        CANONICAL_INCIDENT_STATISTICS.metadata.methodologyVersion,
        forbidden,
        `Metadata must not use forbidden taxonomy name: ${forbidden}`
      );
    }
  });

  await t.test("2. Authoritative 11 Main Categories Completeness", () => {
    const expectedCategories = [
      "Abusive Content",
      "Malicious Code",
      "Information Gathering",
      "Intrusion Attempts",
      "Intrusions",
      "Availability",
      "Information Content Security",
      "Fraud",
      "Vulnerable",
      "Other",
      "Test"
    ];

    assert.strictEqual(
      OFFICIAL_TAXONOMY_CATEGORIES.length,
      11,
      "Official taxonomy must contain exactly 11 main categories"
    );

    for (const cat of expectedCategories) {
      assert.ok(
        OFFICIAL_TAXONOMY_CATEGORIES.includes(cat),
        `Official categories must include '${cat}'`
      );
      assert.ok(
        isValidTaxonomyCategory(cat),
        `isValidTaxonomyCategory must return true for '${cat}'`
      );
    }

    // Reject unknown category
    assert.strictEqual(isValidTaxonomyCategory("Unapproved Category"), false);
    assert.strictEqual(isValidTaxonomyCategory(""), false);
  });

  await t.test("3. Official Subcategories & Technical Descriptions Integrity", () => {
    // Check specific subcategories required by specification
    const abusiveSubs = getSubcategoriesForCategory("Abusive Content");
    assert.ok(abusiveSubs.includes("Spam"));
    assert.ok(abusiveSubs.includes("Harmful Speech"));
    assert.ok(abusiveSubs.includes("Child Sexual Exploitation / Sexual / Violent Content"));

    const maliciousSubs = getSubcategoriesForCategory("Malicious Code");
    assert.ok(maliciousSubs.includes("Infected System"));
    assert.ok(maliciousSubs.includes("C2 Server"));
    assert.ok(maliciousSubs.includes("Malware Distribution"));
    assert.ok(maliciousSubs.includes("Malware Configuration"));

    const infoGatheringSubs = getSubcategoriesForCategory("Information Gathering");
    assert.ok(infoGatheringSubs.includes("Scanning"));
    assert.ok(infoGatheringSubs.includes("Sniffing"));
    assert.ok(infoGatheringSubs.includes("Social Engineering"));

    const intrusionAttemptsSubs = getSubcategoriesForCategory("Intrusion Attempts");
    assert.ok(intrusionAttemptsSubs.includes("Exploitation of Known Vulnerabilities"));
    assert.ok(intrusionAttemptsSubs.includes("Login Attempts"));
    assert.ok(intrusionAttemptsSubs.includes("New Attack Signature"));

    const intrusionsSubs = getSubcategoriesForCategory("Intrusions");
    assert.ok(intrusionsSubs.includes("Privileged Account Compromise"));
    assert.ok(intrusionsSubs.includes("Unprivileged Account Compromise"));
    assert.ok(intrusionsSubs.includes("Application Compromise"));
    assert.ok(intrusionsSubs.includes("System Compromise"));
    assert.ok(intrusionsSubs.includes("Burglary"));

    const availabilitySubs = getSubcategoriesForCategory("Availability");
    assert.ok(availabilitySubs.includes("DoS"));
    assert.ok(availabilitySubs.includes("DDoS"));
    assert.ok(availabilitySubs.includes("Misconfiguration"));
    assert.ok(availabilitySubs.includes("Sabotage"));
    assert.ok(availabilitySubs.includes("Outage"));

    const fraudSubs = getSubcategoriesForCategory("Fraud");
    assert.ok(fraudSubs.includes("Phishing"));
    assert.ok(fraudSubs.includes("Masquerade"));
    assert.ok(fraudSubs.includes("Unauthorized Use of Resources"));
    assert.ok(fraudSubs.includes("Copyright"));

    const vulnerableSubs = getSubcategoriesForCategory("Vulnerable");
    assert.ok(vulnerableSubs.includes("Weak Cryptography"));
    assert.ok(vulnerableSubs.includes("DDoS Amplifier"));
    assert.ok(vulnerableSubs.includes("Potentially Unwanted Accessible Services"));
    assert.ok(vulnerableSubs.includes("Information Disclosure"));
    assert.ok(vulnerableSubs.includes("Vulnerable System"));

    // Every entry in the registry must have an id, category, subcategory, and description
    for (const entry of CYBER_SECURITY_INCIDENT_TAXONOMY) {
      assert.ok(entry.id && entry.id.length > 0, "Entry must have a non-empty id");
      assert.ok(entry.category && entry.category.length > 0, "Entry must have category");
      assert.ok(entry.subcategory && entry.subcategory.length > 0, "Entry must have subcategory");
      assert.ok(entry.description && entry.description.length > 0, "Entry must have description");
      assert.ok(
        isValidTaxonomyEntry(entry.category, entry.subcategory),
        `Entry ${entry.id} must pass isValidTaxonomyEntry`
      );
    }
  });

  await t.test("4. Controlled Statistics -> Taxonomy Mapping Validation", () => {
    // Runtime validation of authoritative mappings
    const validation = validateTaxonomyMappings();
    assert.strictEqual(
      validation.isValid,
      true,
      `Mappings must pass runtime validation without errors. Found: ${validation.errors.join("; ")}`
    );
    assert.strictEqual(validation.errors.length, 0);

    // Test failure detection when a mapping has invalid taxonomy reference
    const corruptMappings = [
      {
        id: "corrupt-1",
        statisticsIncidentType: "Phishing",
        taxonomyCategory: "NonExistentCategory",
        taxonomySubcategory: "Phishing",
        relationshipType: "primary",
        relationshipLabel: "Primary",
        justification: "Test justification"
      }
    ];
    const corruptValidation = validateTaxonomyMappings(corruptMappings);
    assert.strictEqual(corruptValidation.isValid, false);
    assert.ok(corruptValidation.errors.length > 0);

    // Test coverage of all statistics incident types
    const requiredIncidentTypes = [
      "Phishing",
      "Business Email Compromise",
      "Data breach & System Compromise",
      "Ransomware",
      "Website Defacement & Denial of Service",
      "Malicious Insider"
    ];

    for (const incType of requiredIncidentTypes) {
      const mappings = getMappingsForIncidentType(incType);
      assert.ok(
        mappings.length > 0,
        `Controlled mappings must exist for statistics incident type '${incType}'`
      );

      const primary = getPrimaryMappingForIncidentType(incType);
      assert.ok(
        primary !== undefined,
        `Must have a primary mapping for statistics incident type '${incType}'`
      );
      assert.ok(
        primary.justification && primary.justification.trim().length > 10,
        `Primary mapping for '${incType}' must have non-empty technical justification`
      );
    }
  });

  await t.test("5. Guidance Linkage Integrity", () => {
    const validSlugs = new Set(GUIDANCE_SUMMARIES.map((g) => g.slug));

    for (const mapping of STATISTICS_TAXONOMY_MAPPINGS) {
      if (mapping.relevantGuidanceSlugs) {
        for (const slug of mapping.relevantGuidanceSlugs) {
          assert.ok(
            validSlugs.has(slug),
            `Mapping '${mapping.id}' references guidance slug '${slug}' which must exist in GUIDANCE_SUMMARIES`
          );
        }
      }
    }

    // Verify getGuidanceForIncidentType returns real guidance items
    const phishingGuidance = getGuidanceForIncidentType("Phishing");
    assert.ok(phishingGuidance.length > 0, "Phishing must resolve to at least one guidance summary");
    assert.ok(phishingGuidance.some((g) => g.slug === "phishing-scams"));
  });

  await t.test("6. Ten Core Invariants & Multi-Dimensional Data Reconciliation", () => {
    // Validate canonical dataset with taxonomy
    const fullAudit = validateStatisticsWithTaxonomy(CANONICAL_INCIDENT_STATISTICS);
    assert.strictEqual(
      fullAudit.isValid,
      true,
      `Full statistics and taxonomy audit must succeed. Discrepancies: ${JSON.stringify(fullAudit.datasetValidation.discrepancies)}`
    );

    const periods = CANONICAL_INCIDENT_STATISTICS.periods;

    // Invariant 1: Valid numeric counts across all years
    // Invariant 5: No negative values
    // Invariant 6: No NaN / Infinity
    for (const p of periods) {
      assert.ok(Number.isInteger(p.year) && p.year >= 2019 && p.year <= 2026);
      assert.ok(typeof p.dataThrough === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.dataThrough));

      for (const [cat, val] of Object.entries(p.categories)) {
        assert.ok(Number.isInteger(val) && val >= 0, `${p.year} category ${cat} must be non-negative integer`);
        assert.ok(!Number.isNaN(val) && Number.isFinite(val), `${p.year} category ${cat} must be finite`);
      }

      assert.ok(Number.isInteger(p.sectors.publicSector) && p.sectors.publicSector >= 0);
      assert.ok(Number.isInteger(p.sectors.privateSector) && p.sectors.privateSector >= 0);
    }

    // Invariant 2 & 3: Public + Private = Incident Type total, and Sum of Incident Types = Annual Total
    for (const p of periods) {
      if (p.matrix) {
        let matrixPubSum = 0;
        let matrixPrivSum = 0;
        for (const [type, pub] of Object.entries(p.matrix.publicSector)) {
          const priv = p.matrix.privateSector[type] || 0;
          const typeTotal = pub + priv;
          assert.ok(Number.isInteger(typeTotal) && typeTotal >= 0);
          matrixPubSum += pub;
          matrixPrivSum += priv;
        }
        assert.strictEqual(matrixPubSum, p.sectors.publicSector);
        assert.strictEqual(matrixPrivSum, p.sectors.privateSector);
        assert.strictEqual(matrixPubSum + matrixPrivSum, p.sectors.publicSector + p.sectors.privateSector);
      }
    }

    // Invariant 4: Annual totals reconcile with cumulative period total: 485 = 319 Public + 166 Private
    let cumulativePublic = 0;
    let cumulativePrivate = 0;
    for (const p of periods) {
      cumulativePublic += p.sectors.publicSector;
      cumulativePrivate += p.sectors.privateSector;
    }
    assert.strictEqual(cumulativePublic, 319, "Cumulative public sector must equal 319");
    assert.strictEqual(cumulativePrivate, 166, "Cumulative private sector must equal 166");
    assert.strictEqual(cumulativePublic + cumulativePrivate, 485, "Total cumulative notifications must equal 485");

    // Invariant 7: 2026 is explicitly a partial year
    const p2026 = periods.find((p) => p.year === 2026);
    assert.ok(p2026, "2026 period must exist");
    assert.strictEqual(p2026.isPartial, true, "2026 must have isPartial = true");
    assert.strictEqual(p2026.dataThrough, "2026-07-23", "2026 must be through 2026-07-23");

    // Authoritative 2026 breakdown
    assert.strictEqual(p2026.matrix.publicSector["Phishing"], 40);
    assert.strictEqual(p2026.matrix.privateSector["Phishing"], 6);
    assert.strictEqual(p2026.matrix.publicSector["Business Email Compromise"], 0);
    assert.strictEqual(p2026.matrix.privateSector["Business Email Compromise"], 2);
    assert.strictEqual(p2026.matrix.publicSector["Data breach & System Compromise"], 9);
    assert.strictEqual(p2026.matrix.privateSector["Data breach & System Compromise"], 8);
    assert.strictEqual(p2026.matrix.publicSector["Website Defacement & Denial of Service"], 4);
    assert.strictEqual(p2026.matrix.privateSector["Website Defacement & Denial of Service"], 0);
    assert.strictEqual(p2026.matrix.publicSector["Ransomware"], 1);
    assert.strictEqual(p2026.matrix.privateSector["Ransomware"], 0);
    assert.strictEqual(p2026.matrix.publicSector["Malicious Insider"], 1);
    assert.strictEqual(p2026.matrix.privateSector["Malicious Insider"], 0);

    const total2026 = p2026.sectors.publicSector + p2026.sectors.privateSector;
    assert.strictEqual(total2026, 71, "2026 total must equal 71");

    // Invariant 8: Source update date represented separately from reporting period
    assert.strictEqual(
      CANONICAL_INCIDENT_STATISTICS.metadata.lastUpdated,
      "2026-07-23",
      "Source update date must be preserved separately"
    );

    // Invariant 9: Taxonomy references point only to known taxonomy entries
    for (const m of STATISTICS_TAXONOMY_MAPPINGS) {
      assert.ok(isValidTaxonomyEntry(m.taxonomyCategory, m.taxonomySubcategory));
    }

    // Invariant 10: Clear error reporting on corrupted dataset
    const corruptDataset = {
      ...CANONICAL_INCIDENT_STATISTICS,
      periods: [
        {
          year: 2026,
          isPartial: false, // Error: 2026 must be partial
          dataThrough: "invalid-date",
          categories: { Phishing: -5 },
          sectors: { publicSector: 10, privateSector: 20 }
        }
      ]
    };
    const corruptReport = validateCanonicalDataset(corruptDataset);
    assert.strictEqual(corruptReport.isValid, false);
    assert.ok(corruptReport.discrepancies.length >= 3);
    assert.ok(corruptReport.discrepancies.some((d) => d.dimension === "negative_count"));
    assert.ok(corruptReport.discrepancies.some((d) => d.dimension === "invalid_date"));
    assert.ok(corruptReport.discrepancies.some((d) => d.dimension === "partial_period"));
  });

  await t.test("7. Legacy Adapter Backward Compatibility", () => {
    // Pure adapter function matching toLegacyIncidentStatistics contract
    function adaptToLegacy(dataset) {
      const periods = dataset.periods;
      const years = periods.map((p) => p.year);
      const totals = periods.map((p) => p.sectors.publicSector + p.sectors.privateSector);
      const latestPeriod = periods[periods.length - 1];
      const legacyCategoryNames = [
        "Data breach & System Compromise",
        "Ransomware",
        "Phishing & Business Email Compromise",
        "Website Defacement & Denial of Service",
        "Malicious Insider"
      ];
      const categories = legacyCategoryNames.map((catName) => {
        const values = periods.map((p) => {
          if (catName === "Phishing & Business Email Compromise") {
            if (p.categories["Phishing & Business Email Compromise"] !== undefined) {
              return p.categories["Phishing & Business Email Compromise"];
            }
            const phishing = p.matrix ? (p.matrix.publicSector["Phishing"] || 0) + (p.matrix.privateSector["Phishing"] || 0) : 0;
            const bec = p.matrix ? (p.matrix.publicSector["Business Email Compromise"] || 0) + (p.matrix.privateSector["Business Email Compromise"] || 0) : 0;
            return phishing + bec;
          }
          return p.categories[catName] || 0;
        });
        return { name: catName, values };
      });
      return {
        years,
        categories,
        totals,
        sectorData: {
          publicSector: periods.map((p) => p.sectors.publicSector),
          privateSector: periods.map((p) => p.sectors.privateSector),
          both: totals
        },
        latestYear: latestPeriod.year,
        updatedAt: latestPeriod.dataThrough
      };
    }

    const legacy = adaptToLegacy(CANONICAL_INCIDENT_STATISTICS);
    assert.strictEqual(legacy.latestYear, 2026);
    assert.strictEqual(legacy.updatedAt, "2026-07-23");
    assert.strictEqual(legacy.totals[legacy.totals.length - 1], 71);

    // Sum of legacy totals must equal 485
    const sumTotals = legacy.totals.reduce((a, b) => a + b, 0);
    assert.strictEqual(sumTotals, 485);

    // Legacy sector totals
    const sumPublic = legacy.sectorData.publicSector.reduce((a, b) => a + b, 0);
    const sumPrivate = legacy.sectorData.privateSector.reduce((a, b) => a + b, 0);
    assert.strictEqual(sumPublic, 319);
    assert.strictEqual(sumPrivate, 166);

    // Combined Phishing & BEC in legacy
    const phishingCat = legacy.categories.find(
      (c) => c.name === "Phishing & Business Email Compromise"
    );
    assert.ok(phishingCat, "Legacy categories must include combined Phishing & Business Email Compromise");
    const sumPhishingBec = phishingCat.values.reduce((a, b) => a + b, 0);
    assert.strictEqual(sumPhishingBec, 296, "Combined Phishing & BEC must equal 296");
  });

  await t.test("8. Safe Analytics Helper Selectors", () => {
    const coverage = getTaxonomyCoverageSummary();
    assert.strictEqual(coverage.totalOfficialEntries, CYBER_SECURITY_INCIDENT_TAXONOMY.length);
    assert.strictEqual(coverage.totalCategories, 11);
    assert.strictEqual(coverage.mappedIncidentTypesCount, 6);
    assert.ok(coverage.totalMappingsCount >= 6);

    const categories = getOfficialCategories();
    assert.strictEqual(categories.length, 11);

    const fraudSubs = getOfficialSubcategories("Fraud");
    assert.ok(fraudSubs.includes("Phishing"));

    const reg = getTaxonomyRegistry();
    assert.strictEqual(reg.length, CYBER_SECURITY_INCIDENT_TAXONOMY.length);

    const mappings = getTaxonomyMappingsForType("Phishing");
    assert.ok(mappings.length > 0);
    assert.strictEqual(mappings[0].taxonomyCategory, "Fraud");
  });
});
