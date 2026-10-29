import re

with open('src/styles/homepage.css', 'r') as f:
    css = f.read()

css = css.replace('}}}', '}')

# Let's find the exact block and replace it. 
# Better yet, since we have the start '.government-masthead__title-top {' and we want to replace up to the end of '.government-masthead__title-bottom' media query.

start_str = ".government-masthead__title-top {"
end_str = "/*    SERVICE IDENTITY & SERVICE-WIDE UTILITY AREA (GDS Service Header Layer)"

start_idx = css.find(start_str)
end_idx = css.find(end_str)

if start_idx != -1 and end_idx != -1:
    new_css = css[:start_idx] + """
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

.govuk-header__homepage-link:focus .government-masthead__title-top,
.govuk-header__homepage-link:focus .government-masthead__title-bottom,
.govuk-header__homepage-link:focus .govuk-header__product-name {
  color: #0b0c0c !important;
}

/* Authentic GDS Header Product Name */
""" + css[end_idx:]
    with open('src/styles/homepage.css', 'w') as f:
        f.write(new_css)
    print("Success")
else:
    print(f"Could not find indices. Start: {start_idx}, End: {end_idx}")

