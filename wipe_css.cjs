const fs = require('fs');
let code = fs.readFileSync('src/styles/homepage.css', 'utf8');

// The block starts at `/* GOV.UK Header Overrides */` or something.
const startIndex = code.indexOf('.govuk-header {');
const searchIndex = code.indexOf('/* TT-CSIRT Specific: Responsive Table Container */');

console.log(startIndex, searchIndex);
