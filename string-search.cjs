const fs = require('fs');
const buf = fs.readFileSync('node_modules/govuk-frontend/dist/govuk/assets/fonts/bold-affa96571d-v2.woff');
let str = '';
for(let i = 0; i < buf.length; i++) {
  if (buf[i] >= 32 && buf[i] <= 126) {
    str += String.fromCharCode(buf[i]);
  } else {
    str += ' ';
  }
}
const matches = str.match(/.{0,20}GDS.{0,20}/ig);
if (matches) {
  console.log(matches.map(s => s.trim()).filter((v, i, a) => a.indexOf(v) === i).join('\n'));
}
