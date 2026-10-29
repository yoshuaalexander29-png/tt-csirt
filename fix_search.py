import re

with open('src/styles/site-search.scss', 'r') as f:
    scss = f.read()

# Change border from white to black
scss = scss.replace('border: $govuk-border-width-form-element solid govuk-colour("white");', 
                    'border: $govuk-border-width-form-element solid govuk-colour("black");\n  background-color: govuk-colour("white");\n  color: govuk-colour("black");')

# The original has background-image: _search-icon($colour: govuk-colour("black", $variant: "tint-25"));
# tint-25 means 75% white. Let's make it dark grey for better contrast on white background.
scss = scss.replace('_search-icon($colour: govuk-colour("black", $variant: "tint-25"))', 
                    '_search-icon($colour: govuk-colour("black"))')

scss = scss.replace('color: govuk-colour("black", $variant: "tint-25");', 
                    'color: govuk-colour("dark-grey");')

# Menu overlay border-top
scss = scss.replace('border-top: govuk-colour("white") solid govuk-spacing(1);',
                    'border-top: govuk-colour("black") solid govuk-spacing(1);')

with open('src/styles/site-search.scss', 'w') as f:
    f.write(scss)
