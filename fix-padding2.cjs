const fs = require('fs');
let css = fs.readFileSync('src/styles/homepage.css', 'utf-8');

const fixes = `
.content-card {
    padding: 0 16px !important;
}
.content-card:first-child {
    padding-left: 0 !important;
}
.content-card:last-child {
    padding-right: 0 !important;
}
`;

fs.writeFileSync('src/styles/homepage.css', css + '\n' + fixes);
