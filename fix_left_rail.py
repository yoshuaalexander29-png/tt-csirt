import re

with open('src/pages/AdvisoriesPage.tsx', 'r') as f:
    content = f.read()

# Replace hardcoded font sizes in the left column with GDS classes
content = content.replace(
    '<h2 className="govuk-heading-s" style={{ marginBottom: "16px", fontSize: "24px" }}>',
    '<h2 className="govuk-heading-m" style={{ marginBottom: "16px" }}>'
)
content = content.replace(
    '<p className="govuk-body" style={{ marginBottom: "16px", fontSize: "19px", lineHeight: "1.31578" }}>',
    '<p className="govuk-body" style={{ marginBottom: "16px" }}>'
)
content = content.replace(
    '<p className="govuk-body" style={{ marginBottom: 0, fontSize: "19px" }}>',
    '<p className="govuk-body" style={{ marginBottom: 0 }}>'
)
content = content.replace(
    '<p className="govuk-body" style={{ marginBottom: "24px", fontSize: "19px", lineHeight: "1.31578" }}>',
    '<p className="govuk-body" style={{ marginBottom: "24px" }}>'
)
content = content.replace(
    '<strong className="govuk-!-font-weight-bold" style={{ display: "block", marginBottom: "4px", fontSize: "19px" }}>',
    '<strong className="govuk-body govuk-!-font-weight-bold" style={{ display: "block", marginBottom: "4px" }}>'
)
content = content.replace(
    '<a href="tel:+18686257937" className="govuk-link" style={{ fontSize: "19px" }}>',
    '<a href="tel:+18686257937" className="govuk-link govuk-body" style={{ marginBottom: 0 }}>'
)
content = content.replace(
    '<a href="mailto:contacts@ttcsirt.gov.tt" className="govuk-link" style={{ fontSize: "19px" }}>',
    '<a href="mailto:contacts@ttcsirt.gov.tt" className="govuk-link govuk-body" style={{ marginBottom: 0 }}>'
)
content = content.replace(
    '<ul className="govuk-list govuk-body" style={{ fontSize: "19px" }}>',
    '<ul className="govuk-list govuk-body">'
)

with open('src/pages/AdvisoriesPage.tsx', 'w') as f:
    f.write(content)

print("Left rail text patched")
