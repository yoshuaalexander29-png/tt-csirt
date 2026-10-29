const fs = require('fs');
const html = fs.readFileSync('legacy_statistics.html', 'utf8');

const regex = /Public Sector/gi;
let match;
while ((match = regex.exec(html)) !== null) {
  const start = Math.max(0, match.index - 50);
  const end = Math.min(html.length, match.index + 500);
  console.log("=== MATCH ===");
  console.log(html.substring(start, end));
}
