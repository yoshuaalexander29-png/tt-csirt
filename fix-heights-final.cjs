const fs = require('fs');
let css = fs.readFileSync('src/styles/homepage.css', 'utf-8');

const finalFixes = `
.service {
    padding: 18px 0 !important;
}
.service b {
    margin-bottom: 4px !important;
}
.advisory {
    padding: 15px 0 !important;
}
.advisory-callout {
    margin-top: 28px !important; /* Not too detached */
}
`;

fs.writeFileSync('src/styles/homepage.css', css + '\n' + finalFixes);
