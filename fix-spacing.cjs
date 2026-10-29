const fs = require('fs');
let css = fs.readFileSync('src/styles/homepage.css', 'utf-8');

const spacingFixes = `
/* ========================================================
   EDITORIAL LAYOUT SPACING REFINEMENTS
   ======================================================== */

/* Column Gutters & Our Services padding */
.content-card:first-child {
    padding-left: 0 !important;
    padding-right: 24px !important;
}
.content-card:nth-child(2) {
    padding-left: 24px !important;
    padding-right: 24px !important;
}
.content-card:last-child {
    padding-left: 24px !important;
    padding-right: 0 !important;
}

/* Subtle vertical dividers */
.content-card:not(:last-child) {
    border-right: 1px solid rgba(11,12,12,0.04) !important;
}

@media (max-width: 980px) {
    .content-card:first-child,
    .content-card:nth-child(2),
    .content-card:last-child {
        padding-left: 0 !important;
        padding-right: 0 !important;
    }
    .content-card:not(:last-child) {
        border-right: none !important;
        border-bottom: 1px solid rgba(11,12,12,0.04) !important;
    }
}

/* Service Rows spacing */
.service {
    padding: 22px 0 !important; /* Increased from 16px for space to divider line */
}
.service b {
    margin-bottom: 8px !important; /* Increased from 4px for space to description */
}

/* Latest Advisories spacing */
.advisory {
    gap: 18px !important; /* Increased from 12px to space out badge, title, and date */
}
.advisory time {
    text-align: right !important; /* Ensure date aligns nicely */
}

/* About TT-CSIRT paragraph spacing */
.about-links {
    margin-top: 32px !important; /* Increased from 24px */
}
`;

fs.writeFileSync('src/styles/homepage.css', css + '\n' + spacingFixes);
