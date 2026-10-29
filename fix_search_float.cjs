const fs = require('fs');
let css = fs.readFileSync('src/styles/site-search.scss', 'utf-8');
css = css.replace(/float: right;/g, '/* removed float */');
fs.writeFileSync('src/styles/site-search.scss', css);
