const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

app = app.replace(/>Advisories overview</g, '>Overview<');
app = app.replace(/>Alerts &amp; Advisories</g, '>Alerts and advisories<');
app = app.replace(/>Alerts & Advisories</g, '>Alerts and advisories<');
app = app.replace(/>Vulnerability Coordination</g, '>Vulnerability coordination<');

app = app.replace(/>About overview</g, '>Overview<');
app = app.replace(/>Our Mandate</g, '>Our mandate<');
app = app.replace(/>Publications &amp; Guidelines</g, '>Publications and guidelines<');
app = app.replace(/>Publications & Guidelines</g, '>Publications and guidelines<');
app = app.replace(/>Annual Reports</g, '>Annual reports<');
app = app.replace(/>Contact TT-CSIRT</g, '>Contact us<');

fs.writeFileSync('src/App.tsx', app);
