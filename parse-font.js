const fs = require('fs');

const buf = fs.readFileSync('public/assets/fonts/light-94a07e06a1-v2.woff2');
console.log('Signature:', buf.toString('utf8', 0, 4));
console.log('Flavor:', buf.readUInt32BE(4).toString(16));
console.log('Length:', buf.readUInt32BE(8));
console.log('NumTables:', buf.readUInt16BE(12));
