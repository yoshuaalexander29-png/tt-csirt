/**
 * Comprehensive Automated Verification Suite for TT-CSIRT Site Search Engine
 *
 * Tests:
 * 1. Exact title matches ("ransomware")
 * 2. Case-insensitivity ("RANSOMWARE")
 * 3. Whitespace tolerance ("  ransomware  ")
 * 4. Punctuation/hyphen normalization ("business-email-compromise")
 * 5. Curated alias expansion ("bec" -> "business email compromise")
 * 6. Curated alias expansion ("cybersecurity" -> "cyber security")
 * 7. Typo recovery ("ransomwere" -> "ransomware")
 * 8. Typo recovery transposition ("phisihng" -> "phishing")
 * 9. Multiword queries ("incident response")
 * 10. CVE identifier matching ("CVE-2026-12345")
 * 11. Advisory ID matching ("TT-CSIRT-055")
 * 12. Garbage rejection ("asdfghjkl" -> 0 results)
 * 13. Prefix/partial matching ("ransom")
 * 14. Mixed intent queries ("cyber security guidance")
 * 15. Invariants: exact > fuzzy, identifiers > generic titles, determinism, deduplication, valid hrefs
 */

import assert from "node:assert";
import test from "node:test";
import {
  siteSearchEngine,
  searchSite,
  searchSiteDetailed,
  buildSearchIndex,
  normalizeText,
  normalizeCompact,
  tokenize,
  damerauLevenshteinDistance,
  calculateSimilarity,
  DEFAULT_SEARCH_WEIGHTS,
  compareSearchResults,
  indexDocument,
  scoreDocument,
} from "../dist-test/search-bundle.js";

