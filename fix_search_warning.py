import re
with open('src/styles/site-search.scss', 'r') as f:
    scss = f.read()

scss = scss.replace('color: govuk-colour("dark-grey");', 'color: #505a5f;')
scss = scss.replace('color: govuk-colour("black", $variant: "tint-80");', 'color: #b1b4b6;')

with open('src/styles/site-search.scss', 'w') as f:
    f.write(scss)
