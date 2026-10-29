const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function findFonts(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findFonts(filePath, fileList);
    } else if (filePath.endsWith('.woff') || filePath.endsWith('.woff2')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const fontFiles = findFonts('node_modules/govuk-frontend');

if (fontFiles.length === 0) {
  console.log('No .woff or .woff2 files found in node_modules/govuk-frontend/');
} else {
  fontFiles.forEach(f => {
    const buf = fs.readFileSync(f);
    const md5 = crypto.createHash('md5').update(buf).digest('hex');
    const header = buf.slice(0, 32).toString('hex');
    const hasCorruption = buf.indexOf(Buffer.from('efbfbd', 'hex')) !== -1;
    
    console.log(`File: ${f}`);
    console.log(`Size: ${buf.length} bytes`);
    console.log(`MD5: ${md5}`);
    console.log(`Hex Header: ${header}`);
    console.log(`Valid WOFF/WOFF2 Signature: ${buf.toString('utf8', 0, 4) === 'wOFF' || buf.toString('utf8', 0, 4) === 'wOF2'}`);
    console.log(`Corrupted (EFBFBD found): ${hasCorruption}`);
    console.log('---');
  });
}
