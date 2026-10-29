const fs = require('fs');
let css = fs.readFileSync('src/styles/homepage.css', 'utf-8');

const overrides = `
/* ========================================================
   MASTER OVERRIDES FOR COHESION, SPACING, TYPOGRAPHY
   ======================================================== */

/* Background */
html, body, #root, main { background: #f5f8fc !important; }

/* Section spacing: 32px */
.needs-section, .content-cards, .partners-statistics, .site-footer { margin-top: 32px !important; }
.hero { margin-bottom: 32px !important; }
.needs-section { padding-top: 0 !important; padding-bottom: 0 !important; }
.content-cards { padding-bottom: 0 !important; }
.partners-statistics { margin-bottom: 32px !important; }

/* Internal card padding: 24px */
.need-card, .content-card, .partners-panel, .incidents-panel { padding: 24px !important; }
.partners-panel__intro, .partners-panel__list, .incidents-panel { padding-left: 24px !important; padding-right: 24px !important; }
.partners-panel__intro { padding-top: 24px !important; padding-bottom: 24px !important; }
.incidents-panel { padding-top: 24px !important; padding-bottom: 24px !important; }
.partners-panel__link { padding: 16px 24px !important; }
.partners-panel { padding: 0 !important; }

/* Spacing between related cards: 16px */
.needs-grid, .content-cards, .partners-statistics { gap: 16px !important; }
.stat-numbers { gap: 16px !important; }

/* Spacing between list items: 12px */
.partner-row, .service, .incident-row, .advisory { gap: 12px !important; margin-bottom: 0 !important; padding: 12px 0 !important; }
.mandate-item { padding: 6px 0 !important; gap: 12px !important; min-height: 0 !important; }
.mandate-list { gap: 0 !important; }

/* Cards shared properties (Cohesion) */
.need-card, .content-card, .partners-panel, .incidents-panel, .advisories {
    border-radius: 4px !important;
    border: 1px solid #d2e2f1 !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
    background: #fff !important;
}
.need-card--incident { border-top: 1px solid #d2e2f1 !important; }

/* Typography */
.hero-left h1 { font-size: 56px !important; font-weight: 800 !important; line-height: 1.1 !important; margin-bottom: 16px !important; }

.needs-heading h2, .partners-panel__intro h2, .incidents-panel h2, .content-card h2, .advisories-header h2 {
    font-size: 30px !important; font-weight: 800 !important; line-height: 1.2 !important; margin-bottom: 16px !important;
    letter-spacing: -.02em !important; color: #061b49 !important; max-width: none !important;
}
.partners-panel__intro h2 { color: #fff !important; }

.need-card h3, .partner-row h3, .incidents-panel > h3 {
    font-size: 24px !important; font-weight: 700 !important; line-height: 1.3 !important; margin-bottom: 8px !important; color: #061b49 !important;
}

.service b { font-size: 20px !important; margin: 0 0 4px 0 !important; color: #061b49 !important; }
.incident-row b { font-size: 40px !important; line-height: 1 !important; color: #005eb8 !important; }

body, .hero-left p, .hero-right p, .need-card p, .need-card span, .partner-row p, .incident-row span, .service p, .section-intro, .about-links a, .advisory b, .need-card a, .partners-panel__link, .incidents-panel > a {
    font-size: 16px !important; line-height: 1.5 !important; margin: 0 !important;
}
.partner-row p, .service p { color: #0f385c !important; }
.need-card a { margin-top: 16px !important; }
.about-links a { color: #16548a !important; display: block !important; padding: 12px 0 !important; }
.about-facts { margin-bottom: 16px !important; }

.section-eyebrow, .partners-panel p:first-child, .incidents-panel > p:first-child, .advisory time, .mandate-item, .need-card--incident > p {
    font-size: 14px !important; letter-spacing: 0.05em !important; font-weight: 700 !important; text-transform: uppercase !important;
}

.section-intro, .needs-heading p { margin-top: 0 !important; margin-bottom: 16px !important; color: #0f385c !important; }
.partners-panel__intro p, .incidents-panel > p { margin-bottom: 8px !important; }
.partners-panel__intro > span, .incidents-panel__rule { margin-top: 16px !important; margin-bottom: 16px !important; }
.advisory b { margin-bottom: 4px !important; font-weight: 700 !important; display: block !important; color: #061b49 !important; }
.advisory { display: grid !important; align-items: center !important; }

.partners-panel__intro {
    background: radial-gradient(ellipse 54% 128% at 15% 55%, rgba(83,165,224,.34), transparent 70%), linear-gradient(108deg, #1d70b8, #1767ac 60%, #16548a) !important;
}
.partners-panel__list { background: #fff !important; }

.service, .partner-row, .incident-row {
    display: flex !important;
    align-items: flex-start !important;
}
.service > svg, .partner-row > svg, .incident-row > svg, .need-card svg {
    margin-top: 2px !important;
}
.service > div, .partner-row > div, .incident-row > div {
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
}

.partner-row > svg { width: 64px !important; height: 64px !important; padding: 12px !important; flex: 0 0 64px !important; border-radius: 4px !important; background: #005eb8 !important; }
.incident-row > svg { width: 48px !important; height: 48px !important; padding: 8px !important; flex: 0 0 48px !important; border-radius: 4px !important; background: #005eb8 !important; color: #fff !important; }
.service > svg:first-child { display: block !important; width: 24px !important; height: 24px !important; flex: 0 0 24px !important; color: #16548a !important; }
`;

fs.writeFileSync('src/styles/homepage.css', css + '\n' + overrides);
