const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /<\/div>\s*<\/section>/,
  '</div>\n        </div>\n      </section>'
);

fs.writeFileSync('src/App.tsx', code);
