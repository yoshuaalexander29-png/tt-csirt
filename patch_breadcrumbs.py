import re

with open("src/App.tsx", "r") as f:
    content = f.read()

replacement = """function Breadcrumbs({ currentPath, onNavigateHome, onNavigateAdvisories }: BreadcrumbsProps) {
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
        </li>
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
              National cyber incident statistics
            </li>
          </>
        ) : (
          <li className="govuk-breadcrumbs__list-item" aria-current="page">
            TT-CSIRT
          </li>
        )}
      </ol>
    </nav>
  );
}"""

# regex from function Breadcrumbs to its closing brace
pattern = re.compile(r'function Breadcrumbs\(.*?\)\s*\{.*?\n\}\n(?=function ServiceIdentity)', re.DOTALL)
new_content = pattern.sub(replacement + "\n", content)

with open("src/App.tsx", "w") as f:
    f.write(new_content)
