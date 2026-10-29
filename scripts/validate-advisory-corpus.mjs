/**
 * Corpus Validation Harness for Advisory Document Normalization
 *
 * Processes a representative sample of live/source TT-CSIRT advisory data.
 * For each advisory reports:
 * - Title
 * - Sections detected
 * - H2 count
 * - H3 count
 * - References detected
 * - Overview detected
 * - Contact block suppressed
 * - Boilerplate removed
 * - Preview clean
 * - Potential anomaly
 */

import { parseHTML } from 'linkedom';

// Configure DOMParser and document for Node environment
globalThis.DOMParser = class DOMParser {
  parseFromString(str) {
    return parseHTML(str).document;
  }
};
const { document } = parseHTML('<!DOCTYPE html><html><body></body></html>');
globalThis.document = document;

const { parseCanonicalAdvisoryDocument } = await import('../src/services/advisoryDocument.ts');
const { normalizeDisplaySummary } = await import('../src/services/advisories.ts');

const SAMPLE_IDS = [10035, 10932, 10680, 9976, 10647, 10982, 10974, 3587];

async function fetchAdvisories() {
  const listUrl = 'https://ttcsirt.gov.tt/wp-json/wp/v2/posts?per_page=10&categories=16,19';
  let posts = [];

  try {
    const res = await fetch(listUrl, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      posts = await res.json();
    }
  } catch (err) {
    console.warn('Live API list fetch timed out or offline, using targeted sample IDs:', err.message);
  }

  // Also fetch any missing specific sample IDs
  for (const id of SAMPLE_IDS) {
    if (!posts.some((p) => p.id === id)) {
      try {
        const res = await fetch(`https://ttcsirt.gov.tt/wp-json/wp/v2/posts/${id}`, {
          signal: AbortSignal.timeout(4000),
        });
        if (res.ok) {
          const post = await res.json();
          posts.push(post);
        }
      } catch {
        // Fallback gracefully
      }
    }
  }

  return posts;
}

async function run() {
  console.log('===============================================================');
  console.log('TT-CSIRT ADVISORY CORPUS VALIDATION HARNESS');
  console.log('===============================================================\n');

  const posts = await fetchAdvisories();
  console.log(`Fetched ${posts.length} advisories for validation.\n`);

  let passed = 0;
  let anomaliesCount = 0;

  for (const post of posts) {
    const rawHtml = post.content?.rendered || '';
    const rawTitle = post.title?.rendered || `Advisory ${post.id}`;
    const rawExcerpt = post.excerpt?.rendered || '';

    const doc = parseCanonicalAdvisoryDocument(rawHtml, rawTitle, rawExcerpt);

    const h2Count = doc.sections.length;
    let h3Count = 0;
    for (const s of doc.sections) {
      for (const n of s.nodes) {
        if (n.type === 'subheading') h3Count++;
      }
    }

    const hasOverview = doc.sections.length > 0 && doc.sections[0].title.toLowerCase() === 'overview';
    const referencesSec = doc.sections.find((s) => s.title.toLowerCase().includes('reference'));
    const referencesCount = doc.externalReferences.length + (referencesSec ? 1 : 0);

    // Verify contact suppression
    const allNodeText = doc.sections.flatMap((s) => s.nodes.map((n) => n.text || '')).join(' ');
    const contactSuppressed = !allNodeText.includes('contacts@ttcsirt.gov.tt');

    // Verify boilerplate removal
    const boilerplateRemoved = !doc.sections[0]?.nodes[0]?.text?.includes('Please be advised that');

    // Verify preview clean
    const preview = normalizeDisplaySummary(rawExcerpt, rawTitle);
    const previewClean = !/^(?:overview|description|references?)\s*:/i.test(preview);

    const anomalies = [];
    if (!hasOverview) anomalies.push('Missing Overview as Section 1');
    if (!contactSuppressed) anomalies.push('Contact info leaked');
    if (!boilerplateRemoved) anomalies.push('Boilerplate not stripped from lead');
    if (!previewClean) anomalies.push('Preview starts with raw heading label');
    if (h2Count === 0) anomalies.push('No H2 sections parsed');

    if (anomalies.length > 0) anomaliesCount++;
    else passed++;

    console.log(`---------------------------------------------------------------`);
    console.log(`ID: ${post.id} | ${rawTitle.replace(/<[^>]*>/g, '').slice(0, 60)}...`);
    console.log(`  Sections (${h2Count}): ${doc.sections.map((s) => s.title).join(' | ')}`);
    console.log(`  H2 count: ${h2Count} | H3 count: ${h3Count}`);
    console.log(`  References detected: ${referencesCount} (External: ${doc.externalReferences.length})`);
    console.log(`  Overview detected: ${hasOverview ? '✓ YES' : '✗ NO'}`);
    console.log(`  Contact block suppressed: ${contactSuppressed ? '✓ YES' : '✗ NO'}`);
    console.log(`  Boilerplate removed: ${boilerplateRemoved ? '✓ YES' : '✗ NO'}`);
    console.log(`  Preview clean: ${previewClean ? '✓ YES' : '✗ NO'}`);
    console.log(`  Potential anomalies: ${anomalies.length === 0 ? 'None (Clean)' : anomalies.join(', ')}`);
  }

  console.log('\n===============================================================');
  console.log(`CORPUS VALIDATION SUMMARY: ${passed} clean, ${anomaliesCount} anomalies out of ${posts.length} advisories`);
  console.log('===============================================================\n');
}

run().catch((err) => {
  console.error('Validation harness failed:', err);
  process.exit(1);
});
