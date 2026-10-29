import re

with open('src/styles/mobile-navigation-section.scss', 'r') as f:
    scss = f.read()

scss = scss.replace('border-left: solid 5px govuk-functional-colour("link");', 'border-left: solid 5px #ffffff;')

with open('src/styles/mobile-navigation-section.scss', 'w') as f:
    f.write(scss)
