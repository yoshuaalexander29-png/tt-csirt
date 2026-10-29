import re

with open('src/styles/homepage.css', 'r') as f:
    content = f.read()

# I want to add mobile specific styles for app-page-content to make its border touch the edges
# and remove any gap at the top.
# On mobile, we can use margin/padding negative hacks or pseudo elements.
mobile_css = """
@media (max-width: 40.0625em) {
  .app-page-content {
    position: relative;
    padding-top: 24px;
    padding-bottom: 32px;
  }
  /* Extend top border to screen edges on mobile */
  .app-page-content::before {
    content: "";
    position: absolute;
    top: -1px;
    left: -100vw;
    width: 300vw;
    border-top: 1px solid #b1b4b6;
    pointer-events: none;
    z-index: 1;
  }
}
"""

if "Extend top border to screen edges on mobile" not in content:
    content += mobile_css

with open('src/styles/homepage.css', 'w') as f:
    f.write(content)

print("Mobile border CSS added")
