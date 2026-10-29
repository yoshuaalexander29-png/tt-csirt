const fs = require('fs');
const files = [
  'public/assets/fonts/light-94a07e06a1-v2.woff2',
  'public/assets/fonts/bold-b542beb274-v2.woff2',
  'public/assets/fonts/light-f591b13f7d-v2.woff',
  'public/assets/fonts/bold-affa96571d-v2.woff'
];

files.forEach(f => {
  const buf = fs.readFileSync(f);
  console.log(f);
  console.log('Size:', buf.length);
  console.log('Hex Header:', buf.slice(0, 32).toString('hex'));
  console.log('Corruptions (EFBFBD):', buf.indexOf(Buffer.from('efbfbd', 'hex')) !== -1);
  console.log('---');
});
