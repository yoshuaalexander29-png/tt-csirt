const fs = require('fs');

let css = fs.readFileSync('src/styles/homepage.css', 'utf-8');
css = css.replace(/\/\* Fix layout for search bar in slots\.end \*\/[\s\S]*?\}\s*}/g, '');
css = css.replace(/\.app-service-navigation \.govuk-width-container\s*\{[\s\S]*?\}/g, '');
css = css.replace(/\.app-service-navigation \.govuk-service-navigation__container\s*\{[\s\S]*?\}/g, '');
fs.writeFileSync('src/styles/homepage.css', css);
