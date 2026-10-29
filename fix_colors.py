import re

with open('src/styles/homepage.css', 'r') as f:
    css = f.read()

# 1. Remove the !important block for .govuk-header
css = re.sub(r'\.govuk-header\s*\{\s*background-color:\s*#[0-9a-fA-F]+\s*!important;\s*border-bottom:\s*0\s*!important;[\s\S]*?\}', '', css)

# 2. Update the variable block for .govuk-header
css = re.sub(r'--govuk-brand-colour:\s*#[0-9a-fA-F]+;', '--govuk-brand-colour: #c53838;', css)

# 3. Update the variable block for .govuk-service-navigation
css = re.sub(r'--govuk-surface-background-colour:\s*#[0-9a-fA-F]+;', '--govuk-surface-background-colour: #ffffff;', css)

with open('src/styles/homepage.css', 'w') as f:
    f.write(css)

