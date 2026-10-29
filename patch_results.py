import re

with open('src/pages/AdvisoriesPage.tsx', 'r') as f:
    content = f.read()

start_marker = '<div className="finder-results js-finder-results">'
end_marker = '</ul>\n                </div>\n              )}'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker) + len(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find results markers")
    exit(1)

new_results = """<div>
                  <div style={{ paddingBottom: "16px", borderBottom: "1px solid #b1b4b6", marginBottom: "24px", marginTop: "16px" }}>
                    <span className="govuk-body" style={{ color: "#505a5f" }}>
                      {allFilteredAdvisories.length} {allFilteredAdvisories.length === 1 ? 'advisory' : 'advisories'}
                    </span>
                  </div>
                  <ul className="govuk-list" aria-label="Cyber security advisories list">
                    {displayedAdvisories.map((advisory) => {
                      const targetSlug = advisory.slug || String(advisory.id);
                      
                      const isHighSeverity = advisory.categoryName === "Alert";
                      
                      return (
                        <li key={advisory.id} style={{ paddingBottom: "24px", marginBottom: "24px", borderBottom: "1px solid #b1b4b6" }}>
                          <div style={{ marginBottom: "8px" }}>
                            {isHighSeverity ? (
                              <strong className="govuk-tag govuk-tag--red" style={{ marginRight: "16px", fontSize: "14px", fontWeight: 700, letterSpacing: "1px" }}>
                                CRITICAL
                              </strong>
                            ) : (
                              <strong className="govuk-tag govuk-tag--blue" style={{ marginRight: "16px", fontSize: "14px", fontWeight: 700, letterSpacing: "1px" }}>
                                ADVISORY
                              </strong>
                            )}
                          </div>
                          <h3 className="govuk-heading-m" style={{ marginBottom: "8px" }}>
                            <a
                              href={`/advisories/${targetSlug}`}
                              className="govuk-link"
                              onMouseEnter={() => handlePrefetchHover(targetSlug)}
                              onMouseLeave={handleCancelPrefetchHover}
                              onFocus={() => prefetchAdvisoryDetail(targetSlug, "high")}
                              onTouchStart={() => prefetchAdvisoryDetail(targetSlug, "high")}
                              onClick={(e) => {
                                if (onNavigateToDetail) {
                                  e.preventDefault();
                                  onNavigateToDetail(targetSlug);
                                }
                              }}
                            >
                              {advisory.title}
                            </a>
                          </h3>
                          <div className="govuk-body-s" style={{ color: "#505a5f", marginBottom: "8px" }}>
                            <time dateTime={advisory.rawDate || advisory.date}>{advisory.date}</time>
                          </div>
                          <p className="govuk-body" style={{ marginBottom: advisory.cveList?.length ? "12px" : "0", maxWidth: "42em" }}>
                            {advisory.displaySummary}
                          </p>
                          {advisory.cveList && advisory.cveList.length > 0 && (
                            <div className="govuk-body-s" style={{ color: "#505a5f", marginBottom: "0", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                              {advisory.cveList.slice(0, 3).map((cve) => (
                                <span key={cve} style={{ background: "#f3f2f1", padding: "2px 6px", border: "1px solid #b1b4b6" }}>{cve}</span>
                              ))}
                              {advisory.cveList.length > 3 && (
                                <span>+{advisory.cveList.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}"""

content = content[:start_idx] + new_results + content[end_idx:]

with open('src/pages/AdvisoriesPage.tsx', 'w') as f:
    f.write(content)

print("Results list patched successfully")
