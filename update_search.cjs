const fs = require('fs');
let code = fs.readFileSync('src/pages/AdvisoriesPage.tsx', 'utf-8');

const searchStr = `        {advisories.length > 0 && (
          <form
            role="search"
            aria-label="Search and filter advisories"
            onSubmit={(e) => e.preventDefault()}
            noValidate
            className="govuk-!-margin-bottom-6 govuk-!-margin-top-6"
          >
            <div className="govuk-form-group">
              <label className="govuk-label govuk-label--m" htmlFor="advisories-search-input">
                Search advisories
              </label>
              <div id="advisories-search-hint" className="govuk-hint">
                Search by keyword, vulnerability or product name
              </div>
              <input
                className="govuk-input"
                id="advisories-search-input"
                name="search"
                type="search"
                aria-describedby="advisories-search-hint"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. SharePoint"
                spellCheck={false}
              />
            </div>

            <div className="govuk-form-group">
              <label className="govuk-label" htmlFor="advisory-type">
                Filter by
              </label>
              <select
                className="govuk-select"
                id="advisory-type"
                name="type"
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as "all" | "Advisory" | "Alert")}
              >
                <option value="all">All</option>
                <option value="Advisory">Advisory</option>
                <option value="Alert">Alert</option>
              </select>
            </div>
          </form>
        )}`;

const newSearchStr = `        {advisories.length > 0 && (
          <form
            role="search"
            aria-label="Search and filter advisories"
            onSubmit={(e) => e.preventDefault()}
            noValidate
            className="govuk-!-margin-bottom-8 govuk-!-margin-top-6"
            style={{ backgroundColor: "#f3f2f1", padding: "24px", border: "1px solid #b1b4b6" }}
          >
            <div className="govuk-form-group" style={{ marginBottom: "24px" }}>
              <label className="govuk-label govuk-label--m" htmlFor="advisories-search-input">
                Search advisories
              </label>
              <div id="advisories-search-hint" className="govuk-hint">
                Search by keyword, vulnerability or product name
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <input
                  className="govuk-input"
                  id="advisories-search-input"
                  name="search"
                  type="search"
                  aria-describedby="advisories-search-hint"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. SharePoint"
                  spellCheck={false}
                  style={{ maxWidth: "400px" }}
                />
                <button
                  type="submit"
                  className="govuk-button"
                  data-module="govuk-button"
                  style={{ marginBottom: 0 }}
                >
                  Search
                </button>
              </div>
            </div>

            <div style={{ paddingTop: "16px", borderTop: "1px solid #b1b4b6" }}>
              <h3 className="govuk-heading-s" style={{ marginBottom: "16px" }}>Filter by</h3>
              <div className="govuk-grid-row" style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginLeft: 0, marginRight: 0 }}>
                <div className="govuk-form-group" style={{ marginBottom: 0, flex: "1", minWidth: "180px" }}>
                  <label className="govuk-label" htmlFor="filter-severity">
                    Severity
                  </label>
                  <select
                    className="govuk-select"
                    id="filter-severity"
                    name="severity"
                    style={{ width: "100%" }}
                  >
                    <option value="all">All severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                
                <div className="govuk-form-group" style={{ marginBottom: 0, flex: "1", minWidth: "180px" }}>
                  <label className="govuk-label" htmlFor="advisory-type">
                    Topic
                  </label>
                  <select
                    className="govuk-select"
                    id="advisory-type"
                    name="type"
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value as "all" | "Advisory" | "Alert")}
                    style={{ width: "100%" }}
                  >
                    <option value="all">All topics</option>
                    <option value="Advisory">Advisory</option>
                    <option value="Alert">Alert</option>
                  </select>
                </div>

                <div className="govuk-form-group" style={{ marginBottom: 0, flex: "1", minWidth: "180px" }}>
                  <label className="govuk-label" htmlFor="filter-date">
                    Date
                  </label>
                  <select
                    className="govuk-select"
                    id="filter-date"
                    name="date"
                    style={{ width: "100%" }}
                  >
                    <option value="all">All time</option>
                    <option value="past-week">Past week</option>
                    <option value="past-month">Past month</option>
                    <option value="past-year">Past year</option>
                  </select>
                </div>
              </div>
            </div>
          </form>
        )}`;

if (code.includes(searchStr.trim())) {
    code = code.replace(searchStr.trim(), newSearchStr.trim());
    fs.writeFileSync('src/pages/AdvisoriesPage.tsx', code);
    console.log("Search area patched");
} else {
    console.log("Search area not found in code");
}
