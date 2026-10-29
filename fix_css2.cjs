const fs = require('fs');
let css = fs.readFileSync('src/styles/homepage.css', 'utf8');

css = css.replace(/@media\s*\([^)]+\)\s*\{\s*\}\s*/g, '');

fs.writeFileSync('src/styles/homepage.css', css);
