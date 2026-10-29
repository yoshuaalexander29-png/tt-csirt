import re

with open('src/styles/homepage.css', 'r') as f:
    css = f.read()

# Find the start of the block
start_idx = css.find('.government-lockup {')
end_idx = css.find('/*    SERVICE IDENTITY & SERVICE-WIDE UTILITY AREA (GDS Service Header Layer)')

if start_idx != -1 and end_idx != -1:
    new_css = css[:start_idx] + """
.government-lockup {
  display: inline-flex;
  vertical-align: top;
  margin-top: -3px;
  margin-right: 10px;
  align-items: center;
  gap: 10px;
  min-width: 0;
  width: fit-content;
  max-width: 100%;
}
@media (min-width: 23.4375em) {
  .government-lockup {
    gap: 14px;
  }
}
@media (min-width: 40.0625em) {
  .government-lockup {
    gap: 18px;
  }
}

.government-masthead__emblem-slot {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-shrink: 0;
}

.government-masthead__coat {
  height: 68px;
  width: 68px;
  flex-shrink: 0;
  display: block;
  background-color: #ffffff;
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
}
@media (min-width: 23.4375em) {
  .government-masthead__coat {
    height: 78px;
    width: 78px;
  }
}
@media (min-width: 40.0625em) {
  .government-masthead__coat {
    height: 96px;
    width: 96px;
  }
}

.government-masthead__titles {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  min-width: 0;
  max-width: 100%;
  flex: 1 1 auto;
  word-wrap: break-word;
}

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
    print("Replaced successfully")
else:
    print("Could not find start/end")
