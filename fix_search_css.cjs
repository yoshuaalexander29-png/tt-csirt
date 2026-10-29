const fs = require('fs');
let content = fs.readFileSync('src/styles/homepage.css', 'utf-8');

// Remove everything from .app-site-search to the end of that section
const lines = content.split('\n');
let newLines = [];
let skip = false;
for (let line of lines) {
  if (line.includes('.app-site-search {') || line.includes('.app-site-search__wrapper {') || line.includes('.app-site-search__input {') || line.includes('.app-site-search__input::placeholder {') || line.includes('.app-site-search__input:focus {') || line.includes('.app-site-search__input::-webkit-search-cancel-button {')) {
    skip = true;
  }
  
  if (skip && line === '}') {
    skip = false;
    continue;
  }
  
  if (!skip) {
    newLines.push(line);
  }
}

// Actually, let's just do a blanket regex to remove all app-site-search blocks
content = content.replace(/\.app-site-search[^{]*\{[^}]*\}/g, '');
content = content.replace(/@media \(min-width: 62\.5em\) \{\s*\}/g, '');

fs.writeFileSync('src/styles/homepage.css', content);
