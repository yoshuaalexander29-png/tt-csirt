const fs = require('fs');

let css = fs.readFileSync('src/styles/homepage.css', 'utf-8');

css = css.replace(/\.government-masthead \{([\s\S]*?)background-color: #ffffff;([\s\S]*?)\}/g, '.government-masthead {$1background-color: #ffffff;$2}');
css = css.replace(/\.ttcsirt-service-identity \{([\s\S]*?)background-color: #0b0c0c;([\s\S]*?)\}/g, '.ttcsirt-service-identity {$1background-color: #0b0c0c;$2}');

fs.writeFileSync('src/styles/homepage.css', css);
