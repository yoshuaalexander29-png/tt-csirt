const fs = require('fs');
let css = fs.readFileSync('src/styles/homepage.css', 'utf8');

// The block to replace is from /* Service Navigation - Full Viewport Width Surface */ to /* TT-CSIRT WebKit List Indentation Fix
const startMarker = '/* Service Navigation - Full Viewport Width Surface */';
const endMarker = '/* TT-CSIRT WebKit List Indentation Fix';

const startIndex = css.indexOf(startMarker);
const endIndex = css.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const newBlock = `/* Service Navigation - Full Viewport Width Surface */
.govuk-service-navigation--inverse.app-service-navigation {
  background-color: #F5F2F8 !important;
  border-top-color: #aa98cf !important;
  border-bottom-color: #aa98cf !important;
}

.govuk-service-navigation--inverse.app-service-navigation .govuk-service-navigation__item {
  border-color: #7f65b7 !important;
}

.govuk-service-navigation--inverse.app-service-navigation .govuk-service-navigation__link,
.govuk-service-navigation--inverse.app-service-navigation .govuk-service-navigation__toggle {
  color: #1a65a6 !important;
}

.govuk-service-navigation--inverse.app-service-navigation .govuk-service-navigation__link:hover,
.govuk-service-navigation--inverse.app-service-navigation .govuk-service-navigation__toggle:hover {
  color: #0f385c !important;
}

.govuk-service-navigation--inverse.app-service-navigation .govuk-service-navigation__link:active {
  color: #0b0c0c !important;
}

.govuk-service-navigation--inverse.app-service-navigation .govuk-service-navigation__link:focus,
.govuk-service-navigation--inverse.app-service-navigation .govuk-service-navigation__toggle:focus {
  color: #0b0c0c !important;
}
`;
  css = css.slice(0, startIndex) + newBlock + css.slice(endIndex);
  fs.writeFileSync('src/styles/homepage.css', css);
  console.log("CSS patched.");
} else {
  console.error("Markers not found.");
}
