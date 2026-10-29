const fs = require('fs');
let css = fs.readFileSync('src/styles/homepage.css', 'utf-8');

css = css.replace(
    /\.partner-row h3, \.partner-row p, \.partners-panel__link \{ color: white; \}\n\.partners-panel__link \{ background: transparent; border-top: 1px solid rgba\(255,255,255,0\.2\); \}\n\.partner-row \{ border-bottom-color: rgba\(255,255,255,0\.2\); \}\n\.partner-row > svg \{ background: rgba\(255,255,255,0\.15\); \}/,
    `.partners-panel__list { background: #fff; }
.partner-row h3 { color: #061b49; }
.partner-row p { color: #0f385c; }
.partners-panel__link { color: #005eb8; background: #eaf4ff; border-top: 1px solid #d2e2f1; }
.partner-row { border-bottom-color: #d2e2f1; }
.partner-row > svg { background: #005eb8; }`
);

css = css.replace(
    /\.partners-panel h2 \{\n    font-size: 30px;\n    font-weight: 500;\n    line-height: 1\.06;\n    letter-spacing: -0\.035em;\n    color: #fff;\n\}/,
    `.partners-panel__intro h2, .partners-panel h2 {
    font-size: 32px;
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -.035em;
    color: #fff;
}`
);

fs.writeFileSync('src/styles/homepage.css', css);
