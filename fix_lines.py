with open('src/styles/homepage.css', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False

for i, line in enumerate(lines):
    if '.government-masthead__title-top {' in line:
        skip = True
        
        # Inject our correct css
        new_lines.append("""
.government-masthead__title-top {
  margin: 0;
  padding: 0;
  font-family: var(--font-family-sans, "GDS Transport", Arial, sans-serif);
  font-size: 0.875rem; /* 14px */
  line-height: 1.25;
  font-weight: 400; /* Regular */
  color: #ffffff;
  text-align: left;
  word-break: normal;
  overflow-wrap: break-word;
  opacity: 0.9;
}
@media (min-width: 23.4375em) {
  .government-masthead__title-top {
    font-size: 0.9375rem; /* 15px */
  }
}
@media (min-width: 40.0625em) {
  .government-masthead__title-top {
    font-size: 1.0625rem; /* 17px */
    line-height: 1.25;
  }
}

.government-masthead__divider {
  display: none;
}

.government-masthead__title-bottom {
  margin: 0;
  padding: 0;
  font-family: var(--font-family-sans, "GDS Transport", Arial, sans-serif);
  font-size: 1rem; /* 16px */
  line-height: 1.25;
  font-weight: 700; /* Bold */
  color: #ffffff;
  text-align: left;
  word-break: normal;
  overflow-wrap: break-word;
}
@media (min-width: 23.4375em) {
  .government-masthead__title-bottom {
    font-size: 1.125rem; /* 18px */
  }
}
@media (min-width: 40.0625em) {
  .government-masthead__title-bottom {
    font-size: 1.25rem; /* 20px */
    line-height: 1.25;
  }
}
""")
    elif '.govuk-header__homepage-link:focus .government-masthead__title-top' in line:
        skip = False
        
    if not skip:
        new_lines.append(line)

with open('src/styles/homepage.css', 'w') as f:
    f.writelines(new_lines)
