const fs = require('fs');
let css = fs.readFileSync('src/styles/homepage.css', 'utf8');

const missingCSS = `
.app-width-container,
.app-header-container,
.app-service-navigation .govuk-width-container {
  max-width: 1100px;
  margin-left: 15px;
  margin-right: 15px;
}
@media (min-width: 40.0625em) {
  .app-width-container,
  .app-header-container,
  .app-service-navigation .govuk-width-container {
    margin-left: 30px;
    margin-right: 30px;
  }
}
@media (min-width: 1160px) {
  .app-width-container,
  .app-header-container,
  .app-service-navigation .govuk-width-container {
    margin-left: auto;
    margin-right: auto;
  }
}
.app-header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  padding-top: 14px;
  padding-bottom: 12px;
}
.app-header-logo {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
}

/* Service Navigation - Full Viewport Width Surface */
.govuk-service-navigation,
.govuk-service-navigation--inverse,
.app-service-navigation {
  background-color: #F5F2F8 !important;
  border-top: 1px solid var(--govuk-surface-border-colour, #aa98cf) !important;
  border-bottom: 1px solid var(--govuk-surface-border-colour, #aa98cf) !important;
  border-left: 0 !important;
  border-right: 0 !important;
  font-family: var(--font-family-sans, "GDS Transport", Arial, sans-serif);
  color: #0b0c0c !important;
  padding: 0;
  width: 100%;
  box-sizing: border-box;
}
.govuk-service-navigation .govuk-width-container,
.govuk-service-navigation--inverse .govuk-width-container,
.app-service-navigation .govuk-width-container {
  border: 0 !important;
  border-width: 0 !important;
  background: transparent !important;
}
.govuk-service-navigation__container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}
@media (min-width: 40.0625em) {
  .govuk-service-navigation__container {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }
}
.app-service-navigation__wrapper {
  width: 100%;
}

/* GDS Mobile Menu Toggle Button */
.govuk-service-navigation__toggle {
  font-family: var(--font-family-sans, "GDS Transport", Arial, sans-serif);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-weight: 700;
  font-size: 1.1875rem;
  line-height: 1.3157894737;
  display: inline-flex;
  align-items: center;
  margin: 10px 0;
  padding: 0;
  border: 0;
  color: var(--govuk-link-colour, #1a65a6) !important;
  background: none;
  cursor: pointer;
  text-decoration: none;
}
.govuk-service-navigation__toggle::after {
  content: none !important;
  display: none !important;
  border: none !important;
}
.govuk-service-navigation__toggle::before {
  content: "";
  display: inline-block;
  position: relative;
  bottom: 0.1052631579em;
  width: 7px;
  height: 7px;
  margin: 0 10px 0 2px;
  transform: rotate(135deg);
  border-top: 2.5px solid currentColor;
  border-right: 2.5px solid currentColor;
  vertical-align: baseline;
  transition: transform 0.15s ease-in-out;
}
.govuk-service-navigation__toggle[aria-expanded="true"]::before {
  bottom: -0.1052631579em;
  transform: rotate(-45deg);
}
.govuk-service-navigation__toggle:hover {
  text-decoration: underline;
  color: var(--govuk-link-hover-colour, #0f385c) !important;
}
.govuk-service-navigation__toggle:focus {
  outline: 3px solid transparent !important;
  color: #0b0c0c !important;
  background-color: #ffdd00 !important;
  box-shadow: 0 -2px #ffdd00, 0 4px #0b0c0c !important;
  text-decoration: none !important;
}
@media (min-width: 40.0625em) {
  .govuk-service-navigation__toggle {
    display: none !important;
  }
}

/* GDS Service Navigation List */
.govuk-service-navigation__list {
  margin: 0;
  padding: 0;
  list-style: none;
  width: 100%;
}
@media (max-width: 40.0525em) {
  .govuk-service-navigation__list {
    padding-bottom: 10px;
  }
  .govuk-service-navigation__list[hidden] {
    display: none !important;
  }
}
@media (min-width: 40.0625em) {
  .govuk-service-navigation__list {
    display: flex !important;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    margin-bottom: 0;
    width: auto;
  }
}

/* GDS Navigation Items */
.govuk-service-navigation .govuk-service-navigation__item,
.govuk-service-navigation--inverse .govuk-service-navigation__item,
.app-service-navigation .govuk-service-navigation__item {
  position: relative;
  margin: 0;
  border-width: 0;
  border-style: solid;
  border-color: #7f65b7 !important;
}
@media (max-width: 40.0624em) {
  .govuk-service-navigation .govuk-service-navigation__item,
  .govuk-service-navigation--inverse .govuk-service-navigation__item,
  .app-service-navigation .govuk-service-navigation__item {
    padding: 8px 0;
    border-top: 1px solid var(--govuk-surface-border-colour, #aa98cf) !important;
  }
  .govuk-service-navigation .govuk-service-navigation__item--active,
  .govuk-service-navigation--inverse .govuk-service-navigation__item--active,
  .app-service-navigation .govuk-service-navigation__item--active {
    padding-left: 10px;
    border-left: 5px solid #7f65b7 !important;
  }
}
@media (min-width: 40.0625em) {
  .govuk-service-navigation .govuk-service-navigation__item,
  .govuk-service-navigation--inverse .govuk-service-navigation__item,
  .app-service-navigation .govuk-service-navigation__item {
    display: inline-block;
    padding: 15px 0;
    margin: 0 30px 0 0;
    border-top: 0 !important;
  }
  .govuk-service-navigation .govuk-service-navigation__item:last-child,
  .govuk-service-navigation--inverse .govuk-service-navigation__item:last-child,
  .app-service-navigation .govuk-service-navigation__item:last-child {
    margin-right: 0;
  }
  .govuk-service-navigation .govuk-service-navigation__item--active,
  .govuk-service-navigation--inverse .govuk-service-navigation__item--active,
  .app-service-navigation .govuk-service-navigation__item--active {
    padding-bottom: 10px;
    border-bottom: 5px solid #7f65b7 !important;
    border-left: 0 !important;
    margin-bottom: -1px;
  }
}

/* GDS Navigation Links */
.govuk-service-navigation__link {
  font-family: var(--font-family-sans, "GDS Transport", Arial, sans-serif);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 1.1875rem;
  line-height: 1.3157894737;
  color: var(--govuk-link-colour, #1a65a6) !important;
  text-decoration: none;
  display: inline-block;
}
.govuk-service-navigation__link:visited {
  color: var(--govuk-link-colour, #1a65a6) !important;
}
.govuk-service-navigation__link:active {
  color: var(--govuk-link-active-colour, #0b0c0c) !important;
}
.govuk-service-navigation__link:hover {
  color: var(--govuk-link-hover-colour, #0f385c) !important;
  text-decoration: underline;
  text-decoration-thickness: 3px;
}
.govuk-service-navigation__link:focus {
  outline: 3px solid transparent !important;
  color: #0b0c0c !important;
  background-color: #ffdd00 !important;
  box-shadow: 0 -2px #ffdd00, 0 4px #0b0c0c !important;
  text-decoration: none !important;
}
.govuk-service-navigation__active-fallback {
  font-weight: 700;
  color: var(--govuk-link-colour, #1a65a6);
}
.govuk-service-navigation__link:hover .govuk-service-navigation__active-fallback {
  color: var(--govuk-link-hover-colour, #0f385c);
}
.govuk-service-navigation__link:focus .govuk-service-navigation__active-fallback {
  color: #0b0c0c !important;
}
`;

const navStart = css.indexOf('/* TT-CSIRT Branding for Service Navigation */');
const navEnd = css.indexOf('/* TT-CSIRT WebKit List Indentation Fix');

if (navStart !== -1 && navEnd !== -1) {
  css = css.slice(0, navStart) + missingCSS + css.slice(navEnd);
}

fs.writeFileSync('src/styles/homepage.css', css);
