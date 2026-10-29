with open("src/App.tsx", "r") as f:
    lines = f.readlines()

start = -1
end = -1
for i, line in enumerate(lines):
    if line.startswith("function Breadcrumbs("):
        start = i
    if line.startswith("function ServiceIdentity("):
        end = i

if start != -1 and end != -1:
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
}
"""
    lines[start:end] = [replacement + "\n"]
    with open("src/App.tsx", "w") as f:
        f.writelines(lines)
    print("Patched breadcrumbs")
else:
    print(f"Not found: {start} {end}")
