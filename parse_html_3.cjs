const fs = require('fs');
const html = fs.readFileSync('legacy_statistics.html', 'utf8');

const regex = /data-options='([^']+)'|data-options="([^"]+)"/g;
let match;
let count = 0;
while ((match = regex.exec(html)) !== null) {
  count++;
  const raw = match[1] || match[2];
  const decoded = raw.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  if (decoded.includes('Public Sector')) {
    console.log(`\n\n=== MATCH ${count} ===`);
    try {
      const obj = JSON.parse(decoded);
      console.log(JSON.stringify(obj, null, 2));
    } catch(e) {
      console.log(decoded.substring(0, 500));
    }
  }
}
