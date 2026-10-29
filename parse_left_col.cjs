const fs = require('fs');
const content = fs.readFileSync('src/pages/AdvisoriesPage.tsx', 'utf-8');
const searchStart = content.indexOf('{/* Left Column: Supporting information */}');
const searchEnd = content.indexOf('{/* Right Column: Primary content */}');
console.log(content.substring(searchStart, searchEnd));
