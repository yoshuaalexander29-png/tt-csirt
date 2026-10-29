const fs = require('fs');
let css = fs.readFileSync('src/styles/homepage.css', 'utf8');

css = css.replace(/\.app-width-container,\s*/g, '');

fs.writeFileSync('src/styles/homepage.css', css);
