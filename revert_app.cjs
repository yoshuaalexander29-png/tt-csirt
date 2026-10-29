const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const searchHtml = `
          <div className="app-site-search" data-module="app-search">
            <form onSubmit={handleSearch} role="search">
              <label htmlFor="app-site-search__input" className="govuk-visually-hidden">
                Search TT-CSIRT
              </label>
              <div className="app-site-search__wrapper">
                <input
                  className="app-site-search__input"
                  id="app-site-search__input"
                  name="keywords"
                  type="search"
                  placeholder="Search TT-CSIRT"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </form>
          </div>
`;

// 1. Remove searchHtml from ServiceNav
const serviceNavEndRegex = /<\/nav>\s*<\/div>\s*<div className="app-site-search"[\s\S]*?<\/form>\s*<\/div>\s*<\/div>\s*<\/section>/;
const oldServiceNavEnd = `            </nav>
          </div>
        </div>
      </section>`;
code = code.replace(serviceNavEndRegex, oldServiceNavEnd);

// 2. Add product name and searchHtml to Header
const newHeader = `<header className="govuk-header govuk-header--full-width-border" role="banner" data-module="govuk-header">
        <div className="govuk-header__container govuk-width-container app-header-container">
          <div className="govuk-header__logo app-header-logo">
            <a
              href="/"
              className="govuk-header__homepage-link"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("/");
              }}
            >
              <div className="government-lockup">
                <div className="government-masthead__emblem-slot">
                  <div
                    className="government-masthead__coat"
                    role="img"
                    aria-label="Coat of Arms of the Republic of Trinidad and Tobago"
                    style={{
                      WebkitMaskImage: \`url(\${coatOfArms})\`,
                      maskImage: \`url(\${coatOfArms})\`,
                    }}
                  />
                </div>
                <div className="government-masthead__titles">
                  <div className="government-masthead__title-top">
                    Government of the
                    <br />
                    Republic of Trinidad and Tobago
                  </div>
                  <div className="government-masthead__divider" />
                  <div className="government-masthead__title-bottom">
                    Ministry of Homeland Security
                  </div>
                </div>
              </div>
              <span className="govuk-header__product-name">
                TT-CSIRT
              </span>
            </a>
          </div>
${searchHtml}
        </div>
      </header>`;

const regexHeader = /<header[\s\S]*?<\/header>/;
code = code.replace(regexHeader, newHeader);

// 3. Remove product name from ServiceNav
const serviceNameRegex = /<span className="govuk-service-navigation__service-name">[\s\S]*?<\/span>/;
code = code.replace(serviceNameRegex, '');

fs.writeFileSync('src/App.tsx', code);
