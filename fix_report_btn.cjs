const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldBtn = `<a
            href="https://ttcsirt.gov.tt/report-an-incident/"
            role="button"
            draggable="false"
            className="govuk-button"
            data-module="govuk-button"
          >
            Report a cyber incident
          </a>`;

const newBtn = `<a
            href="https://ttcsirt.gov.tt/report-an-incident/"
            role="button"
            draggable="false"
            className="govuk-button govuk-button--start"
            data-module="govuk-button"
          >
            Report a cyber incident
            <svg
              className="govuk-button__start-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="17.5"
              height="19"
              viewBox="0 0 33 40"
              aria-hidden="true"
              focusable="false"
            >
              <path fill="currentColor" d="M0 0h13l20 20-20 20H0l20-20z" />
            </svg>
          </a>`;

if(code.includes(oldBtn)) {
  code = code.replace(oldBtn, newBtn);
  fs.writeFileSync('src/App.tsx', code);
  console.log('Button replaced successfully.');
} else {
  console.log('Could not find the old button to replace. Please check the spacing.');
}
