const fs = require('fs');

let css = fs.readFileSync('src/styles/homepage.css', 'utf-8');
const identityCSS = `
/* TT-CSIRT Service Identity */
.ttcsirt-service-identity {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  padding: 15px 0 25px 0;
  gap: 20px;
}
@media (min-width: 40.0625em) {
  .ttcsirt-service-identity {
    flex-direction: row;
    align-items: flex-end;
    padding: 25px 0 30px 0;
  }
}
.ttcsirt-service-identity__title {
  font-family: var(--font-family-sans);
  font-size: 1.5rem;
  line-height: 1.1;
  font-weight: 700;
  color: #0b0c0c;
}
@media (min-width: 40.0625em) {
  .ttcsirt-service-identity__title {
    font-size: 2.25rem;
  }
}
.ttcsirt-service-identity__search {
  width: 100%;
}
@media (min-width: 40.0625em) {
  .ttcsirt-service-identity__search {
    width: auto;
    min-width: 250px;
  }
}
.ttcsirt-search-box {
  display: flex;
  align-items: stretch;
  border: 1px solid #0b0c0c;
  background-color: #ffffff;
}
.ttcsirt-search-box__input {
  flex: 1 1 auto;
  border: none;
  padding: 10px;
  font-family: var(--font-family-sans);
  font-size: 1rem;
}
.ttcsirt-search-box__input:focus {
  outline: 3px solid #ffdd00;
  outline-offset: 0;
  box-shadow: inset 0 0 0 2px #0b0c0c;
}
.ttcsirt-search-box__button {
  background-color: #1d70b8;
  border: none;
  color: #ffffff;
  padding: 10px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ttcsirt-search-box__button:hover {
  background-color: #003078;
}
.ttcsirt-search-box__button:focus {
  outline: 3px solid #ffdd00;
  outline-offset: 0;
  color: #0b0c0c;
  background-color: #ffdd00;
  box-shadow: 0 -2px #ffdd00, 0 4px #0b0c0c;
}
`;
fs.writeFileSync('src/styles/homepage.css', css + '\n' + identityCSS);

let tsx = fs.readFileSync('src/App.tsx', 'utf-8');
tsx = tsx.replace(/govuk-service-identity/g, 'ttcsirt-service-identity');
tsx = tsx.replace(/govuk-search-box/g, 'ttcsirt-search-box');
fs.writeFileSync('src/App.tsx', tsx);
console.log('Restored ServiceIdentity styles.');
