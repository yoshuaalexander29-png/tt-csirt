const fs = require('fs');
const content = fs.readFileSync('src/pages/AdvisoriesPage.tsx', 'utf-8');
const searchStart = content.indexOf('<h2');
console.log(content.substring(searchStart, searchStart + 500));
