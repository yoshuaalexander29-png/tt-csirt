const fs = require('fs');

let indexCss = fs.readFileSync('src/styles/index.css', 'utf-8');
indexCss = indexCss.replace(/\/\* Custom Navigation Flex Layout \*\/[\s\S]*?\}\s*\}/, '');
fs.writeFileSync('src/styles/index.css', indexCss);

let homepageCss = fs.readFileSync('src/styles/homepage.css', 'utf-8');
homepageCss = homepageCss.replace(/\.government-masthead__divider\s*\{[\s\S]*?\}/g, '');
homepageCss = homepageCss.replace(/\.govuk-header__homepage-link:focus\s*\.government-masthead__divider\s*\{[\s\S]*?\}/g, '');
homepageCss = homepageCss.replace(/\.app-header-logo\s*\{[\s\S]*?\}/g, '');
fs.writeFileSync('src/styles/homepage.css', homepageCss);
