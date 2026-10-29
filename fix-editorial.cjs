const fs = require('fs');
let css = fs.readFileSync('src/styles/homepage.css', 'utf-8');

const fixes = `
/* ========================================================
   EDITORIAL LAYOUT FINAL FIXES
   ======================================================== */

.content-cards {
    background: #fff !important;
    border: none !important;
    box-shadow: none !important;
    padding: 32px !important;
    gap: 0 !important;
    align-items: stretch !important;
}

.content-card {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 24px !important;
}
.content-card:first-child {
    padding-left: 0 !important;
}
.content-card:last-child {
    padding-right: 0 !important;
}
.content-card:not(:last-child) {
    border-right: 1px solid rgba(11,12,12,0.08) !important;
}

/* On smaller screens, stack them and change border */
@media (max-width: 980px) {
    .content-card {
        padding-left: 0 !important;
        padding-right: 0 !important;
    }
    .content-card:not(:last-child) {
        border-right: none !important;
        border-bottom: 1px solid rgba(11,12,12,0.08) !important;
        padding-bottom: 32px !important;
        margin-bottom: 32px !important;
    }
}

/* Fix advisory tags */
.severity--advisory {
    background: #145C3D !important;
    color: #fff !important;
}
.severity--alert {
    background: #005eb8 !important; /* Keep alert blue */
    color: #fff !important;
}

/* Service typography */
.service b {
    font-size: 16px !important;
    margin-bottom: 4px !important;
}
.service p {
    font-size: 14px !important;
    line-height: 1.4 !important;
}

/* Make sure footer links don't stretch */
.card-bottom-link, .about-links {
    margin-top: auto !important; /* This pushes them to the bottom if the column stretches, but we want them to follow naturally */
}
/* Wait, to let footer links follow naturally, we shouldn't use margin-top: auto */
.content-card.advisories, .content-card.services, .content-card.about {
    display: block !important; /* Remove flex column behavior which might use margin-top: auto to push things down */
}
.card-bottom-link {
    margin-top: 24px !important;
    display: inline-flex !important;
}
.about-links {
    margin-top: 24px !important;
    border-top: 1px solid rgba(11,12,12,0.08) !important;
}
.advisory-callout {
    margin-top: 24px !important;
    padding-top: 24px !important;
    border-top: 1px solid rgba(11,12,12,0.08) !important;
}
`;

fs.writeFileSync('src/styles/homepage.css', css + '\n' + fixes);
