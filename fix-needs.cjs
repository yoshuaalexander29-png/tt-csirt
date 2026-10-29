const fs = require('fs');
let css = fs.readFileSync('src/styles/homepage.css', 'utf-8');

const finalFixes = `
/* ========================================================
   USER SPECIFIED REFINEMENTS
   ======================================================== */

/* Prevent horizontal scroll from 100vw */
html, body {
    overflow-x: hidden !important;
}

/* 1. Full width background */
.needs-section {
    position: relative !important;
    padding: 48px 0 56px !important;
    background: transparent !important;
    z-index: 1 !important;
    margin-top: 32px !important; /* Retaining spacing from previous */
}

.needs-section::before {
    content: "" !important;
    position: absolute !important;
    inset: 0 !important;
    left: 50% !important;
    width: 100vw !important;
    transform: translateX(-50%) !important;
    background: #F5F9FD !important;
    z-index: -1 !important;
}

/* 2. Card spacing */
.needs-grid {
    gap: 16px !important;
    display: grid !important; /* Ensure grid is used */
    align-items: stretch !important; /* 6. Match card heights */
}

/* 7. Card padding & 8. Border & 6. Match card heights (flex) */
.need-card {
    padding: 24px !important;
    border: 1px solid #B1C9E8 !important;
    box-shadow: none !important;
    display: flex !important;
    flex-direction: column !important;
    height: auto !important; /* Flex children inside stretched grid items should be auto, or 100% */
}

.need-card--incident {
    padding: 28px !important;
}

/* 3. Blue top strips */
.need-card:not(.need-card--incident) {
    position: relative !important;
    border-radius: 4px !important;
}

.need-card:not(.need-card--incident)::before {
    content: "" !important;
    position: absolute !important;
    top: -1px !important; /* To cover the border */
    left: -1px !important;
    right: -1px !important;
    height: 4px !important;
    background: #1D70B8 !important;
    border-radius: 4px 4px 0 0 !important;
    z-index: 2 !important;
}

/* 4. Advisory tag */
.severity--advisory {
    background: #145C3D !important;
    color: #fff !important;
    border: none !important;
}

/* 5. Align the "View guidance" links */
/* Push the first link (and its following siblings) to the bottom */
.need-card > a:first-of-type {
    margin-top: auto !important;
}

/* Ensure minimum distance between text and links */
.need-card > p:last-of-type,
.need-card > span:last-of-type {
    margin-bottom: 24px !important;
}
`;

fs.writeFileSync('src/styles/homepage.css', css + '\n' + finalFixes);
