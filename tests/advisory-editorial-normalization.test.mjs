import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseHTML } from 'linkedom';

// Configure DOMParser and global document for Node test environment
globalThis.DOMParser = class DOMParser {
  parseFromString(str) {
    const { document } = parseHTML(str);
    return document;
  }
};
const { document } = parseHTML('<!DOCTYPE html><html><body></body></html>');
globalThis.document = document;

const {
  parseCanonicalAdvisoryDocument,
  sentenceCaseHeading,
  normalizeHeadingSentenceCase,
  generateDeterministicSlug,
  stripHeadingNumbering,
  stripNumbering,
  normalizeEditorialContent,
  isRedundantWithLead,
} = await import('../src/services/advisoryDocument.ts');

const { normalizeDisplaySummary } = await import('../src/services/advisories.ts');

describe('Advisory Document Ingestion & Canonicalization System (Fixtures A - W)', () => {
  // Test A: Native semantic headings
  it('Fixture A: Native semantic headings (h2/h3) are preserved and structured', () => {
    const html = `
      <h2>Affected systems</h2>
      <p>Windows Server 2022 and Windows 11.</p>
      <h3>Client editions</h3>
      <p>Windows 11 Enterprise.</p>
    `;
    const doc = parseCanonicalAdvisoryDocument(html, 'Microsoft Security Update');
    assert.strictEqual(doc.sections[0].title, 'Overview');
    const affected = doc.sections.find((s) => s.title === 'Affected systems');
    assert.ok(affected, 'Affected systems section must exist');
    const sub = affected.nodes.find((n) => n.type === 'subheading');
    assert.ok(sub, 'Subheading Client editions must exist');
    assert.strictEqual(sub.title, 'Client editions');
  });

  // Test B: Standalone bold labels
  it('Fixture B: Standalone bold labels become proper canonical sections', () => {
    const html = `
      <p><strong>Recommendations:</strong></p>
      <p>Apply security updates immediately to mitigate risk.</p>
    `;
    const doc = parseCanonicalAdvisoryDocument(html, 'Update Advisory');
    const rec = doc.sections.find((s) => s.title === 'Recommendations');
    assert.ok(rec, 'Recommendations section must exist');
    assert.strictEqual(rec.nodes[0].type, 'paragraph');
    assert.ok(rec.nodes[0].text.includes('Apply security updates immediately'));
  });

  // Test C: Bold label + <br> + content
  it('Fixture C: Bold label + <br> + content splits cleanly into heading and paragraph', () => {
    const html = `
      <p><strong>Affected Systems and solutions<br></strong><em>Panorama and Cloud NGFW are not impacted.</em></p>
    `;
    const doc = parseCanonicalAdvisoryDocument(html, 'PAN-OS Advisory');
    const sec = doc.sections.find((s) => s.title === 'Affected systems and solutions');
    assert.ok(sec, 'Affected systems and solutions section must exist');
    assert.ok(sec.nodes.some((n) => n.text.includes('Panorama and Cloud NGFW are not impacted')));
  });

  // Test D: Bold label + separate following paragraph
  it('Fixture D: Bold label + separate following paragraph creates heading and child prose', () => {
    const html = `
      <p><strong>Impact</strong></p>
      <p>Successful exploitation could allow remote code execution.</p>
    `;
    const doc = parseCanonicalAdvisoryDocument(html, 'Impact Advisory');
    const impact = doc.sections.find((s) => s.title === 'Impact');
    assert.ok(impact, 'Impact section must exist');
    assert.strictEqual(impact.nodes[0].text, 'Successful exploitation could allow remote code execution.');
  });

  // Test E: Numbered headings
  it('Fixture E: Numbered headings strip leading numbers while maintaining sentence casing', () => {
    const html = `
      <p><strong>1.0 Overview</strong></p>
      <p>Vulnerability summary prose.</p>
      <p><strong>2.0 Technical Description</strong></p>
      <p>Memory corruption in kernel module.</p>
    `;
    const doc = parseCanonicalAdvisoryDocument(html, 'Numbered Advisory');
    assert.strictEqual(doc.sections[0].title, 'Overview');
    const tech = doc.sections.find((s) => s.title === 'Technical description');
    assert.ok(tech, 'Technical description section must exist without number');
  });

  // Test F: Nested WordPress wrappers
  it('Fixture F: Nested WordPress layout wrappers are unwrapped without losing inner nodes', () => {
    const html = `
      <div class="wp-block-group">
        <div class="wp-block-group__inner-container">
          <p><strong>Detection Method:</strong></p>
          <p>Check log entries for abnormal queries.</p>
        </div>
      </div>
    `;
    const doc = parseCanonicalAdvisoryDocument(html, 'Wrapped Advisory');
    const det = doc.sections.find((s) => s.title === 'Detection method');
    assert.ok(det, 'Detection method section must exist');
    assert.ok(det.nodes[0].text.includes('Check log entries'));
  });

  // Test G: One-column editorial tables
  it('Fixture G: One-column editorial layout tables are structurally unwrapped', () => {
    const html = `
      <table class="has-fixed-layout">
        <tbody>
          <tr>
            <td>
              <strong>Overview:</strong><br>
              A zero-day flaw exists in the target software.<br>
              <strong>Recommendations:</strong><br>
              Upgrade to the patched release.
            </td>
          </tr>
        </tbody>
      </table>
    `;
    const doc = parseCanonicalAdvisoryDocument(html, 'Editorial Table Advisory');
    assert.strictEqual(doc.sections[0].title, 'Overview');
    assert.ok(doc.sections[0].nodes.some((n) => n.text.includes('zero-day flaw exists')));
    const rec = doc.sections.find((s) => s.title === 'Recommendations');
    assert.ok(rec, 'Recommendations section must be unwrapped into its own section');
  });

  // Test H: Real data tables
  it('Fixture H: Real multi-column data tables remain intact as table nodes', () => {
    const html = `
      <h2>Affected products</h2>
      <table>
        <thead>
          <tr><th>Product</th><th>Affected Versions</th><th>Solution</th></tr>
        </thead>
        <tbody>
          <tr><td>PAN-OS 12.1</td><td>12.1.2 through 12.1.6</td><td>Upgrade to 12.1.7</td></tr>
        </tbody>
      </table>
    `;
    const doc = parseCanonicalAdvisoryDocument(html, 'Data Table Advisory');
    const aff = doc.sections.find((s) => s.title === 'Affected products');
    assert.ok(aff, 'Affected products section must exist');
    const tbl = aff.nodes.find((n) => n.type === 'table');
    assert.ok(tbl, 'Multi-column data table must remain a table node');
  });

  // Test I: References with a true heading
  it('Fixture I: References with a true heading are captured as a canonical section and external references', () => {
    const html = `
      <h2>References</h2>
      <p><a href="https://cve.org/CVERecord?id=CVE-2024-38094">CVE-2024-38094 Record</a></p>
    `;
    const doc = parseCanonicalAdvisoryDocument(html, 'Ref Advisory');
    const refSec = doc.sections.find((s) => s.title === 'References');
    assert.ok(refSec, 'References section must exist');
    assert.ok(doc.externalReferences.includes('https://cve.org/CVERecord?id=CVE-2024-38094'));
  });

  // Test J: References where heading formatting is malformed
  it('Fixture J: Malformed bold reference labels with line breaks become References section', () => {
    const html = `
      <p><strong>Reference(s):<br></strong><a href="https://nvd.nist.gov/vuln/detail/CVE-2026-0257">NVD Vulnerability Database</a></p>
    `;
    const doc = parseCanonicalAdvisoryDocument(html, 'Malformed Ref Advisory');
    const refSec = doc.sections.find((s) => s.title === 'References');
    assert.ok(refSec, 'References section must exist');
    assert.ok(doc.externalReferences.includes('https://nvd.nist.gov/vuln/detail/CVE-2026-0257'));
  });

  // Test K: References represented by link-bearing legacy content
  it('Fixture K: Legacy advisory link prose extracts external reference URLs', () => {
    const html = `
      <p>TTCSIRT encourages administrators to visit the following link: <a href="https://msrc.microsoft.com/update-guide/vulnerability/CVE-2024-38094">Microsoft MSRC</a></p>
    `;
    const doc = parseCanonicalAdvisoryDocument(html, 'Link Advisory');
    assert.ok(doc.externalReferences.includes('https://msrc.microsoft.com/update-guide/vulnerability/CVE-2024-38094'));
  });

  // Test L: Contact Information followed by another section
  it('Fixture L: Contact Information block is suppressed while preserving subsequent Additional Information', () => {
    const html = `
      <h2>Contact Information</h2>
      <p>If you have any queries, comments or require assistance, please feel free to contact the TT-CSIRT via contacts@ttcsirt.gov.tt</p>
      <h2>Additional Information</h2>
      <p>Organizations should prioritize patching due to active exploitation in the wild.</p>
    `;
    const doc = parseCanonicalAdvisoryDocument(html, 'Contact Advisory');
    const contactSec = doc.sections.find((s) => s.title.toLowerCase().includes('contact'));
    assert.strictEqual(contactSec, undefined, 'Contact information section must be suppressed');
    const addSec = doc.sections.find((s) => s.title === 'Additional information');
    assert.ok(addSec, 'Additional information section must NOT be deleted');
    assert.ok(addSec.nodes[0].text.includes('Organizations should prioritize patching'));
  });

  // Test M: Please be advised boilerplate
  it('Fixture M: Preamble boilerplate like "Please be advised that" is stripped cleanly', () => {
    const input = 'Please be advised that Microsoft has released security updates.';
    const res = normalizeEditorialContent(input);
    assert.strictEqual(res.isBoilerplateOnly, false);
    assert.strictEqual(res.text, 'Microsoft has released security updates.');
  });

  // Test N: Bold sentence that must NOT become a heading
  it('Fixture N: Bold sentence with active clause is NOT transformed into a heading', () => {
    const html = `
      <p><strong>If “endpoint” is NOT installed, then your system is probably NOT at risk of infection</strong></p>
    `;
    const doc = parseCanonicalAdvisoryDocument(html, 'Bold Sentence Advisory');
    const secTitles = doc.sections.map((s) => s.title);
    assert.ok(!secTitles.includes('If “endpoint” is not installed'), 'Bold sentence must NOT become section heading');
  });

  // Test O: Bold short non-sentence that SHOULD become a heading
  it('Fixture O: Bold short noun phrase label becomes a canonical section heading', () => {
    const html = `
      <p><strong>Exploitation Details:</strong></p>
      <p>Attackers exploit CWE-20 improper input validation.</p>
    `;
    const doc = parseCanonicalAdvisoryDocument(html, 'Exploit Advisory');
    const exp = doc.sections.find((s) => s.title === 'Exploitation details');
    assert.ok(exp, 'Exploitation details must become a section heading');
  });

  // Test P: Duplicate Overview
  it('Fixture P: Multiple Overview labels in source merge into a single canonical Overview', () => {
    const html = `
      <p>Initial security update prose.</p>
      <h2>Overview</h2>
      <p>Additional architectural details.</p>
    `;
    const doc = parseCanonicalAdvisoryDocument(html, 'Duplicate Overview Advisory');
    const overviewSections = doc.sections.filter((s) => s.title === 'Overview');
    assert.strictEqual(overviewSections.length, 1, 'There must be exactly one Overview section');
  });

  // Test Q: Duplicate References
  it('Fixture Q: Multiple References headings merge into a single canonical References section', () => {
    const html = `
      <h2>References</h2>
      <p><a href="https://cve.org/1">CVE 1</a></p>
      <h2>References</h2>
      <p><a href="https://cve.org/2">CVE 2</a></p>
    `;
    const doc = parseCanonicalAdvisoryDocument(html, 'Duplicate Ref Advisory');
    const refSections = doc.sections.filter((s) => s.title === 'References');
    assert.strictEqual(refSections.length, 1, 'There must be exactly one References section');
  });

  // Test R: Share/UI contamination
  it('Fixture R: WordPress sharing buttons and empty metadata wrappers are stripped', () => {
    const html = `
      <p>Valid technical guidance.</p>
      <div class="sharedaddy sd-sharing-enabled"><p>Share this: Twitter Facebook</p></div>
    `;
    const doc = parseCanonicalAdvisoryDocument(html, 'Share Strip Advisory');
    assert.ok(!doc.sections[0].nodes.some((n) => n.text.includes('Share this: Twitter')));
  });

  // Test S: Preview extraction containing raw headings
  it('Fixture S: normalizeDisplaySummary strips leading structural headings like "Overview:" from previews', () => {
    const rawExcerpt = 'Overview: A critical vulnerability designated as CVE-2026-0257 has been identified in PAN-OS.';
    const preview = normalizeDisplaySummary(rawExcerpt, 'Palo Alto Advisory', 'CVE-2026-0257');
    assert.ok(!preview.startsWith('Overview:'), 'Preview must not leak Overview: heading label');
    assert.ok(preview.includes('CVE-2026-0257 has been identified'));
  });

  // Test T: SharePoint 438 Required Acceptance Case
  it('Fixture T: SharePoint 438 has Overview as first section, no duplicate lead, and contact info suppressed', () => {
    const html = `
      <p class="wp-block-paragraph"></p>
      <p class="has-text-align-left wp-block-paragraph">Please be advised of the following critical Microsoft SharePoint vulnerability, CVE-2024-38094, has been listed by our partners at the Cybersecurity &amp; Infrastructure Security Agency (CISA) in their <a href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog" target="_blank" rel="noreferrer noopener">“Known Exploited Vulnerabilities Catalogue”</a>.</p>
      <p class="has-text-align-left wp-block-paragraph">TTCSIRT encourages administrators to visit the following link for more information and take necessary actions immediately: <a href="https://msrc.microsoft.com/update-guide/vulnerability/CVE-2024-38094">CVE-2024-38094 &#8211; Security Update Guide &#8211; Microsoft &#8211; Microsoft SharePoint Remote Code Execution Vulnerability</a></p>
      <p class="has-text-align-left wp-block-paragraph">If you have any queries, comments or require assistance, please feel free to contact the TT-CSIRT via contacts@ttcsirt.gov.tt</p>
      <p class="wp-block-paragraph"></p>
    `;
    const doc = parseCanonicalAdvisoryDocument(html, 'Microsoft SharePoint Vulnerability (CVE-2024-38094)');
    // Overview is the first section
    assert.strictEqual(doc.sections[0].title, 'Overview');
    assert.strictEqual(doc.sections[0].id, 'advisory-overview');
    // Boilerplate "Please be advised of the following" stripped
    assert.ok(doc.sections[0].nodes[0].text.toLowerCase().includes('critical microsoft sharepoint vulnerability'));
    assert.ok(!doc.sections[0].nodes[0].text.includes('Please be advised of the following'));
    // External references detected
    assert.ok(doc.externalReferences.includes('https://msrc.microsoft.com/update-guide/vulnerability/CVE-2024-38094'));
    // Contact block suppressed
    const allText = doc.sections.flatMap((s) => s.nodes.map((n) => n.text)).join(' ');
    assert.ok(!allText.includes('contacts@ttcsirt.gov.tt'));
  });

  // Test U: SharePoint 454 Required Acceptance Case
  it('Fixture U: SharePoint 454 unwraps one-column table, recovers sections, and preserves Additional Information', () => {
    const html = `
      <figure class="wp-block-table alignleft"><table class="has-fixed-layout"><tbody><tr><td class="has-text-align-left" data-align="left">
      <strong>Severity:</strong> Medium (Elevated due to active exploitation)<br>
      <strong>Overview:</strong><br>A zero-day vulnerability in Microsoft SharePoint Server allows attackers to perform spoofing attacks.<br>
      <strong>Affected Systems:</strong><br>Microsoft SharePoint Server<br>SharePoint Server 2016<br>
      <strong>Description:</strong><br>A spoofing vulnerability, tracked as <strong>CVE-2026-32201</strong>, exists in Microsoft SharePoint Server.<br>
      <strong>Recommendations:</strong><br>
      <strong>Immediate Update:</strong><br>Apply Microsoft security updates addressing CVE-2026-32201 immediately.<br>
      <strong>Access Restrictions:</strong><br>Limit external access to SharePoint services.<br>
      <strong>Exploitation Details:</strong><br>The vulnerability is associated with CWE-20 Improper Input Validation.<br>
      <strong>References:</strong><br><a href="https://msrc.microsoft.com/update-guide/">https://msrc.microsoft.com/update-guide/</a><br>
      <strong>Contact Information:</strong><br>If you have any queries, contact contacts@ttcsirt.gov.tt<br>
      <strong>Additional Information:</strong><br>Organizations should prioritize patching due to active exploitation.<br>
      </td></tr></tbody></table></figure>
    `;
    const doc = parseCanonicalAdvisoryDocument(html, 'SharePoint Server Zero-Day Spoofing Vulnerability');
    const titles = doc.sections.map((s) => s.title);
    assert.strictEqual(titles[0], 'Overview');
    assert.ok(titles.includes('Affected systems'));
    assert.ok(titles.includes('Description'));
    assert.ok(titles.includes('Recommendations'));
    assert.ok(titles.includes('Exploitation details'));
    assert.ok(titles.includes('References'));
    assert.ok(titles.includes('Additional information'));
    // Contact Information must NOT be a section
    assert.ok(!titles.includes('Contact information'));
    assert.ok(!titles.includes('Contact Information'));
    // Additional Information must exist
    const addSec = doc.sections.find((s) => s.title === 'Additional information');
    assert.ok(addSec);
    assert.ok(addSec.nodes[0].text.includes('Organizations should prioritize patching'));
  });

  // Test V: FreePBX 450 Required Acceptance Case
  it('Fixture V: FreePBX 450 preserves Detection Method, subheadings, and bold callout sentence', () => {
    const html = `
      <p class="wp-block-paragraph">Please be advised, A critical vulnerability has been discovered in the FreePBX Endpoint module.</p>
      <p class="wp-block-paragraph"><strong>Detection Method:</strong></p>
      <p class="wp-block-paragraph"><strong>1.</strong> <strong>Check for broken FreePBX Administrator web interface:</strong></p>
      <ul class="wp-block-list"><li>Check for /etc/freepbx.conf</li></ul>
      <p class="wp-block-paragraph"><strong>Immediate Actions:</strong></p>
      <ol class="wp-block-list"><li>Assess internet exposure.</li></ol>
      <p class="wp-block-paragraph"><strong>If “endpoint” is NOT installed, then your system is probably NOT at risk of infection</strong></p>
      <p class="wp-block-paragraph"><strong>References</strong></p>
      <p class="wp-block-paragraph"><a href="https://www.cve.org/CVERecord?id=CVE-2025-57819">CVE Record</a></p>
    `;
    const doc = parseCanonicalAdvisoryDocument(html, 'FreePBX Vulnerability');
    const titles = doc.sections.map((s) => s.title);
    assert.strictEqual(titles[0], 'Overview');
    assert.ok(titles.includes('Detection method'));
    assert.ok(titles.includes('Immediate actions'));
    assert.ok(titles.includes('References'));
    // Ensure "If endpoint is NOT installed..." did not become a section
    assert.ok(!titles.some((t) => t.toLowerCase().includes('endpoint')));
  });

  // Test W: Fortinet/FortiManager legacy table content (Post 9976)
  it('Fixture W: FortiManager 436 unwraps editorial table and extracts PSIRT reference', () => {
    const html = `
      <figure class="wp-block-table is-style-regular"><table class="has-fixed-layout"><tbody>
        <tr><td> Fortinet has released a patch to address a critical vulnerability in FortiManager. <br><br><strong>Recommendations:</strong></td></tr>
        <tr><td><img src="https://example.com/advisory.png"></td></tr>
        <tr><td>TTCSIRT encourages administrators to visit the following link for more information: <a href="https://fortiguard.com/psirt/FG-IR-24-423">PSIRT | FortiGuard Labs</a> If you have any queries, please feel free to contact the TT-CSIRT via contacts@ttcsirt.gov.tt</td></tr>
      </tbody></table></figure>
    `;
    const doc = parseCanonicalAdvisoryDocument(html, 'FortiManager Vulnerability');
    assert.strictEqual(doc.sections[0].title, 'Overview');
    assert.ok(doc.sections[0].nodes[0].text.includes('Fortinet has released a patch'));
    const recSec = doc.sections.find((s) => s.title === 'Recommendations');
    assert.ok(recSec, 'Recommendations section must exist');
    assert.ok(doc.externalReferences.includes('https://fortiguard.com/psirt/FG-IR-24-423'));
    // Contact block suppressed
    const allText = doc.sections.flatMap((s) => s.nodes.map((n) => n.text)).join(' ');
    assert.ok(!allText.includes('contacts@ttcsirt.gov.tt'));
  });
});

describe('Advisory Detail Presentation & Route Invariants (Requirements 1 - 11)', () => {
  it('Invariant: Canonical internal routing rules are defined in routes.ts', async () => {
    const fs = await import('node:fs');
    const routesContent = fs.readFileSync('src/routing/routes.ts', 'utf8');

    assert.ok(
      routesContent.includes('/national-cyber-security-strategy'),
      'Must contain /national-cyber-security-strategy canonical route'
    );
    assert.ok(
      routesContent.includes('/report-an-incident'),
      'Must contain /report-an-incident canonical route'
    );
    assert.ok(
      routesContent.includes('/privacy-policy'),
      'Must contain /privacy-policy canonical route'
    );
    assert.ok(
      routesContent.includes('/accessibility-statement'),
      'Must contain /accessibility-statement canonical route'
    );
    assert.ok(
      routesContent.includes('/contact'),
      'Must contain /contact route'
    );
  });
});
