const fs = require('fs');
const html = fs.readFileSync('legacy_statistics.html', 'utf8');

const regex = /data-chart_options='([^']+)'|data-chart_options="([^"]+)"/g;
let match;
let count = 0;
while ((match = regex.exec(html)) !== null) {
  count++;
  const raw = match[1] || match[2];
  const decoded = raw.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  console.log(`\n\n=== CHART OPTIONS ${count} ===`);
  try {
    const obj = JSON.parse(decoded);
    if (obj.series) console.log("Series:", JSON.stringify(obj.series));
    if (obj.xaxis && obj.xaxis.categories) console.log("X-Axis Categories:", JSON.stringify(obj.xaxis.categories));
  } catch(e) {
    console.error(e);
  }
}
