const fs = require('fs');
let css = fs.readFileSync('src/styles/homepage.css', 'utf-8');

const fixes = `
/* Remove gap between hero and needs section */
.hero { margin-bottom: 0 !important; }
.needs-section { margin-top: 0 !important; }
`;

fs.writeFileSync('src/styles/homepage.css', css + '\n' + fixes);
