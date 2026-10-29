const fs = require('fs');
const html = fs.readFileSync('legacy_statistics.html', 'utf-8');
const decoded = html.replace(/&quot;/g, '"');
const start = decoded.indexOf('"series":[{"name":"Private Sector"');
if (start > -1) {
  const end = decoded.indexOf('],"chart":', start);
  console.log(decoded.substring(start, end + 1));
} else {
  console.log("NOT FOUND");
}
