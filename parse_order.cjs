const fs = require('fs');
const content = fs.readFileSync('src/pages/AdvisoriesPage.tsx', 'utf-8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('<div className="govuk-grid-row app-page-grid-row">'));
console.log(lines.slice(start, start + 30).join('\n'));
