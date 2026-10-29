const fs = require('fs');
let css = fs.readFileSync('src/styles/homepage.css', 'utf8');
css = css.replace(
  '.government-lockup {\n  display: flex;',
  '.government-lockup {\n  display: inline-flex;\n  vertical-align: top;\n  margin-top: -3px;\n  margin-right: 10px;'
);
fs.writeFileSync('src/styles/homepage.css', css);

let tsx = fs.readFileSync('src/App.tsx', 'utf8');
tsx = tsx.replace(
  'className="government-lockup" style={{ display: "inline-flex", verticalAlign: "top", marginTop: "-3px", marginRight: "10px" }}',
  'className="government-lockup"'
);
fs.writeFileSync('src/App.tsx', tsx);
