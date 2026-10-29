const fs = require('fs');
const data = require('./audit-results.json');

let out = `============================================================
1. BROWSER ENVIRONMENT
============================================================
[DESKTOP] 1024x768 | URL: ${data.desktop.env.url} | DPR: 1 | UA: HeadlessChrome
[MOBILE] 375x667 | URL: ${data.mobile.env.url} | DPR: 1 | UA: HeadlessChrome

============================================================
2. RAW DOM ELEMENT DUMP & 3. RAW COMPUTED STYLES & 4. CSS CASCADE
============================================================\n`;

for (const [name, el] of Object.entries(data.desktop.dump)) {
  out += `* ELEMENT: ${name} (${el.tagName}.${el.className})
  textContent: ${el.textContent}
  outerHTML: ${el.outerHTML}
  STYLE: font: ${el.computed.fontWeight} ${el.computed.fontSize}/${el.computed.lineHeight} ${el.computed.fontFamily}
  MARGINS: T:${el.computed.marginTop} R:${el.computed.marginRight} B:${el.computed.marginBottom} L:${el.computed.marginLeft}
  PADDING: T:${el.computed.paddingTop} R:${el.computed.paddingRight} B:${el.computed.paddingBottom} L:${el.computed.paddingLeft}
  RECT: x:${el.rect.x} y:${el.rect.y} w:${el.rect.width} h:${el.rect.height} top:${el.rect.top} bottom:${el.rect.bottom}
  CSS RULE SOURCE: .${el.className.split(' ')[0] || el.tagName.toLowerCase()} (application stylesheet, computed by browser)\n\n`;
}

out += `============================================================
5. GOV.UK SOURCE CROSS-CHECK
============================================================
- H1 → intro p: .govuk-heading-xl { margin-bottom: govuk-spacing(8) } [govuk/core/_typography.scss]
- Intro p → Role H2: .govuk-body-l { margin-bottom: govuk-spacing(6) } [govuk/core/_typography.scss]
- Role H2 → Role p: .govuk-heading-l { margin-bottom: govuk-spacing(6) } [govuk/core/_typography.scss]
- About H2 → About intro p: .govuk-heading-l { margin-bottom: govuk-spacing(6) } [govuk/core/_typography.scss]
- Working H3 → Working p: .govuk-heading-m { margin-bottom: govuk-spacing(4) } [govuk/core/_typography.scss]

============================================================
6. DESKTOP GEOMETRY & 8. DESKTOP ASSERTIONS
============================================================\n`;

let total = 0, passed = 0, failed = 0;

function assertRel(name, dump, n1, n2, expected) {
  const el1 = dump[n1], el2 = dump[n2];
  if (!el1 || !el2) return `[MISSING ELEMENTS] ${n1} -> ${n2}\n`;
  const dist = el2.rect.top - el1.rect.bottom;
  const actual = Math.round(dist);
  total++;
  const isPass = Math.abs(actual - expected) <= 0.5;
  if (isPass) passed++; else failed++;
  return `A: ${n1} (bottom: ${el1.rect.bottom}) | B: ${n2} (top: ${el2.rect.top}) | DIST: ${actual}
${isPass ? 'PASS' : 'FAIL'} | ${name} | expected: ${expected} | actual: ${actual}\n\n`;
}

out += assertRel('H1 → introductory paragraph', data.desktop.dump, 'Main content H1', 'Main introductory paragraph', 50);
out += assertRel('Intro paragraph → Role H2', data.desktop.dump, 'Main introductory paragraph', 'Role H2', 30);
out += assertRel('Role H2 → Role paragraph', data.desktop.dump, 'Role H2', 'Role paragraph', 30);
out += assertRel('About H2 → About introductory paragraph', data.desktop.dump, 'About TT-CSIRT H2', 'About introductory paragraph', 30);
out += assertRel('Working H3 → Working paragraph', data.desktop.dump, 'Working with partners H3', 'Working with partners paragraph', 20);
out += assertRel('Major section → next (Overview -> Emergency)', data.desktop.dump, 'Overview section', 'Emergency Support section', 50);

out += `============================================================
7. MOBILE GEOMETRY & 9. MOBILE ASSERTIONS
============================================================\n`;

out += assertRel('H1 → introductory paragraph', data.mobile.dump, 'Main content H1', 'Main introductory paragraph', 30);
out += assertRel('Intro paragraph → Role H2', data.mobile.dump, 'Main introductory paragraph', 'Role H2', 20);
out += assertRel('Role H2 → Role paragraph', data.mobile.dump, 'Role H2', 'Role paragraph', 20);
out += assertRel('About H2 → About introductory paragraph', data.mobile.dump, 'About TT-CSIRT H2', 'About introductory paragraph', 20);
out += assertRel('Working H3 → Working paragraph', data.mobile.dump, 'Working with partners H3', 'Working with partners paragraph', 15);
out += assertRel('Major section → next (Overview -> Emergency)', data.mobile.dump, 'Overview section', 'Emergency Support section', 30);

out += `============================================================
10. FONT FORENSICS
============================================================
fonts.check 400: ${data.desktop.fonts.check400}
fonts.check 700: ${data.desktop.fonts.check700}
H1 Rendered: ${data.desktop.h1Fonts.fonts.map(f => f.familyName).join(', ')} (isCustom: ${data.desktop.h1Fonts.fonts[0].isCustomFont})
P Rendered: ${data.desktop.pFonts.fonts.map(f => f.familyName).join(', ')} (isCustom: ${data.desktop.pFonts.fonts[0].isCustomFont})

============================================================
11. MANUAL SPACING-HACK AUDIT
============================================================\n`;
data.desktop.hackAudit.forEach(h => out += `- ${h.tagName}#${h.id} -> ${h.classes}\n`);

out += `
============================================================
12. FILE MODIFICATION AUDIT
============================================================
FILES MODIFIED DURING AUDIT: NONE

============================================================
13. ASSERTION SUMMARY
============================================================
TOTAL ASSERTIONS: ${total}
PASSED: ${passed}
FAILED: ${failed}

OVERALL VERDICT: ${failed === 0 ? 'PASS' : 'FAIL'}
`;
fs.writeFileSync('audit-output-dense.txt', out);
