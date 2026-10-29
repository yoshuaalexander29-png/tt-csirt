const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

app = app.replace(
    /"Coordinate and support the management of cyber security incidents affecting public and private sector organisations\."/,
    '"Coordinate and support the management of cyber security incidents affecting organisations."'
);

app = app.replace(
    /"Analyse cyber threats, indicators of compromise and emerging trends to support informed defensive decision-making\."/,
    '"Analyse cyber threats, indicators of compromise and emerging trends to support informed decision-making."'
);

app = app.replace(
    /"Publish timely cyber security alerts, advisories and technical guidance regarding vulnerabilities and active threats\."/,
    '"Publish timely cyber security alerts, advisories and technical guidance."'
);

app = app.replace(
    /"Notify affected organisations of significant vulnerabilities and facilitate responsible vulnerability disclosure\."/,
    '"Notify affected organisations of significant vulnerabilities and facilitate responsible disclosure."'
);

app = app.replace(
    /"Deliver awareness initiatives, technical guidance and training to improve national cyber resilience\."/,
    '"Deliver awareness initiatives, technical guidance and training to improve national cyber resilience."'
);

fs.writeFileSync('src/App.tsx', app);
