const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldBreadcrumbsStart = code.indexOf('function Breadcrumbs');
const oldBreadcrumbsEnd = code.indexOf('export default App;');
if (oldBreadcrumbsStart === -1) {
    console.log("Could not find breadcrumbs.");
    process.exit(1);
}

// Just patch the Breadcrumbs component
const searchStr = `
function Breadcrumbs({ currentPath, onNavigateHome, onNavigateAdvisories }: BreadcrumbsProps) {
  const isAdvisoriesList = currentPath === "/advisories";
  const isAdvisoryDetail = currentPath.startsWith("/advisories/") && currentPath.length > "/advisories/".length;
  const isStatistics = currentPath === "/statistics";

  return (
    <nav className="govuk-breadcrumbs" aria-label="Breadcrumb">
      <ol className="govuk-breadcrumbs__list">
        <li className="govuk-breadcrumbs__list-item">
          <a 
             className="govuk-breadcrumbs__link" 
             href="https://homelandsecurity.gov.tt" 
             target="_blank" 
             rel="noopener noreferrer"
          >
            Ministry of Homeland Security<span className="govuk-visually-hidden"> (opens in new tab)</span>
          </a>
        </li>`;

const newStr = `
function Breadcrumbs({ currentPath, onNavigateHome, onNavigateAdvisories }: BreadcrumbsProps) {
  const isAdvisoriesList = currentPath === "/advisories";
  const isAdvisoryDetail = currentPath.startsWith("/advisories/") && currentPath.length > "/advisories/".length;
  const isStatistics = currentPath === "/statistics";

  return (
    <nav className="govuk-breadcrumbs" aria-label="Breadcrumb">
      <ol className="govuk-breadcrumbs__list">
        <li className="govuk-breadcrumbs__list-item">
          <a 
             className="govuk-breadcrumbs__link" 
             href="/"
             onClick={(e) => {
               e.preventDefault();
               onNavigateHome();
             }}
          >
            Home
          </a>
        </li>
        <li className="govuk-breadcrumbs__list-item">
          <a 
             className="govuk-breadcrumbs__link" 
             href="/"
             onClick={(e) => {
               e.preventDefault();
               onNavigateHome();
             }}
          >
            TT-CSIRT
          </a>
        </li>`;

let updatedCode = code.replace(searchStr.trim(), newStr.trim());

const advListStr = `
        ) : isAdvisoriesList ? (
          <>
            <li className="govuk-breadcrumbs__list-item">
              <a
                className="govuk-breadcrumbs__link"
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateHome();
                }}
              >
                TT-CSIRT
              </a>
            </li>
            <li className="govuk-breadcrumbs__list-item" aria-current="page">
              Advisories
            </li>
          </>
        ) : isStatistics ? (
`;

const newAdvListStr = `
        ) : isAdvisoriesList ? (
          <>
            <li className="govuk-breadcrumbs__list-item" aria-current="page">
              Cyber security advisories
            </li>
          </>
        ) : isStatistics ? (
`;

updatedCode = updatedCode.replace(advListStr.trim(), newAdvListStr.trim());

const advDetailStr = `
        {isAdvisoryDetail ? (
          <>
            <li className="govuk-breadcrumbs__list-item">
              <a
                className="govuk-breadcrumbs__link"
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateHome();
                }}
              >
                TT-CSIRT
              </a>
            </li>
            <li className="govuk-breadcrumbs__list-item">
              <a
                className="govuk-breadcrumbs__link"
                href="/advisories"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateAdvisories();
                }}
              >
                Advisories
              </a>
            </li>
            <li className="govuk-breadcrumbs__list-item" aria-current="page">
              Advisory details
            </li>
          </>
        ) : isAdvisoriesList ? (
`;

const newAdvDetailStr = `
        {isAdvisoryDetail ? (
          <>
            <li className="govuk-breadcrumbs__list-item">
              <a
                className="govuk-breadcrumbs__link"
                href="/advisories"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateAdvisories();
                }}
              >
                Cyber security advisories
              </a>
            </li>
            <li className="govuk-breadcrumbs__list-item" aria-current="page">
              Advisory details
            </li>
          </>
        ) : isAdvisoriesList ? (
`;

updatedCode = updatedCode.replace(advDetailStr.trim(), newAdvDetailStr.trim());

const statStr = `
        ) : isStatistics ? (
          <>
            <li className="govuk-breadcrumbs__list-item">
              <a
                className="govuk-breadcrumbs__link"
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateHome();
                }}
              >
                TT-CSIRT
              </a>
            </li>
            <li className="govuk-breadcrumbs__list-item" aria-current="page">
              Statistics
            </li>
          </>
        ) : (
          <li className="govuk-breadcrumbs__list-item" aria-current="page">
            TT-CSIRT Homepage
          </li>
        )}
      </ol>
    </nav>
  );
}
`;

const newStatStr = `
        ) : isStatistics ? (
          <>
            <li className="govuk-breadcrumbs__list-item" aria-current="page">
              Statistics
            </li>
          </>
        ) : null}
      </ol>
    </nav>
  );
}
`;

updatedCode = updatedCode.replace(statStr.trim(), newStatStr.trim());

fs.writeFileSync('src/App.tsx', updatedCode);
console.log("Breadcrumbs patched");
