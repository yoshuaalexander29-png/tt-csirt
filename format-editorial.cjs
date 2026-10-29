const fs = require('fs');
let css = fs.readFileSync('src/styles/homepage.css', 'utf-8');

const editorialOverrides = `
/* ========================================================
   EDITORIAL LAYOUT OVERRIDES (THREE COLUMNS)
   ======================================================== */

/* Make the section itself the white box */
.content-cards {
    background: #fff !important;
    border-radius: 4px !important;
    border: 1px solid #d2e2f1 !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
    padding: 32px !important;
    gap: 32px !important;
    align-items: start !important; /* Let content terminate naturally, don't stretch */
}

/* Remove card appearance from the columns */
.content-card, .content-card.advisories, .content-card.services, .content-card.about {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    min-height: auto !important;
}

/* Headings baseline alignment */
.advisories-header {
    padding-bottom: 0 !important;
}
.advisories-header > div {
    display: flex !important;
    align-items: baseline !important;
    justify-content: space-between !important;
}
.content-card h2, .advisories-header h2 {
    margin-bottom: 24px !important;
    color: #061b49 !important;
}
.section-eyebrow, .advisories-header > p {
    color: #005eb8 !important; /* Matching blue for eyebrows */
    margin-bottom: 8px !important;
    display: block !important;
    text-transform: uppercase !important;
}

/* Hide the callout to match screenshot if it exists, but actually let's just style it compactly */
.advisory-callout {
    margin-top: 24px !important;
    padding-top: 24px !important;
    border-top: 1px solid #d2e2f1 !important;
}
.advisory-callout a { font-weight: 700 !important; }

/* Adjust link styles to match screenshot */
.service b {
    color: #005eb8 !important;
    font-size: 16px !important;
}
.advisory b {
    color: #0b0c0c !important;
    font-size: 14px !important;
    font-weight: 700 !important;
}
.advisory-content span {
    color: #0b0c0c !important; 
}
.advisory time {
    color: #505a5f !important;
}
.about-links a {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    border-bottom: 1px solid #d2e2f1 !important;
    border-top: none !important;
    padding: 16px 0 !important;
    color: #005eb8 !important;
    font-weight: 700 !important;
    text-decoration: none !important;
}
.about-links a:first-child {
    border-top: 1px solid #d2e2f1 !important;
}
.about-links a svg {
    color: #005eb8 !important;
}

.advisory {
    grid-template-columns: 54px minmax(0, 1fr) 80px 18px !important;
    border-bottom: 1px solid #d2e2f1 !important;
}
.advisory:last-child {
    border-bottom: none !important;
}
.severity--alert { background: #005eb8 !important; color: #fff !important; font-size: 11px !important; }
.severity--advisory { background: #1a7b44 !important; color: #fff !important; font-size: 11px !important; }
.advisory-arrow { color: #505a5f !important; }

.advisories-header a, .services .card-bottom-link {
    color: #005eb8 !important;
    font-weight: 700 !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 8px !important;
    text-decoration: none !important;
}
.advisories-header a { font-size: 14px !important; }

/* Services list in screenshot has no left icon */
.service > svg:first-child {
    display: none !important;
}
.service {
    grid-template-columns: minmax(0, 1fr) 18px !important;
    border-bottom: 1px solid #d2e2f1 !important;
    padding: 16px 0 !important;
    text-decoration: none !important;
}
.service:last-child {
    border-bottom: none !important;
}
.service > div b {
    font-size: 16px !important;
    font-weight: 700 !important;
    margin-bottom: 4px !important;
    display: block !important;
}
.service > div p {
    font-size: 14px !important;
    color: #0b0c0c !important;
    margin: 0 !important;
    line-height: 1.4 !important;
}
.service > svg:last-child {
    color: #005eb8 !important;
}

.card-bottom-link {
    margin-top: 24px !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 8px !important;
    color: #005eb8 !important;
    font-weight: 700 !important;
    text-decoration: none !important;
}

/* About TT-CSIRT paragraph */
.content-card.about > .section-intro {
    font-size: 16px !important;
    color: #0b0c0c !important;
    margin-bottom: 24px !important;
    line-height: 1.5 !important;
}
/* Hide the facts as they are not in the screenshot */
.about-facts {
    display: none !important;
}
`;

fs.writeFileSync('src/styles/homepage.css', css + '\n' + editorialOverrides);
