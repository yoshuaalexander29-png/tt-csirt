const fs = require('fs');
let css = fs.readFileSync('src/styles/homepage.css', 'utf-8');

const heightFixes = `
/* ========================================================
   HEIGHT BALANCING
   ======================================================== */

/* Compress Our Services */
.service {
    padding: 16px 0 !important; /* Reduced from 22px */
}
.service b {
    margin-bottom: 2px !important; /* Reduced from 8px */
}

/* Expand Latest Advisories slightly */
.advisory {
    padding: 14px 0 !important; /* Increased from 12px */
}

/* Subscription panel */
.advisory-callout {
    margin-top: 32px !important; /* Increased to naturally push it down a bit */
}
`;

fs.writeFileSync('src/styles/homepage.css', css + '\n' + heightFixes);
