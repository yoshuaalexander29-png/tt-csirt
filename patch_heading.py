import re

with open('src/pages/AdvisoriesPage.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '''        <h1
          ref={headingRef}
          tabIndex={-1}
          className="govuk-heading-xl"
        >
          Cyber security advisories
        </h1>
        <p className="govuk-body-l">
          TT-CSIRT publishes cyber security advisories to help individuals and organisations understand current cyber threats, identify risks and take appropriate action.
        </p>
        <p className="govuk-body">
          All advisories are published under the authority of the Ministry of Homeland Security as part of the National Cyber Security Incident Response framework.
        </p>''',
    '''        <h1
          ref={headingRef}
          tabIndex={-1}
          className="govuk-heading-xl"
          style={{ marginBottom: "24px" }}
        >
          Cyber security advisories
        </h1>
        <div style={{ marginBottom: "48px" }}>
          <p className="govuk-body-l" style={{ marginBottom: "16px", maxWidth: "42em" }}>
            TT-CSIRT publishes cyber security advisories to help individuals and organisations understand current cyber threats, identify risks and take appropriate action.
          </p>
          <p className="govuk-body" style={{ marginBottom: 0, maxWidth: "42em", color: "#505a5f" }}>
            All advisories are published under the authority of the Ministry of Homeland Security as part of the National Cyber Security Incident Response framework.
          </p>
        </div>'''
)

with open('src/pages/AdvisoriesPage.tsx', 'w') as f:
    f.write(content)

print("Heading patched")
