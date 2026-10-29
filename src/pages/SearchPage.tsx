import { useState, useEffect } from "react";
import {
  hydrateSearchCorpus,
  searchSiteDetailed,
  siteSearchEngine,
  SearchResultItem,
  SearchResponse,
} from "@/services/siteSearch";
import { PageNavigation } from "@/components/PageNavigation";
import { Button } from "@/components/gcds/Button";

interface SearchPageProps {
  initialQuery: string;
  onNavigate: (path: string) => void;
}

export function SearchPage({ initialQuery, onNavigate }: SearchPageProps) {
  const [query, setQuery] = useState(initialQuery);
  const [exactOnly, setExactOnly] = useState(false);
  const [isHydratingAdvisories, setIsHydratingAdvisories] = useState(true);
  const [searchResponse, setSearchResponse] = useState<SearchResponse>(() =>
    searchSiteDetailed(initialQuery, { exactOnly: false })
  );

  useEffect(() => {
    setQuery(initialQuery);
    setExactOnly(false);
    setSearchResponse(searchSiteDetailed(initialQuery, { exactOnly: false }));
  }, [initialQuery]);

  useEffect(() => {
    setSearchResponse(searchSiteDetailed(query, { exactOnly }));
  }, [exactOnly]);

  useEffect(() => {
    let isMounted = true;
    void hydrateSearchCorpus().finally(() => {
      if (isMounted) setIsHydratingAdvisories(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Subscribe to background corpus hydration updates
  useEffect(() => {
    return siteSearchEngine.subscribe(() => {
      setSearchResponse(searchSiteDetailed(query, { exactOnly }));
    });
  }, [query, exactOnly]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      setExactOnly(false);
      onNavigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const results = searchResponse.results;

  const SEARCH_NAV_ITEMS = [
    { id: "search-box", label: "Search query" },
    { id: "search-results", label: `Results (${results.length})` },
    { id: "search-help", label: "Search tips" },
  ];

  return (
    <div className="govuk-grid-row app-page-grid-row">
      <PageNavigation navItems={SEARCH_NAV_ITEMS} />

      <div className="govuk-grid-column-two-thirds app-page-content">
        <h1 className="govuk-heading-xl" id="search-main-heading">
          Search TT-CSIRT
        </h1>

        <section id="search-box" aria-labelledby="search-box-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-visually-hidden" id="search-box-heading">
            Search input
          </h2>
          <form onSubmit={handleSubmit} role="search" aria-label="Site search form">
            <div className="govuk-form-group">
              <label className="govuk-label govuk-!-font-weight-bold" htmlFor="search-input-field">
                Search all services, guidance, advisories, news, and statistics
              </label>
              <div className="app-search-input-group">
                <input
                  id="search-input-field"
                  className="govuk-input app-search-input"
                  type="search"
                  name="q"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. CVE-2026-0300, incident response, ransomware, training"
                  aria-describedby="search-hint"
                />
                <Button type="submit" role="primary">
                  Search
                </Button>
              </div>
              <div id="search-hint" className="govuk-hint govuk-!-margin-top-2">
                Enter a CVE identifier, service name, threat topic, or keyword.
              </div>
            </div>
          </form>
        </section>

        <hr className="govuk-section-break govuk-section-break--m govuk-section-break--visible" />

        <section id="search-results" aria-labelledby="results-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="results-heading">
            {initialQuery ? (
              <>
                {results.length} {results.length === 1 ? "result" : "results"} for "{initialQuery}"
              </>
            ) : (
              "All searchable resources"
            )}
          </h2>

          {isHydratingAdvisories && (
            <p className="govuk-hint" role="status" aria-live="polite">
              Checking published advisories for additional matches.
            </p>
          )}

          {searchResponse.correctedQuery && !exactOnly && (
            <div className="govuk-inset-text govuk-!-margin-top-0 govuk-!-margin-bottom-4">
              <p className="govuk-body govuk-!-margin-bottom-1">
                Showing results for <strong>{searchResponse.correctedQuery}</strong>
              </p>
              <p className="govuk-body-s app-neutral-secondary govuk-!-margin-bottom-0">
                Search instead for{" "}
                <a
                  href={`/search?q=${encodeURIComponent(searchResponse.originalQuery || "")}&exact=true`}
                  className="govuk-link"
                  onClick={(e) => {
                    e.preventDefault();
                    setExactOnly(true);
                  }}
                >
                  {searchResponse.originalQuery}
                </a>
              </p>
            </div>
          )}

          {exactOnly && searchResponse.originalQuery && (
            <p className="govuk-body-s app-neutral-secondary govuk-!-margin-bottom-4">
              Showing exact matches only for "{searchResponse.originalQuery}".{" "}
              <a
                href={`/search?q=${encodeURIComponent(searchResponse.originalQuery || "")}`}
                className="govuk-link"
                onClick={(e) => {
                  e.preventDefault();
                  setExactOnly(false);
                }}
              >
                Restore spelling recovery
              </a>
            </p>
          )}

          {results.length === 0 ? (
            <div className="govuk-inset-text">
              <p className="govuk-body govuk-!-margin-bottom-1">
                <strong>{isHydratingAdvisories ? "Checking published advisories…" : "No matching documents found."}</strong>
              </p>
              <p className="govuk-body govuk-!-margin-bottom-0">
                {isHydratingAdvisories
                  ? "Search results will appear here when advisory indexing is ready."
                  : "Check your spelling, try broader keywords, or browse directly by section:"}
              </p>
              {!isHydratingAdvisories && (
                <ul className="govuk-list govuk-list--bullet govuk-!-margin-top-2 govuk-!-margin-bottom-0">
                  <li>
                    <a
                      href="/services"
                      className="govuk-link"
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate("/services");
                      }}
                    >
                      Cyber security services
                    </a>
                  </li>
                  <li>
                    <a
                      href="/advisories"
                      className="govuk-link"
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate("/advisories");
                      }}
                    >
                      Advisories &amp; alerts
                    </a>
                  </li>
                  <li>
                    <a
                      href="/guidance"
                      className="govuk-link"
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate("/guidance");
                      }}
                    >
                      Guidance hub
                    </a>
                  </li>
                </ul>
              )}
            </div>
          ) : (
            <ul className="govuk-list">
              {results.map(({ document: doc, matchedCve, matchedIdentifier }) => (
                <li key={doc.id} className="govuk-!-margin-bottom-6 app-border-bottom-divider">
                  <div className="govuk-!-margin-bottom-2">
                    <span className="govuk-body-s govuk-!-font-weight-bold govuk-!-margin-right-2 text-[#505a5f]">
                      {doc.categoryLabel || doc.type}
                    </span>
                    {matchedCve && (
                      <span className="govuk-body-s govuk-!-font-weight-bold govuk-!-margin-right-2 text-[#d4351c]">
                        Exact CVE match: {matchedCve}
                      </span>
                    )}
                    {matchedIdentifier && !matchedCve && (
                      <span className="govuk-body-s govuk-!-margin-right-2 text-[#505a5f]">
                        Identifier: {matchedIdentifier}
                      </span>
                    )}
                    {doc.publishedAt && (
                      <span className="govuk-body-s app-neutral-secondary">
                        {doc.publishedAt}
                      </span>
                    )}
                  </div>

                  <h3 className="govuk-heading-m govuk-!-margin-bottom-2">
                    <a
                      href={doc.href}
                      className="govuk-link"
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(doc.href);
                      }}
                    >
                      {doc.title}
                    </a>
                  </h3>

                  <p className="govuk-body">{doc.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="search-help" aria-labelledby="help-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-m" id="help-heading">
            Search tips
          </h2>
          <ul className="govuk-list govuk-list--bullet">
            <li>
              <strong>CVE vulnerability lookups:</strong> Type the full identifier (e.g. <code>CVE-2026-0300</code>) to jump directly to authoritative disclosures.
            </li>
            <li>
              <strong>Service enquiries:</strong> Search <code>incident response</code> or <code>proactive risk</code> to find operational support details.
            </li>
            <li>
              <strong>Threat topics:</strong> Search <code>ransomware</code>, <code>phishing</code>, or <code>scams</code> for response guides and safety tips.
            </li>
            <li>
              <strong>Institutional data:</strong> Search <code>statistics</code>, <code>strategy</code>, or <code>about</code> to access governance and threat landscape data.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
