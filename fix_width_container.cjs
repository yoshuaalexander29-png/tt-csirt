const fs = require('fs');
let css = fs.readFileSync('src/styles/homepage.css', 'utf-8');

css += `
/* Fix layout for search bar in slots.end */
.app-service-navigation .govuk-width-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
}
.app-service-navigation .govuk-service-navigation__container {
  flex-grow: 1;
}
`;
fs.writeFileSync('src/styles/homepage.css', css);
