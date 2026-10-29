import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { AlertCircle, Share2, Check } from "lucide-react";
import { AdvisoryDetail } from "@/services/advisories";
import {
  getResilientAdvisoryDetail,
  ResilientAdvisoryDetailResult,
  getSynchronousMemoryDetailEntry,
  formatFreshnessTimestamp,
  CACHE_CONFIG,
} from "@/services/advisoryCache";
import { AdvisoryContentRenderer } from "@/components/AdvisoryContentRenderer";
import { parseCanonicalAdvisoryDocument } from "@/services/advisoryDocument";
import { PageNavigation } from "@/components/PageNavigation";
import { Notice } from "@/components/Notice";
import { Button } from "@/components/gcds/Button";

interface AdvisoryDetailPageProps {
  advisoryIdOrSlug: string;
  onNavigateBack: () => void;
  onNavigate?: (path: string) => void;
}

export function AdvisoryDetailPage({
  advisoryIdOrSlug,
  onNavigateBack,
  onNavigate,
}: AdvisoryDetailPageProps) {
  const initialMem = getSynchronousMemoryDetailEntry(advisoryIdOrSlug);

  const [advisory, setAdvisory] = useState<AdvisoryDetail | null>(
    () => initialMem?.advisory || null
  );
  const [fetchedAt, setFetchedAt] = useState<number | undefined>(
    () => initialMem?.metadata.fetchedAt
  );
  const [freshnessUnconfirmed, setFreshnessUnconfirmed] = useState(false);
  const [isCheckingFreshness, setIsCheckingFreshness] = useState(false);
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [copied, setCopied] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasAdvisoryRef = useRef(Boolean(initialMem?.advisory));

  useEffect(() => {
    hasAdvisoryRef.current = Boolean(advisory);
  }, [advisory]);

  useEffect(() => {
    const mem = getSynchronousMemoryDetailEntry(advisoryIdOrSlug);

    if (mem?.advisory) {
      setAdvisory(mem.advisory);
      setFetchedAt(mem.metadata.fetchedAt);
      setShowUnavailable(false);
      hasAdvisoryRef.current = true;
    } else {
      setAdvisory(null);
      setFetchedAt(undefined);
      setShowUnavailable(false);
      hasAdvisoryRef.current = false;
    }

    setFreshnessUnconfirmed(false);
    setIsCheckingFreshness(false);
  }, [advisoryIdOrSlug]);

  useLayoutEffect(() => {
    if (typeof window !== "undefined") {
      const mainElement = document.getElementById("main-content");

      if (mainElement) {
        const rect = mainElement.getBoundingClientRect();
        const currentScrollY =
          window.pageYOffset ||
          window.scrollY ||
          (document.scrollingElement
            ? document.scrollingElement.scrollTop
            : 0) ||
          0;
        const targetTop = rect.top + currentScrollY;
        window.scrollTo(0, Math.max(0, Math.round(targetTop)));
      } else {
        window.scrollTo(0, 0);
      }
    }

    if (headingRef.current) {
      try {
        headingRef.current.focus({ preventScroll: true });
      } catch {
        headingRef.current.focus();
      }
    }
  }, [advisoryIdOrSlug]);

  const loadDetail = useCallback(
    async (forceRefresh = false) => {
      if (forceRefresh) setIsCheckingFreshness(true);

      let blankThresholdTimer: ReturnType<typeof setTimeout> | null = null;

      if (!hasAdvisoryRef.current) {
        blankThresholdTimer = setTimeout(() => {
          setShowUnavailable(true);
        }, CACHE_CONFIG.INITIAL_BLANK_THRESHOLD_MS);
      }

      const handleUpdate = (result: ResilientAdvisoryDetailResult) => {
        if (blankThresholdTimer) {
          clearTimeout(blankThresholdTimer);
          blankThresholdTimer = null;
        }

        if (result.hasUsableContent && result.advisory) {
          setAdvisory(result.advisory);
          hasAdvisoryRef.current = true;
          setShowUnavailable(false);

          if (result.fetchedAt) setFetchedAt(result.fetchedAt);
          setFreshnessUnconfirmed(result.freshnessUnconfirmed);
        } else if (!hasAdvisoryRef.current) {
          setFreshnessUnconfirmed(false);
          setShowUnavailable(true);
        }

        setIsCheckingFreshness(false);
      };

      try {
        const initialResult = await getResilientAdvisoryDetail(
          advisoryIdOrSlug,
          {
            forceRefresh,
            onUpdate: handleUpdate,
          }
        );

        handleUpdate(initialResult);
      } catch {
        if (!hasAdvisoryRef.current) setShowUnavailable(true);
        setIsCheckingFreshness(false);
      }
    },
    [advisoryIdOrSlug]
  );

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (advisory?.title) {
        document.title = `${advisory.title} - TT-CSIRT`;
      } else if (!showUnavailable) {
        document.title = "Cyber security advisory - TT-CSIRT";
      } else {
        document.title = "Advisory unavailable - TT-CSIRT";
      }
    }
  }, [advisory?.title, showUnavailable]);

  const handleCopyLink = useCallback(() => {
    if (typeof window === "undefined") return;

    const finish = () => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(window.location.href).then(finish).catch(() => {});
      return;
    }

    try {
      const textArea = document.createElement("textarea");
      textArea.value = window.location.href;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
      finish();
    } catch {
      // Clipboard support is optional; do not surface an unrelated error.
    }
  }, []);

  const isAlert = advisory?.categoryName === "Alert";
  const formattedTimestamp = formatFreshnessTimestamp(fetchedAt);

  // Parse once per advisory-content identity. The canonical AST is the single
  // source of truth for both Contents and advisory body rendering.
  const canonicalDoc = useMemo(
    () =>
      parseCanonicalAdvisoryDocument(
        advisory?.contentHtml || "",
        advisory?.title || "",
        advisory?.displaySummary || advisory?.sourceExcerpt
      ),
    [
      advisory?.contentHtml,
      advisory?.title,
      advisory?.displaySummary,
      advisory?.sourceExcerpt,
    ]
  );

  const navItems = canonicalDoc.navItems;
  const defaultNavId = navItems[0]?.id || "advisory-overview";

  const handleBackClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();

      if (typeof window !== "undefined") {
        const preservedUrl = sessionStorage.getItem(
          "ttcsirt_advisories_url"
        );
        if (preservedUrl) {
          window.history.pushState({}, "", preservedUrl);
        }
      }

      onNavigateBack();
    },
    [onNavigateBack]
  );

  const handleNavigate = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
      e.preventDefault();
      if (onNavigate) onNavigate(path);
      else if (typeof window !== "undefined") window.location.href = path;
    },
    [onNavigate]
  );

  return (
    <div className="govuk-grid-row app-page-grid-row">
      <PageNavigation
        navItems={navItems}
        defaultActiveId={defaultNavId}
        ariaLabel="Advisory sections on this page"
      />

      <div className="govuk-grid-column-two-thirds app-page-content">
        <div className="govuk-!-margin-bottom-4">
          <a
            href="/advisories"
            onClick={handleBackClick}
            className="govuk-back-link"
          >
            Back to cyber security advisories
          </a>
        </div>

        <section id="advisory-header" aria-labelledby="advisory-title">
          <h1
            id="advisory-title"
            ref={headingRef}
            tabIndex={-1}
            className="govuk-heading-xl"
            style={{ overflowWrap: "break-word", wordBreak: "normal" }}
          >
            {advisory
              ? advisory.title
              : showUnavailable
              ? "Advisory information is currently unavailable."
              : "Cyber security advisory"}
          </h1>

          {advisory && freshnessUnconfirmed && (
            <Notice type="warning" title="We could not check for newer information" titleAs="h2">
              <p className="govuk-body">
                The latest information available was from {formattedTimestamp}.
              </p>
              <Button
                type="button"
                role="secondary"
                onClick={() => loadDetail(true)}
                disabled={isCheckingFreshness}
              >
                {isCheckingFreshness ? "Checking…" : "Try again"}
              </Button>
            </Notice>
          )}

          {!advisory && showUnavailable && (
            <div
              className="govuk-error-summary ttcsirt-error-callout"
              aria-labelledby="error-summary-title"
              role="alert"
              tabIndex={-1}
              
            >
              <div className="ttcsirt-error-callout__row">
                <AlertCircle size={24} className="ttcsirt-error-callout__icon"
                  aria-hidden="true"
                />

                <div>
                  <h2 className="govuk-heading-m" id="error-summary-title">
                    Advisory information is currently unavailable.
                  </h2>
                  <div className="govuk-error-summary__body">
                    <p className="govuk-body">
                      Advisory information is currently unavailable.
                    </p>
                    <Button
                      type="button"
                      role="secondary"
                      onClick={() => loadDetail(true)}
                      disabled={isCheckingFreshness}
                    >
                      {isCheckingFreshness ? "Checking…" : "Try again"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {advisory && (
            <div className="app-c-metadata">
              <dl className="app-c-metadata__list">
                <div className="app-c-metadata__item">
                  <dt className="app-c-metadata__term">Type</dt>
                  <dd className="app-c-metadata__definition">
                    {isAlert ? "Alert" : "Advisory"}
                  </dd>
                </div>

                {advisory.referenceNumber && (
                  <div className="app-c-metadata__item">
                    <dt className="app-c-metadata__term">Reference</dt>
                    <dd className="app-c-metadata__definition">
                      {advisory.referenceNumber}
                    </dd>
                  </div>
                )}

                <div className="app-c-metadata__item">
                  <dt className="app-c-metadata__term">Published</dt>
                  <dd className="app-c-metadata__definition">
                    <time dateTime={advisory.rawDate}>{advisory.date}</time>
                  </dd>
                </div>

                {advisory.modifiedDate &&
                  advisory.modifiedDate !== advisory.date && (
                    <div className="app-c-metadata__item">
                      <dt className="app-c-metadata__term">Updated</dt>
                      <dd className="app-c-metadata__definition">
                        <time dateTime={advisory.rawModifiedDate}>
                          {advisory.modifiedDate}
                        </time>
                      </dd>
                    </div>
                  )}

                <div className="app-c-metadata__item">
                  <dt className="app-c-metadata__term">From</dt>
                  <dd className="app-c-metadata__definition">
                    TT-CSIRT, Ministry of Homeland Security
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </section>

        {advisory && (
          <>
            <article className="advisory-article" aria-label="Advisory content">
              <AdvisoryContentRenderer document={canonicalDoc} advisoryTitle={advisory.title} />
            </article>

            <div className="govuk-button-group govuk-!-margin-top-6">
              <Button
                type="button"
                role="secondary"
                onClick={handleCopyLink}
                className="advisory-share-button"
              >
                {copied ? (
                  <>
                    <Check
                      size={14}
                      color="#00703c"
                      aria-hidden="true"
                      focusable={false}
                    />
                    Link copied
                  </>
                ) : (
                  <>
                    <Share2 size={14} aria-hidden="true" focusable={false} />
                    Share advisory link
                  </>
                )}
              </Button>
            </div>

            <hr className="govuk-section-break govuk-section-break--visible govuk-!-margin-top-8 govuk-!-margin-bottom-8" />
            <section
              id="emergency-reporting"
              aria-labelledby="emergency-reporting-heading"
            >
              <h2
                className="govuk-heading-m"
                id="emergency-reporting-heading"
              >
                Emergency reporting
              </h2>
              <p className="govuk-body">
                If your organisation is experiencing an active cyber incident
                or under attack, contact TT-CSIRT immediately.
              </p>
              <p className="govuk-body">
                <a
                  href="/report-an-incident"
                  className="govuk-link"
                  onClick={(e) => handleNavigate(e, "/report-an-incident")}
                >
                  Report a cyber incident
                </a>
              </p>
            </section>

            <hr className="govuk-section-break govuk-section-break--visible govuk-!-margin-top-8 govuk-!-margin-bottom-8" />
            <section
              id="related-resources"
              aria-labelledby="related-resources-heading"
            >
              <h2
                className="govuk-heading-m"
                id="related-resources-heading"
              >
                Related resources
              </h2>
              <ul className="govuk-list govuk-body govuk-list--spaced">
                <li>
                  <a
                    href="/advisories"
                    onClick={handleBackClick}
                    className="govuk-link"
                  >
                    All cyber security advisories
                  </a>
                </li>
                <li>
                  <a
                    href="https://ttcsirt.gov.tt/category/security-advisories/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="govuk-link"
                  >
                    Advisories archive on ttcsirt.gov.tt
                    <span className="govuk-visually-hidden">
                      {" "}(opens in new tab)
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="/guidance"
                    className="govuk-link"
                    onClick={(e) => handleNavigate(e, "/guidance")}
                  >
                    Cyber security guidance
                  </a>
                </li>
                <li className="govuk-!-margin-bottom-0">
                  <a
                    href="/national-cyber-security-strategy"
                    className="govuk-link"
                    onClick={(e) =>
                      handleNavigate(e, "/national-cyber-security-strategy")
                    }
                  >
                    National Cyber Security Strategy
                  </a>
                </li>
              </ul>
            </section>

            <div className="govuk-!-margin-top-8 govuk-!-margin-bottom-4">
              <a
                href="/advisories"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateBack();
                }}
                className="govuk-back-link"
              >
                Back to cyber security advisories
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
