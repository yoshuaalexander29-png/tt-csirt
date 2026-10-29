const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

app = app.replace('Government of the                    <br />                    Republic of Trinidad and Tobago', 'Government of the Republic of Trinidad and Tobago');

fs.writeFileSync('src/App.tsx', app);
