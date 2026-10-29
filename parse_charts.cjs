const fs = require('fs');
const html = fs.readFileSync('legacy_statistics.html', 'utf-8');
const matches = [...html.matchAll(/data-chart_data='([^']+)'/g)];
console.log(`Found ${matches.length} charts.`);
for (let i = 0; i < matches.length; i++) {
  const decoded = matches[i][1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  const json = JSON.parse(decoded);
  console.log(`Chart ${i} type:`, json.type || (json.series ? 'has series' : 'other'));
  if (json.series) {
    console.log(json.series.map(s => s.name));
  } else if (json.columns) {
    console.log('Columns:', json.columns.map(c => c.title));
  }
}
