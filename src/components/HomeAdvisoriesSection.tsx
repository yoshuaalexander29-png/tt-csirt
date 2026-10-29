import { useState, useEffect, useRef, useCallback } from "react";
import {
  getResilientAdvisories,
  ResilientAdvisoriesResult,
  getSynchronousMemoryListEntry,
  prefetchAdvisoryDetail,
  prefetchTopAdvisories,
  PREFETCH_CONFIG,
} from "../services/advisoryCache";
import { Advisory } from "../services/advisories";

interface HomeAdvisoriesSectionProps {
  onNavigateToAdvisories: () => void;
  onNavigateToDetail?: (idOrSlug: string) => void;
}

export function HomeAdvisoriesSection({
  onNavigateToAdvisories,
  onNavigateToDetail,
}: HomeAdvisoriesSectionProps) {
  const initialMem =
    getSynchronousMemoryListEntry("page=1&perPage=5") ||
    getSynchronousMemoryListEntry("page=1&perPage=10") ||
    getSynchronousMemoryListEntry("corpus_all") ||
    getSynchronousMemoryListEntry("page=1&perPage=100");

  const [advisories, setAdvisories] = useState<Advisory[]>(() =>
    initialMem?.advisories ? initialMem.advisories.slice(0, 5) : []
  );
  const [showUnavailable, setShowUnavailable] = useState<boolean>(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePrefetchHover = useCallback((idOrSlug: string | number) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      prefetchAdvisoryDetail(idOrSlug, "high");
    }, PREFETCH_CONFIG.HOVER_DEBOUNCE_MS);
  }, []);

  const handleCancelPrefetchHover = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  // Clean up any pending hover timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  // Idle background prefetch for top visible advisory details once homepage list is populated
  useEffect(() => {
    if (advisories.length > 0) {
      prefetchTopAdvisories(advisories, PREFETCH_CONFIG.TOP_CANDIDATES_LIMIT);
    }
  }, [advisories]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    let blankTimer: ReturnType<typeof setTimeout> | null = null;
    if (advisories.length === 0) {
      blankTimer = setTimeout(() => {
        if (isMounted && advisories.length === 0) setShowUnavailable(true);
      }, 5000);
    }

    const handleUpdate = (updated: ResilientAdvisoriesResult) => {
      if (!isMounted) return;
      if (blankTimer) clearTimeout(blankTimer);

      if (updated.hasUsableContent && updated.advisories.length > 0) {
        setAdvisories(updated.advisories.slice(0, 5));
        setShowUnavailable(false);
      } else if (advisories.length === 0) {
        setShowUnavailable(true);
      }
    };

    getResilientAdvisories({
      page: 1,
      perPage: 5,
      signal: controller.signal,
      onUpdate: handleUpdate,
    }).then((initial) => {
      if (!isMounted) return;
      handleUpdate(initial);
    });

    return () => {
      isMounted = false;
      if (blankTimer) clearTimeout(blankTimer);
      controller.abort();
    };
  }, []);

  return (
    <section id="cyber-security-advisories" aria-labelledby="home-advisories-heading" className="govuk-!-margin-bottom-9">
      <h2 className="govuk-heading-l" id="home-advisories-heading">
        Cyber security advisories
      </h2>
      <p className="govuk-body">
        TT-CSIRT publishes cyber security advisories to help individuals and organisations understand current cyber threats, identify risks and take appropriate action. You can{" "}
        <a
          href="/advisories"
          className="govuk-link"
          onClick={(e) => {
            e.preventDefault();
            onNavigateToAdvisories();
          }}
        >
          view all advisories on the dedicated Advisories page
        </a>{" "}
          for information about threats, vulnerabilities and security issues.
      </p>

      {showUnavailable && advisories.length === 0 && (
        <div className="govuk-inset-text">
          <p className="govuk-body">
            Advisory information is currently unavailable. You can visit the{" "}
            <a
              href="/advisories"
              className="govuk-link"
              onClick={(e) => {
                e.preventDefault();
                onNavigateToAdvisories();
              }}
            >
              advisories page
            </a>{" "}
            or visit the authoritative TT-CSIRT portal directly.
          </p>
        </div>
      )}

      {advisories.length > 0 && (
        <div className="govuk-!-margin-top-6">
        <ul className="gem-c-document-list" aria-label="Recent advisories list">
          {advisories.map((advisory) => {
            const targetSlug = advisory.slug || String(advisory.id);
            return (
              <li className="gem-c-document-list__item" key={advisory.id || advisory.title}>
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
                      } else if (onNavigateToAdvisories) {
                        e.preventDefault();
                        onNavigateToAdvisories();
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
      )}

      <div className="govuk-!-margin-top-6">
        <p className="govuk-body">
          Receive the latest TT-CSIRT advisories and alerts directly to your inbox.{" "}
          <a
            href="mailto:contacts@ttcsirt.gov.tt?subject=Subscribe%20to%20TT-CSIRT%20Advisories%20and%20Alerts"
            className="govuk-link"
          >
            Subscribe to email updates
          </a>.
        </p>
      </div>
    </section>
  );
}
