const fs = require('fs');
const content = fs.readFileSync('src/pages/AdvisoriesPage.tsx', 'utf-8');
const searchStart = content.indexOf('<div className="finder-results js-finder-results">');
const searchEnd = content.indexOf('</ul>\n                </div>\n              )}');
console.log(content.substring(searchStart, searchEnd + 10));
