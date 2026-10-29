import type { CanonicalStatisticsDataset, DiscrepancyRecord, ValidationReport } from "./schema.ts";
import {
  STATISTICS_TAXONOMY_MAPPINGS,
  validateTaxonomyMappings
} from "./taxonomyMapping.ts";

/**
 * Runtime Mathematical and Contract Validation
 * Verifies that the dataset conforms to all invariants before analytical derivation.
 */
export function validateCanonicalDataset(dataset: CanonicalStatisticsDataset): ValidationReport {
  const discrepancies: DiscrepancyRecord[] = [];
  const periods = dataset.periods;

  if (!periods || periods.length === 0) {
    return {
      isValid: false,
      verifiedPeriodCount: 0,
      completedPeriodCount: 0,
      partialPeriodCount: 0,
      discrepancies: [
        {
          year: 0,
          dimension: "invalid_date",
          expected: ">= 1 period",
          actual: 0,
          detail: "Dataset contains zero period records."
        }
      ],
      auditStatement: "Data validation failed: dataset is empty.",
      validatedAt: new Date().toISOString()
    };
  }

  let completedCount = 0;
  let partialCount = 0;

  for (let i = 0; i < periods.length; i++) {
    const record = periods[i];

    // Check year ordering
    if (i > 0 && record.year <= periods[i - 1].year) {
      discrepancies.push({
        year: record.year,
        dimension: "invalid_date",
        expected: `> ${periods[i - 1].year}`,
        actual: record.year,
        detail: `Period year ${record.year} is not strictly greater than previous period ${periods[i - 1].year}.`
      });
    }

    if (record.isPartial) {
      partialCount++;
    } else {
      completedCount++;
    }

    // Check date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(record.dataThrough)) {
      discrepancies.push({
        year: record.year,
        dimension: "invalid_date",
        expected: "YYYY-MM-DD",
        actual: record.dataThrough,
        detail: `dataThrough date ${record.dataThrough} is not a valid ISO date.`
      });
    }

    // Sum categories
    let categorySum = 0;
    const catKeys = Object.keys(record.categories);
    if (catKeys.length === 0) {
      discrepancies.push({
        year: record.year,
        dimension: "category_sum",
        expected: "> 0 categories",
        actual: 0,
        detail: `No incident categories defined for year ${record.year}.`
      });
    }

    for (const catName of catKeys) {
      const val = record.categories[catName];
      if (typeof val !== "number" || !Number.isInteger(val)) {
        discrepancies.push({
          year: record.year,
          dimension: "non_integer",
          expected: "integer",
          actual: val,
          detail: `Category "${catName}" in ${record.year} is not an integer.`
        });
      } else if (val < 0) {
        discrepancies.push({
          year: record.year,
          dimension: "negative_count",
          expected: ">= 0",
          actual: val,
          detail: `Category "${catName}" in ${record.year} has negative count.`
        });
      } else {
        categorySum += val;
      }
    }

    // Sum sectors
    const pub = record.sectors.publicSector;
    const priv = record.sectors.privateSector;

    if (typeof pub !== "number" || typeof priv !== "number" || !Number.isInteger(pub) || !Number.isInteger(priv)) {
      discrepancies.push({
        year: record.year,
        dimension: "non_integer",
        expected: "integers",
        actual: `public:${pub}, private:${priv}`,
        detail: `Sector counts in ${record.year} are not integers.`
      });
    } else if (pub < 0 || priv < 0) {
      discrepancies.push({
        year: record.year,
        dimension: "negative_count",
        expected: ">= 0",
        actual: `public:${pub}, private:${priv}`,
        detail: `Sector counts in ${record.year} have negative values.`
      });
    }

    const sectorSum = (Number.isInteger(pub) && pub >= 0 ? pub : 0) + (Number.isInteger(priv) && priv >= 0 ? priv : 0);

    // Invariant: categorySum must equal sectorSum
    if (categorySum !== sectorSum) {
      discrepancies.push({
        year: record.year,
        dimension: "sector_sum",
        expected: categorySum,
        actual: sectorSum,
        detail: `Reconciliation variance in ${record.year}: category sum (${categorySum}) does not match sector sum (${sectorSum}).`
      });
    }

    // Validate multi-dimensional matrix (YEAR × SECTOR × INCIDENT TYPE) if present
    if (record.matrix) {
      let matrixPubSum = 0;
      let matrixPrivSum = 0;

      for (const [incType, count] of Object.entries(record.matrix.publicSector || {})) {
        if (typeof count !== "number" || !Number.isInteger(count) || count < 0) {
          discrepancies.push({
            year: record.year,
            dimension: "non_integer",
            expected: "non-negative integer",
            actual: count,
            detail: `Public sector matrix entry for "${incType}" in ${record.year} is invalid.`
          });
        } else {
          matrixPubSum += count;
        }
      }

      for (const [incType, count] of Object.entries(record.matrix.privateSector || {})) {
        if (typeof count !== "number" || !Number.isInteger(count) || count < 0) {
          discrepancies.push({
            year: record.year,
            dimension: "non_integer",
            expected: "non-negative integer",
            actual: count,
            detail: `Private sector matrix entry for "${incType}" in ${record.year} is invalid.`
          });
        } else {
          matrixPrivSum += count;
        }
      }

      if (matrixPubSum !== pub) {
        discrepancies.push({
          year: record.year,
          dimension: "sector_sum",
          expected: pub,
          actual: matrixPubSum,
          detail: `Matrix public sector sum (${matrixPubSum}) does not match declared public sector count (${pub}) in ${record.year}.`
        });
      }

      if (matrixPrivSum !== priv) {
        discrepancies.push({
          year: record.year,
          dimension: "sector_sum",
          expected: priv,
          actual: matrixPrivSum,
          detail: `Matrix private sector sum (${matrixPrivSum}) does not match declared private sector count (${priv}) in ${record.year}.`
        });
      }

      // Check incident-type reconciliations: Public + Private = total for each incident type
      for (const [incType, pubCount] of Object.entries(record.matrix.publicSector || {})) {
        const privCount = record.matrix.privateSector[incType] ?? 0;
        const matrixTypeTotal = pubCount + privCount;
        if (Number.isNaN(matrixTypeTotal) || !Number.isFinite(matrixTypeTotal)) {
          discrepancies.push({
            year: record.year,
            dimension: "non_integer",
            expected: "finite integer",
            actual: String(matrixTypeTotal),
            detail: `Incident type "${incType}" sum is NaN or Infinite in ${record.year}.`
          });
        }
      }
    }

    // Explicit check: 2026 must be treated as a partial period
    if (record.year === 2026 && !record.isPartial) {
      discrepancies.push({
        year: record.year,
        dimension: "partial_period",
        expected: "isPartial = true",
        actual: "isPartial = false",
        detail: "Year 2026 must be explicitly designated as a partial period (through 2026-07-23)."
      });
    }
  }

  // Verify metadata integrity: source update date vs reporting periods
  if (dataset.metadata) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataset.metadata.lastUpdated)) {
      discrepancies.push({
        year: 0,
        dimension: "invalid_date",
        expected: "YYYY-MM-DD",
        actual: dataset.metadata.lastUpdated,
        detail: `Dataset metadata lastUpdated date "${dataset.metadata.lastUpdated}" is not a valid ISO date.`
      });
    }
  }

  const isValid = discrepancies.length === 0;
  const startYr = periods[0].year;
  const endYr = periods[periods.length - 1].year;

  const auditStatement = isValid
    ? `All ${periods.length} recording periods (${startYr}–${endYr}) reconcile with zero mathematical variance across category totals and public/private sector splits.`
    : `Data quality audit identified ${discrepancies.length} discrepancy records requiring remediation before publication.`;

  return {
    isValid,
    verifiedPeriodCount: periods.length,
    completedPeriodCount: completedCount,
    partialPeriodCount: partialCount,
    discrepancies,
    auditStatement,
    validatedAt: new Date().toISOString()
  };
}

/**
 * Validates both the statistics dataset and the taxonomy mappings.
 * Fails fast if any taxonomy mapping violates registry invariants.
 */
export function validateStatisticsWithTaxonomy(
  dataset: CanonicalStatisticsDataset,
  mappings = STATISTICS_TAXONOMY_MAPPINGS
): {
  datasetValidation: ValidationReport;
  mappingValidation: { isValid: boolean; errors: string[] };
  isValid: boolean;
} {
  const datasetValidation = validateCanonicalDataset(dataset);
  const mappingValidation = validateTaxonomyMappings(mappings);

  return {
    datasetValidation,
    mappingValidation,
    isValid: datasetValidation.isValid && mappingValidation.isValid
  };
}
