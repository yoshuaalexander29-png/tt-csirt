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

// 1. Remove the original search block
code = code.replace(/<div className="app-site-search"[\s\S]*?<\/form>\s*<\/div>/, '');

// 2. Remove the original product-name
code = code.replace(/<span className="govuk-header__product-name">\s*TT-CSIRT\s*<\/span>/, '');

// 3. Remove .app-header-container
code = code.replace(/govuk-header__container govuk-width-container app-header-container/, 'govuk-header__container govuk-width-container');

// 4. Remove .app-width-container from ServiceNavigation
code = code.replace(/<div className="govuk-width-container app-width-container">/, '<div className="govuk-width-container">');

// 5. Inject product name and search into Service Navigation
const targetServiceNavStart = `<div className="govuk-service-navigation__container">`;
const newServiceNavStart = `<div className="govuk-service-navigation__container">
            <span className="govuk-service-navigation__service-name">
              <a href="/" className="govuk-service-navigation__link" onClick={(e) => { e.preventDefault(); onNavigate("/"); }}>
                TT-CSIRT
              </a>
            </span>`;
code = code.replace(targetServiceNavStart, newServiceNavStart);

const targetServiceNavEnd = `</nav>
          </div>
        </div>
      </section>`;
const newServiceNavEnd = `</nav>
          </div>
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
        </div>
      </section>`;
code = code.replace(targetServiceNavEnd, newServiceNavEnd);

// 6. Remove app-service-navigation__wrapper from nav
code = code.replace(/className="govuk-service-navigation__wrapper app-service-navigation__wrapper"/, 'className="govuk-service-navigation__wrapper"');

fs.writeFileSync('src/App.tsx', code);
