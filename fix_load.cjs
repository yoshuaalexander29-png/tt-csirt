const fs = require('fs');
let code = fs.readFileSync('src/pages/AdvisoriesPage.tsx', 'utf-8');

code = code.replace(/loadAdvisories\(currentPage\);/g, 'loadAdvisories(1);');
code = code.replace(/\[loadAdvisories, currentPage\]/g, '[loadAdvisories]');

fs.writeFileSync('src/pages/AdvisoriesPage.tsx', code);
