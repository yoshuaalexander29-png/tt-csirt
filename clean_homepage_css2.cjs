const fs = require('fs');

let css = fs.readFileSync('src/styles/homepage.css', 'utf-8');
css = css.replace(/\.govuk-header__homepage-link\s*\{[\s\S]*?\}/g, '');
css = css.replace(/\.govuk-header\s*\{[\s\S]*?\}/g, '');
fs.writeFileSync('src/styles/homepage.css', css);
