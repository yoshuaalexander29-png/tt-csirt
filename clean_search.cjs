const fs = require('fs');

let css = fs.readFileSync('src/styles/site-search.scss', 'utf-8');
css = css.replace(/float: none;\s*\}\s*@include govuk-media-query\(\$from: desktop\)\s*\{\s*float: right;\s*\}/, 'float: none;\n  }');
css = css.replace(/\/\/ TT-CSIRT Desktop override for Search[\s\S]*?\}\s*\}/, '');
fs.writeFileSync('src/styles/site-search.scss', css);
