const fs = require('fs');

let css = fs.readFileSync('src/styles/index.css', 'utf-8');

css = css.replace('width: auto !important;', 'width: 270px !important;');

fs.writeFileSync('src/styles/index.css', css);
