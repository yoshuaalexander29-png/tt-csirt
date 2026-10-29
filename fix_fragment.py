import re

with open('src/pages/AdvisoriesPage.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    """<style dangerouslySetInnerHTML={{__html: `
      @media (max-width: 40.0625em) {
        .advisories-grid-row {
          display: flex;
          flex-direction: column-reverse;
        }
      }
    `}} />
    <div className="govuk-grid-row app-page-grid-row advisories-grid-row">""",
    """<>
    <style dangerouslySetInnerHTML={{__html: `
      @media (max-width: 40.0625em) {
        .advisories-grid-row {
          display: flex;
          flex-direction: column-reverse;
        }
      }
    `}} />
    <div className="govuk-grid-row app-page-grid-row advisories-grid-row">"""
)

# And I also need to close the fragment at the end of the return
end_div = '    </div>\n  );\n}'
content = content.replace(end_div, '    </div>\n    </>\n  );\n}')

with open('src/pages/AdvisoriesPage.tsx', 'w') as f:
    f.write(content)

print("Fragment fixed")
