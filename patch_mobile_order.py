import re

with open('src/pages/AdvisoriesPage.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '<div className="govuk-grid-row app-page-grid-row">',
    '<div className="govuk-grid-row app-page-grid-row" style={{ display: "flex", flexDirection: "column-reverse" }} id="advisories-grid">'
)

with open('src/pages/AdvisoriesPage.tsx', 'w') as f:
    f.write(content)

print("Mobile order patched")
