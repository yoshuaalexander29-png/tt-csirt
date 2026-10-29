const fs = require('fs');

const files = [
  'src/pages/AdvisoriesPage.tsx',
  'src/pages/AdvisoryDetailPage.tsx',
  'src/components/PrintPage.tsx',
  'src/components/AdvisoryContentRenderer.tsx',
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Regex to match className="..."
  content = content.replace(/className=(["'])(.*?)\1/g, (match, quote, classList) => {
    const hasTypographyClass = /\b(govuk-heading-[a-z]+|govuk-body|govuk-body-[a-z]+|govuk-list|govuk-warning-text|govuk-inset-text|govuk-error-summary|govuk-button|govuk-tag|govuk-breadcrumbs)\b/.test(classList);
    
    if (hasTypographyClass || file.includes('AdvisoryContentRenderer.tsx')) {
      const newClassList = classList
        .replace(/\bgovuk-!-margin-(top|bottom|left|right)-\d+\b/g, '')
        .replace(/\bgovuk-!-padding-(top|bottom|left|right)-\d+\b/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
      return "className=" + quote + newClassList + quote;
    }
    return match;
  });

  // For AdvisoryContentRenderer.tsx where classes are assigned to strings
  if (file.includes('AdvisoryContentRenderer.tsx')) {
    content = content.replace(/className = (["'])(.*?)\1/g, (match, quote, classList) => {
      const newClassList = classList
        .replace(/\bgovuk-!-margin-(top|bottom|left|right)-\d+\b/g, '')
        .replace(/\bgovuk-!-padding-(top|bottom|left|right)-\d+\b/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
      return "className = " + quote + newClassList + quote;
    });
  }

  fs.writeFileSync(file, content);
}
