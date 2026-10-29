const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /<span className="govuk-service-navigation__text">\s*(Trinidad and Tobago Cyber Security\s*<br \/>\s*Incident Response Team)\s*<\/span>/,
  '$1'
);

fs.writeFileSync('src/App.tsx', code);
