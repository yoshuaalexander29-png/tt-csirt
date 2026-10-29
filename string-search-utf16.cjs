const fs = require('fs');
const buf = fs.readFileSync('node_modules/govuk-frontend/dist/govuk/assets/fonts/bold-affa96571d-v2.woff');
let str = buf.toString('utf16le');
let str2 = buf.toString('utf16be');
console.log("UTF-16LE Matches:", str.match(/.{0,20}GDS.{0,20}/ig)?.join('\n'));
console.log("UTF-16BE Matches:", str2.match(/.{0,20}GDS.{0,20}/ig)?.join('\n'));
