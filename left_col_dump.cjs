const fs = require('fs');
const content = fs.readFileSync('src/pages/AdvisoriesPage.tsx', 'utf-8');
const startIdx = content.indexOf('{/* Left Column: Supporting information */}');
const endIdx = content.indexOf('{/* Right Column: Primary content */}');
console.log(content.substring(startIdx, endIdx));
