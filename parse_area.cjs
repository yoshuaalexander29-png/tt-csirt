const fs = require('fs');
const html = fs.readFileSync('legacy_statistics.html', 'utf-8');
const match = html.match(/"series":\[{"name":"Private Sector".*?\]/);
if (match) {
  console.log("FOUND in double quotes:", match[0]);
} else {
  // Let's decode html entities and then find it
  const decoded = html.replace(/&quot;/g, '"');
  const matchDecoded = decoded.match(/"series":\[{"name":"Private Sector".*?\]/);
  if (matchDecoded) {
    console.log("FOUND after decode:", matchDecoded[0]);
  }
}
