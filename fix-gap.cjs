const fs = require('fs');
let css = fs.readFileSync('src/styles/homepage.css', 'utf-8');

const gapFixes = `
/* ========================================================
   REMOVE GAP BETWEEN HERO AND NEEDS SECTION
   ======================================================== */

.hero {
    margin-bottom: 0 !important;
    padding-bottom: 0 !important;
}

.needs-section {
    margin-top: 0 !important;
    /* Ensure the padding starts immediately */
    padding-top: 48px !important; 
}

/* Ensure the full-width background pseudo-element has no top offset */
.needs-section::before {
    top: 0 !important;
}

/* Remove margin from the last element of hero if any */
.hero-left, .hero-right {
    margin-bottom: 0 !important;
}
`;

fs.writeFileSync('src/styles/homepage.css', css + '\n' + gapFixes);
