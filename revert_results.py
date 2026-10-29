import re

with open('src/pages/AdvisoriesPage.tsx', 'r') as f:
    content = f.read()

start_marker = '<div>\n                  <div style={{ paddingBottom: "16px"'
end_marker = '</ul>\n                </div>\n              )}'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker) + len(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find results markers to revert")
    exit(1)

original_results = """<div className="finder-results js-finder-results">
                  <ul className="gem-c-document-list" aria-label="Cyber security advisories list">
                    {displayedAdvisories.map((advisory) => {
                      const targetSlug = advisory.slug || String(advisory.id);
                      return (
                        <li
                          className="gem-c-document-list__item"
                          key={advisory.id}
                        >
                          <div className="gem-c-document-list__item-title">
                            <a
                              href={`/advisories/${targetSlug}`}
                              className="govuk-link gem-print-force-link-styles govuk-link--no-underline"
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
                          </div>
                          <p className="gem-c-document-list__item-description">
                            {advisory.displaySummary}
                          </p>
                          <ul className="gem-c-document-list__item-metadata" aria-label="Metadata">
                            <li className="gem-c-document-list__attribute">
                              {advisory.categoryName || "Advisory"}
                            </li>
                            <li className="gem-c-document-list__attribute">
                              <time dateTime={advisory.rawDate || advisory.date}>{advisory.date}</time>
                            </li>
                          </ul>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}"""

content = content[:start_idx] + original_results + content[end_idx:]

with open('src/pages/AdvisoriesPage.tsx', 'w') as f:
    f.write(content)

print("Results list reverted successfully")
