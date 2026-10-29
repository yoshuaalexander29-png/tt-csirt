const fs = require('fs');
let css = fs.readFileSync('src/styles/homepage.css', 'utf8');

// Remove .app-header-container, .app-width-container, and their media queries
const headerRegex = /\.app-header-container,\s*\.app-service-navigation \.govuk-width-container\s*\{[^}]+\}/g;
css = css.replace(headerRegex, '');

const mediaRegex1 = /@media\s*\([^)]+\)\s*\{\s*\.app-width-container,\s*\.app-header-container,\s*\.app-service-navigation \.govuk-width-container\s*\{[^}]+\}\s*\}/g;
css = css.replace(mediaRegex1, '');

const headerFlexRegex = /\.app-header-container\s*\{[^}]+\}/g;
css = css.replace(headerFlexRegex, '');

// The logo flex
const logoFlexRegex = /\.app-header-logo\s*\{[^}]+\}/g;
css = css.replace(logoFlexRegex, '');

// TT-CSIRT branding colors for service navigation
const customServiceNav = `
/* TT-CSIRT Branding for Service Navigation */
.app-service-navigation {
  background-color: #F5F2F8 !important;
  border-top: 1px solid #aa98cf !important;
  border-bottom: 1px solid #aa98cf !important;
  border-left: 0 !important;
  border-right: 0 !important;
}
.app-service-navigation .govuk-service-navigation__item {
  border-color: #7f65b7 !important;
}
.app-service-navigation .govuk-service-navigation__item--active {
  border-bottom-color: #7f65b7 !important;
}
.app-service-navigation .govuk-service-navigation__link {
  color: #1a65a6 !important;
}
.app-service-navigation .govuk-service-navigation__link:visited {
  color: #1a65a6 !important;
}
.app-service-navigation .govuk-service-navigation__link:hover {
  color: #0f385c !important;
}
.app-service-navigation .govuk-service-navigation__link:active {
  color: #0b0c0c !important;
}
.app-service-navigation .govuk-service-navigation__active-fallback {
  color: #1a65a6 !important;
}
.app-service-navigation .govuk-service-navigation__toggle {
  color: #1a65a6 !important;
}
`;

const navStart = css.indexOf('/* Service Navigation - Full Viewport Width Surface */');
const navEnd = css.indexOf('/* TT-CSIRT WebKit List Indentation Fix');

if (navStart !== -1 && navEnd !== -1) {
  css = css.slice(0, navStart) + customServiceNav + css.slice(navEnd);
}

fs.writeFileSync('src/styles/homepage.css', css);
