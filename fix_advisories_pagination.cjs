const fs = require('fs');
let code = fs.readFileSync('src/pages/AdvisoriesPage.tsx', 'utf-8');

// 1. Change getResilientAdvisories to fetch up to 100
code = code.replace(/perPage: 10,/g, 'perPage: 100,');
// Actually, I shouldn't rely on `loadAdvisories(currentPage)` because we just need loadAdvisories() once.
