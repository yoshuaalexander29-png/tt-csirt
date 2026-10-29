const fs = require('fs');
let css = fs.readFileSync('src/styles/homepage.css', 'utf-8');
css = css.replace(/background: #e5effd !important;/g, 'background: #eef3fd !important;');
fs.writeFileSync('src/styles/homepage.css', css);
