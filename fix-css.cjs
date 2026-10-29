const fs = require('fs');
let css = fs.readFileSync('src/styles/homepage.css', 'utf8');

const lines = css.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('===============================================')) {
    // If it's not already commented (no /*)
    if (!lines[i].includes('/*')) {
      lines[i] = '/* ' + lines[i];
    }
    
    // Look back to find the start of the orphaned text
    let j = i - 1;
    while (j >= 0) {
      if (lines[j].trim() === '' || lines[j].includes('}') || lines[j].includes('{') || lines[j].includes('*/') || lines[j].includes('/*')) {
        break;
      }
      j--;
    }
    // Comment out all lines between j+1 and i
    for (let k = j + 1; k < i; k++) {
      if (!lines[k].includes('/*')) {
         lines[k] = '/* ' + lines[k];
      }
    }
  }
}

// Additional fix for specific remaining errors
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim().startsWith('NOTE: Core GOV.UK') || 
      lines[i].trim().startsWith('GOV.UK SECONDARY') || 
      lines[i].trim().match(/^[0-9]+\.\s+GOV\.UK/)) {
    if (!lines[i].includes('/*')) {
      lines[i] = '/* ' + lines[i];
    }
  }
}

fs.writeFileSync('src/styles/homepage.css', lines.join('\n'));
