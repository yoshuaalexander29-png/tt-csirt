const fs = require('fs');
let code = fs.readFileSync('src/styles/homepage.css', 'utf8');
code = code.replace(/flex-shrink: 0;\n    margin-left: auto;/g, 'flex-shrink: 0;');
fs.writeFileSync('src/styles/homepage.css', code);
