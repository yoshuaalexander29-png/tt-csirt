const fs = require('fs');
let css = fs.readFileSync('src/styles/homepage.css', 'utf8');

// The lines causing errors are all un-commented text ending with `====== */`.
// Let's just find `*/` that doesn't have a matching `/*` and fix it.
// Actually, it's safer to just replace specific floating lines by matching them.

const lines = css.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('===============================================')) {
    // This line has '==== */'. Let's comment out everything above it until we hit a '}' or '{' or ''
    lines[i] = '   ' + lines[i]; // make sure it's valid if we add /* above
    let j = i - 1;
    while (j >= 0) {
      if (lines[j].trim() === '' || lines[j].includes('}') || lines[j].includes('{') || lines[j].includes('*/')) {
        break;
      }
      j--;
    }
    // Now j+1 is the start of the orphaned text
    if (j + 1 <= i) {
      lines[j + 1] = '/* ' + lines[j + 1];
    }
  }
}

fs.writeFileSync('src/styles/homepage.css', lines.join('\n'));
