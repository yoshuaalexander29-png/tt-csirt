const fs = require('fs');

let file = fs.readFileSync('src/App.tsx', 'utf-8');

const oldHeaderStr = file.substring(file.indexOf('<header'), file.indexOf('</header>') + 9);
const newHeaderStr = `<header className="govuk-generic-header" role="banner" data-module="govuk-generic-header">
        <div className="govuk-generic-header__container govuk-width-container">
          <div className="govuk-generic-header__logo">
            <a
              href="/"
              className="govuk-generic-header__homepage-link"
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
                    Government of the<br />Republic of Trinidad and Tobago
                  </div>
                  <div className="government-masthead__title-bottom">
                    Ministry of Homeland Security
                  </div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </header>`;
file = file.replace(oldHeaderStr, newHeaderStr);

const oldNavSectionStr = file.substring(file.indexOf('<section\n        ref={navRef}\n        className="govuk-service-navigation"'), file.indexOf('</section>') + 10);
const newNavSectionStr = `<section
        ref={navRef}
        className="govuk-service-navigation"
        data-module="govuk-service-navigation"
        aria-label="Service information"
      >
        <div className="govuk-width-container govuk-service-navigation__inlining-container">
          <div className="govuk-service-navigation__container">
            <span className="govuk-service-navigation__service-name">
              <a href="/" className="govuk-service-navigation__link" >
                TT-CSIRT
              </a>
            </span>
            
            <nav aria-label="Menu" className="govuk-service-navigation__wrapper">
              <button
                type="button"
                className="govuk-service-navigation__toggle govuk-js-service-navigation-toggle"
                aria-controls="navigation"
                hidden
                aria-hidden="true"
              >
                Menu
              </button>
              <ul
                className="govuk-service-navigation__list"
                id="navigation"
              >
                <li className={\`govuk-service-navigation__item\${isHome ? " govuk-service-navigation__item--active" : ""}\`}>
                  <a
                    className="govuk-service-navigation__link"
                    href="/"
                    aria-current={isHome ? "page" : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate("/");
                    }}
                  >
                    {isHome ? <strong className="govuk-service-navigation__active-fallback">Home</strong> : "Home"}
                  </a>
                </li>
                
                <li className={\`govuk-service-navigation__item\${isAdvisoriesPage ? " govuk-service-navigation__item--active" : ""}\`}>
                  <a
                    className="govuk-service-navigation__link"
                    href="/advisories" onClick={(e) => { e.preventDefault(); onNavigate("/advisories"); }}
                    data-module="app-mobile-navigation-section"
                    aria-current={isAdvisoriesPage ? "true" : undefined}
                  >
                    {isAdvisoriesPage ? <strong className="govuk-service-navigation__active-fallback">Advisories</strong> : "Advisories"}
                    <template><ul className="app-mobile-navigation-section__list app-mobile-navigation-section__subnav" hidden>
                        <li className="app-mobile-navigation-section__item">
                          <a className="govuk-service-navigation__link" href="/advisories" onClick={(e) => { e.preventDefault(); onNavigate("/advisories"); }} >
                            Advisories overview
                          </a>
                        </li>
                        <li className="app-mobile-navigation-section__item">
                          <a className="govuk-service-navigation__link" href="#alerts" onClick={(e) => { e.preventDefault(); onNavigate("/", "alerts"); }} >
                            Alerts &amp; Advisories
                          </a>
                        </li>
                        <li className="app-mobile-navigation-section__item">
                          <a className="govuk-service-navigation__link" href="#vulnerabilities" onClick={(e) => { e.preventDefault(); onNavigate("/", "vulnerabilities"); }} >
                            Vulnerability Coordination
                          </a>
                        </li>
                      </ul></template>
                  </a>
                </li>
                
                <li className={\`govuk-service-navigation__item\${isStatistics ? " govuk-service-navigation__item--active" : ""}\`}>
                  <a
                    className="govuk-service-navigation__link"
                    href="/statistics"
                    aria-current={isStatistics ? "page" : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate("/statistics");
                    }}
                  >
                    {isStatistics ? <strong className="govuk-service-navigation__active-fallback">Statistics</strong> : "Statistics"}
                  </a>
                </li>
                
              </ul>
            </nav>
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

file = file.replace(oldNavSectionStr, newNavSectionStr);
fs.writeFileSync('src/App.tsx', file);

console.log('updated src/App.tsx');
