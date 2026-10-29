with open('src/styles/homepage.css', 'r') as f:
    css = f.read()

replacement = """/* App Site Search */
@media (min-width: 40.0625em) {
  .app-site-search {
    width: 270px;
    margin-top: 0;
  }
}"""

css = css.replace("/* App Site Search */\n@media (min-width: 40.0625em) {  \n  \n}", replacement)

with open('src/styles/homepage.css', 'w') as f:
    f.write(css)
