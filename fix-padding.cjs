const fs = require('fs');
let css = fs.readFileSync('src/styles/homepage.css', 'utf-8');

const fixes = `
/* Reset internal paddings that might break baseline alignment */
.advisories-header {
    padding: 0 !important;
}
.advisory-list {
    padding: 0 !important;
}
`;

fs.writeFileSync('src/styles/homepage.css', css + '\n' + fixes);
