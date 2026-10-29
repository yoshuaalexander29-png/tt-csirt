const fs = require('fs');
let css = fs.readFileSync('src/styles/homepage.css', 'utf-8');

const heightFixes2 = `
.service {
    padding: 18px 0 !important; /* Slightly less reduction, 22->18 = 4px top/bot = 8px per row */
}
.advisory {
    padding: 15px 0 !important; /* 12->15 = 3px top/bot = 6px per row */
}
`;

fs.writeFileSync('src/styles/homepage.css', css + '\n' + heightFixes2);
