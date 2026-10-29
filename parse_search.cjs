const fs = require('fs');
const content = fs.readFileSync('src/pages/AdvisoriesPage.tsx', 'utf-8');
const searchStart = content.indexOf('<form');
const searchEnd = content.indexOf('</form>');
console.log(content.substring(searchStart, searchEnd + 7));