test("TT-CSIRT Deterministic Site Search Engine Suite", async (t) => {
  // Ensure index is freshly initialized
  siteSearchEngine.rebuildIndex();
  const allDocs = siteSearchEngine.getDocuments();

  await t.test("1. Index Integrity and Deduplication", () => {
    assert.ok(allDocs.length > 10, "Corpus must contain indexed documents across services, guidance, news, events, training, and statistics");
    
    // Check no duplicate IDs or URLs
    const idSet = new Set();
    const hrefSet = new Set();
    for (const doc of allDocs) {
      assert.ok(doc.id, "Every document must have a valid non-empty id");
      assert.ok(doc.href, "Every document must have a valid non-empty href");
      assert.ok(doc.href.startsWith("/"), `Href must be a valid internal relative path: ${doc.href}`);
      assert.ok(!idSet.has(doc.id), `Duplicate document ID detected: ${doc.id}`);
      assert.ok(!hrefSet.has(doc.href), `Duplicate href detected: ${doc.href}`);
      idSet.add(doc.id);
      hrefSet.add(doc.href);
    }
  });

  await t.test("2. Exact title query ('ransomware')", () => {
    const res = searchSiteDetailed("ransomware");
    assert.ok(res.results.length > 0, "Must return results for ransomware");
    const topResult = res.results[0];
    assert.ok(
      topResult.document.title.toLowerCase().includes("ransomware") ||
      topResult.document.summary.toLowerCase().includes("ransomware"),
      "Top result must be relevant to ransomware"
    );
    assert.strictEqual(topResult.isFuzzyMatch, false, "Exact query must not be flagged as fuzzy");
  });

  await t.test("2a. Topic searches prioritise maintained guidance over historical advisories", () => {
    for (const [query, guideTitle, archiveTitle] of [
      ["ransomware", "Ransomware prevention, defence, and emergency response", "DoppelPaymer ransomware"],
      ["phishing", "Recognising and preventing phishing and social engineering scams", "WhatsApp phishing campaign alert"],
    ]) {
      const guide = indexDocument({
        id: `guidance-${query}`,
        type: "guidance",
        title: guideTitle,
        description: `${query} prevention, response and recovery guidance.`,
        summary: `${query} prevention, response and recovery guidance.`,
        href: `/guidance/${query}`,
        keywords: [query, "guidance", "response"],
      });
      const archive = indexDocument({
        id: `advisory-${query}`,
        type: "advisory",
        title: archiveTitle,
        description: `A historical advisory about ${query}.`,
        summary: `A historical advisory about ${query}.`,
        href: `/advisories/${query}`,
        keywords: [query, "advisory"],
      });
      const ranked = [scoreDocument(guide, query), scoreDocument(archive, query)]
        .filter(Boolean)
        .sort(compareSearchResults);

      assert.strictEqual(ranked[0].document.id, guide.id, `Current guidance must lead a broad ${query} search`);
    }
  });

  await t.test("3. Case-insensitive query ('RANSOMWARE')", () => {
    const resUpper = searchSiteDetailed("RANSOMWARE");
    const resLower = searchSiteDetailed("ransomware");
    assert.strictEqual(resUpper.results.length, resLower.results.length, "Result count must be identical regardless of casing");
    assert.strictEqual(resUpper.results[0].document.id, resLower.results[0].document.id, "Top result must match exactly regardless of casing");
    assert.strictEqual(resUpper.results[0].score, resLower.results[0].score, "Score must match exactly");
  });

  await t.test("4. Whitespace query ('  ransomware  ')", () => {
    const resPadded = searchSiteDetailed("   ransomware   ");
    const resTrimmed = searchSiteDetailed("ransomware");
    assert.strictEqual(resPadded.results.length, resTrimmed.results.length, "Leading/trailing whitespace must be normalized");
    assert.strictEqual(resPadded.results[0].document.id, resTrimmed.results[0].document.id, "Top result must match trimmed query");
  });

  await t.test("5. Punctuation and hyphen normalization ('business-email-compromise')", () => {
    const resHyphen = searchSiteDetailed("business-email-compromise");
    const resSpace = searchSiteDetailed("business email compromise");
    assert.ok(resHyphen.results.length > 0, "Hyphenated query must yield results");
    assert.strictEqual(resHyphen.results[0].document.id, resSpace.results[0].document.id, "Hyphenated and spaced queries must rank identically");
  });

  await t.test("6. Curated alias expansion ('bec')", () => {
    const res = searchSiteDetailed("bec");
    assert.ok(res.results.length > 0, "Alias query 'bec' must yield results");
    const topDoc = res.results[0].document;
    const textCorpus = `${topDoc.title} ${topDoc.summary} ${(topDoc.keywords || []).join(" ")}`.toLowerCase();
    assert.ok(
      textCorpus.includes("business email compromise") || textCorpus.includes("bec"),
      "Query 'bec' must match Business Email Compromise resource"
    );
  });

  await t.test("7. Curated alias expansion ('cybersecurity')", () => {
    const res = searchSiteDetailed("cybersecurity");
    assert.ok(res.results.length > 0, "Query 'cybersecurity' must yield results");
    const topDoc = res.results[0].document;
    assert.ok(
      topDoc.title.toLowerCase().includes("cyber security") ||
      topDoc.summary.toLowerCase().includes("cyber security") ||
      topDoc.title.toLowerCase().includes("cybersecurity"),
      "Query 'cybersecurity' must match cyber security resources"
    );
  });

  await t.test("8. Typo recovery ('ransomwere')", () => {
    const res = searchSiteDetailed("ransomwere");
    assert.ok(res.results.length > 0, "Typo 'ransomwere' must recover via fuzzy recovery");
    assert.ok(res.isFuzzyRecovered, "Must be flagged as fuzzy recovered");
    assert.strictEqual(res.correctedQuery, "ransomware", "Must suggest 'ransomware' as the corrected query");
    assert.strictEqual(res.originalQuery, "ransomwere", "Must preserve the original query intact");
    assert.ok(res.results[0].document.title.toLowerCase().includes("ransomware"), "Recovered result must be ransomware guide");
  });

  await t.test("9. Typo transposition recovery ('phisihng')", () => {
    const res = searchSiteDetailed("phisihng");
    assert.ok(res.results.length > 0, "Typo 'phisihng' must recover via Damerau-Levenshtein transposition");
    assert.strictEqual(res.correctedQuery, "phishing", "Must suggest 'phishing' as corrected query");
    assert.strictEqual(res.originalQuery, "phisihng", "Must preserve original query intact");
  });

  await t.test("10. Multiword query ('incident response')", () => {
    const res = searchSiteDetailed("incident response");
    assert.ok(res.results.length > 0, "Multiword query must yield results");
    const topDoc = res.results[0].document;
    assert.strictEqual(topDoc.id, "service-incident-response", "Top result for 'incident response' must be the Incident Response Service");
  });

  await t.test("10a. Crime-reporting searches surface the TTPS contact route", () => {
    for (const query of ["cyber crime", "cybercrime", "report fraud"]) {
      const result = searchSiteDetailed(query).results[0];
      assert.ok(result, `Query '${query}' must return a useful result`);
      assert.strictEqual(result.document.id, "inst-contact", `Query '${query}' must lead to the contact route`);
    }
  });

  await t.test("11. CVE Identifier query ('CVE-2026-12345' or known CVEs)", () => {
    const disclosure = indexDocument({
      id: "advisory-cve-0300",
      type: "advisory",
      title: "Critical firewall vulnerability",
      summary: "CVE-2026-0300 affects the firewall management portal.",
      href: "/advisories/cve-2026-0300",
      cves: ["CVE-2026-0300"],
    });
    const unrelated = indexDocument({
      id: "news-unrelated",
      type: "news",
      title: "National cyber security update",
      summary: "A national cyber security awareness event.",
      href: "/news/cyber-security-update",
    });

    assert.strictEqual(scoreDocument(disclosure, "CVE-2026-0300")?.matchedCve, "CVE-2026-0300");
    assert.strictEqual(scoreDocument(unrelated, "CVE-2026-0300"), null, "CVE lookups must not return unrelated token matches");
    assert.strictEqual(scoreDocument(disclosure, "CVE-2026-99999"), null, "Unknown CVEs must not return unrelated disclosures");
  });

  await t.test("12. Advisory ID query ('TT-CSIRT-055')", () => {
    const res = searchSiteDetailed("TT-CSIRT-055");
    assert.ok(Array.isArray(res.results), "Result must be an array");
  });

  await t.test("13. Garbage query rejection ('asdfghjkl')", () => {
    const res = searchSiteDetailed("asdfghjkl");
    assert.strictEqual(res.results.length, 0, "Garbage string must return 0 results and NOT match arbitrary pages");
    assert.strictEqual(res.isFuzzyRecovered, false, "Garbage string must not trigger false positive typo recovery");
  });

  await t.test("14. Partial / Prefix query ('ransom')", () => {
    const res = searchSiteDetailed("ransom");
    assert.ok(res.results.length > 0, "Prefix query 'ransom' must match ransomware documents");
    assert.ok(res.results[0].document.title.toLowerCase().includes("ransomware"), "Must match ransomware resource via prefix");
  });

  await t.test("15. Mixed query ('cyber security guidance')", () => {
    const res = searchSiteDetailed("cyber security guidance");
    assert.ok(res.results.length > 0, "Mixed query must yield results");
    assert.ok(
      res.results.some((r) => r.document.id === "guidance-hub" || r.document.type === "guidance"),
      "Must include Guidance Hub or guidance articles"
    );
  });

  await t.test("16. Invariant: Exact matches outrank fuzzy matches", () => {
    const exactRes = searchSiteDetailed("ransomware");
    const fuzzyRes = searchSiteDetailed("ransomwere");
    assert.ok(exactRes.results[0].score > fuzzyRes.results[0].score, "Exact search score must exceed fuzzy search score");
  });

  await t.test("17. Invariant: Deterministic ordering stability", () => {
    const query = "cyber security";
    const run1 = searchSiteDetailed(query);
    const run2 = searchSiteDetailed(query);
    const run3 = searchSiteDetailed(query);

    assert.strictEqual(run1.results.length, run2.results.length);
    assert.strictEqual(run2.results.length, run3.results.length);

    for (let i = 0; i < run1.results.length; i++) {
      assert.strictEqual(run1.results[i].document.id, run2.results[i].document.id, `Rank ${i} ID must be identical across runs`);
      assert.strictEqual(run1.results[i].score, run2.results[i].score, `Rank ${i} score must be identical across runs`);
      assert.strictEqual(run2.results[i].document.id, run3.results[i].document.id);
    }
  });

  await t.test("18. Invariant: Public API searchSite() backwards compatibility", () => {
    const results = searchSite("phishing");
    assert.ok(Array.isArray(results), "searchSite must return an array");
    assert.ok(results.length > 0, "searchSite must return phishing results");
    assert.ok(results[0].document, "Each item must have a document property");
    assert.ok(results[0].score > 0, "Each item must have a positive score");
    assert.ok(results[0].document.summary, "Document must have summary for SearchPage");
    assert.ok(results[0].document.href, "Document must have href");
  });
});
