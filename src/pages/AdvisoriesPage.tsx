import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { Advisory } from "@/services/advisories";
import { PageNavigation } from "@/components/PageNavigation";
import { Notice } from "@/components/Notice";
import { FilterSelect } from "@/components/FilterSelect";
import { Button } from "@/components/gcds/Button";
import {
  indexDocument,
  scoreDocument,
  compareSearchResults,
  tokenize,
  DEFAULT_SEARCH_WEIGHTS,
  IndexedSearchDocument,
  SearchResultItem,
} from "@/services/search";
import {
  getResilientAdvisories,
  ResilientAdvisoriesResult,
  getInitialAdvisoryListingState,
  formatFreshnessTimestamp,
  CACHE_CONFIG,
  prefetchAdvisoryDetail,
  prefetchTopAdvisories,
  PREFETCH_CONFIG,
} from "@/services/advisoryCache";

interface AdvisoriesPageProps {
  onNavigateHome?: () => void;
  onNavigateToDetail?: (idOrSlug: string | number) => void;
  onNavigate?: (path: string) => void;
}

const ADVISORIES_NAV_ITEMS = [
  { id: "search-advisories", label: "Search and filter" },
  { id: "latest-advisories-heading", label: "Advisories and alerts" },
  { id: "get-email-updates", label: "Email updates" },
  { id: "emergency-reporting", label: "Emergency reporting" },
  { id: "related-resources", label: "Related resources" },
];

function getPaginationItems(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, "ellipsis", totalPages];
  } else if (currentPage >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
  } else {
    return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
  }
}

type TopicFilter = "all" | "Advisory" | "Alert";
type DateFilter = "all" | "past-week" | "past-month" | "past-year";
export type AdvisorySortOption = "newest" | "oldest" | "title-asc" | "title-desc";

function parseSortParam(raw: string | null): { sort: AdvisorySortOption; isExplicit: boolean } {
  if (raw === "oldest") return { sort: "oldest", isExplicit: true };
  if (raw === "title-asc" || raw === "title-az") return { sort: "title-asc", isExplicit: true };
  if (raw === "title-desc" || raw === "title-za") return { sort: "title-desc", isExplicit: true };
  if (raw === "newest" || raw === "published") return { sort: "newest", isExplicit: true };
  return { sort: "newest", isExplicit: false };
}

function getAdvisoryPublicationTime(advisory: Advisory): number {
  const raw = advisory.rawDate || advisory.date;
  const parsed = Date.parse(raw);
  if (!isNaN(parsed)) return parsed;
  const fallback = Date.parse(advisory.date);
  return isNaN(fallback) ? 0 : fallback;
}

function normalizeTitleForSort(title: string): string {
  return title
    .replace(/^(?:\d{2,6}(?:\.\d{2})*\s*:\s*)+/i, "")
    .replace(/^tt-?csirt\s*advisory\s*[-–—:]*\s*/i, "")
    .replace(/^[^a-zA-Z0-9]+/, "")
    .trim();
}

function compareAdvisoriesBySort(a: Advisory, b: Advisory, sortBy: AdvisorySortOption): number {
  if (sortBy === "oldest") {
    const diff = getAdvisoryPublicationTime(a) - getAdvisoryPublicationTime(b);
    if (diff !== 0) return diff;
    return a.id - b.id;
  }

  if (sortBy === "title-asc" || sortBy === "title-desc") {
    const normA = normalizeTitleForSort(a.title);
    const normB = normalizeTitleForSort(b.title);
    const isAlphaA = /^[a-zA-Z]/.test(normA);
    const isAlphaB = /^[a-zA-Z]/.test(normB);

    // Keep alphabetic titles (A–Z / Z–A) ahead of leading-digit product names
    if (isAlphaA !== isAlphaB) {
      return isAlphaA ? -1 : 1;
    }

    const normDiff = normA.localeCompare(normB, "en", {
      numeric: true,
      sensitivity: "base",
    });
    if (normDiff !== 0) {
      return sortBy === "title-asc" ? normDiff : -normDiff;
    }

    const rawDiff = a.title.localeCompare(b.title, "en", {
      numeric: true,
      sensitivity: "base",
    });
    if (rawDiff !== 0) {
      return sortBy === "title-asc" ? rawDiff : -rawDiff;
    }

    const dateDiff = getAdvisoryPublicationTime(b) - getAdvisoryPublicationTime(a);
    if (dateDiff !== 0) return dateDiff;
    return b.id - a.id;
  }

  // Default: "newest" (most recently published advisory first)
  const diff = getAdvisoryPublicationTime(b) - getAdvisoryPublicationTime(a);
  if (diff !== 0) return diff;
  return b.id - a.id;
}

export function AdvisoriesPage({ onNavigateHome, onNavigateToDetail, onNavigate }: AdvisoriesPageProps) {
  const initialData = getInitialAdvisoryListingState();

  const [advisories, setAdvisories] = useState<Advisory[]>(() => initialData.advisories);
  const [currentPage, setCurrentPage] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const page = params.get("page");
      if (page) {
        const parsed = parseInt(page, 10);
        if (!isNaN(parsed) && parsed >= 1) return parsed;
      }
    }
    return 1;
  });
  const [totalPages, setTotalPages] = useState<number>(() => initialData.totalPages || 1);
  const [totalRecords, setTotalRecords] = useState<number | undefined>(() => initialData.totalRecords);
  const [fetchedAt, setFetchedAt] = useState<number | undefined>(() => initialData.fetchedAt);
  const [freshnessUnconfirmed, setFreshnessUnconfirmed] = useState<boolean>(false);
  const [isCheckingFreshness, setIsCheckingFreshness] = useState<boolean>(false);
  const [showUnavailable, setShowUnavailable] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<AdvisorySortOption>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return parseSortParam(params.get("sort")).sort;
    }
    return "newest";
  });
  const [hasExplicitSort, setHasExplicitSort] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return parseSortParam(params.get("sort")).isExplicit;
    }
    return false;
  });
  const [selectedTopic, setSelectedTopic] = useState<TopicFilter>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const topic = params.get("topic");
      if (topic === "Advisory" || topic === "Alert") return topic;
    }
    return "all";
  });
  const [selectedDate, setSelectedDate] = useState<DateFilter>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const d = params.get("date");
      if (d === "past-week" || d === "past-month" || d === "past-year") return d;
    }
    return "all";
  });
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("search") || "";
    }
    return "";
  });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shouldScrollToAdvisoriesRef = useRef<boolean>(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTopicChange = (newTopic: TopicFilter) => {
    setSelectedTopic(newTopic);
    setCurrentPage(1);
  };

  const handleDateChange = (newDate: DateFilter) => {
    setSelectedDate(newDate);
    setCurrentPage(1);
  };

  const handleSortChange = (newSort: AdvisorySortOption) => {
    setSortBy(newSort);
    setHasExplicitSort(true);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (!val.trim() && sortBy === "newest") {
      setHasExplicitSort(false);
    } else if (sortBy === "newest") {
      setHasExplicitSort(false);
    }
    setCurrentPage(1);
  };

  const submitSearch = () => {
    setCurrentPage(1);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      } else {
        params.delete("search");
      }
      params.delete("page");
      const queryString = params.toString();
      const newUrl = queryString ? `/advisories?${queryString}` : "/advisories";
      window.history.pushState({}, "", newUrl);
      sessionStorage.setItem("ttcsirt_advisories_url", newUrl);
    }

    setTimeout(() => {
      const resultsHeading = document.getElementById("latest-advisories-heading");
      if (resultsHeading) {
        resultsHeading.scrollIntoView({ behavior: "smooth" });
        resultsHeading.focus();
      }
    }, 50);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSearch();
  };

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

  // Idle background prefetch for top visible advisory details once listing is populated
  useEffect(() => {
    if (advisories.length > 0) {
      prefetchTopAdvisories(advisories, PREFETCH_CONFIG.TOP_CANDIDATES_LIMIT);
    }
  }, [advisories]);

  useLayoutEffect(() => {
    if (typeof window !== "undefined") {
      const mainElement = document.getElementById("main-content");
      if (mainElement) {
        const rect = mainElement.getBoundingClientRect();
        const currentScrollY =
          window.pageYOffset ||
          window.scrollY ||
          (document.scrollingElement ? document.scrollingElement.scrollTop : 0) ||
          0;
        const targetTop = rect.top + currentScrollY;
        window.scrollTo(0, Math.max(0, Math.round(targetTop)));
      } else {
        window.scrollTo(0, 0);
      }
    }
    // Set accessible focus to primary heading without scrolling
    if (headingRef.current) {
      try {
        headingRef.current.focus({ preventScroll: true });
      } catch {
        headingRef.current.focus();
      }
    }
  }, []);

  const loadAdvisories = useCallback(
    async (page: number = 1, forceRefresh: boolean = false) => {
      if (forceRefresh) {
        setIsCheckingFreshness(true);
      }

      let blankThresholdTimer: ReturnType<typeof setTimeout> | null = null;

      // If we do NOT have usable content, start the short initial blank-state threshold
      if (advisories.length === 0) {
        blankThresholdTimer = setTimeout(() => {
          setShowUnavailable(true);
        }, CACHE_CONFIG.INITIAL_BLANK_THRESHOLD_MS);
      }

      const handleUpdate = (result: ResilientAdvisoriesResult) => {
        if (blankThresholdTimer) {
          clearTimeout(blankThresholdTimer);
          blankThresholdTimer = null;
        }

        if (result.hasUsableContent && result.advisories.length > 0) {
          setAdvisories(result.advisories);
          setShowUnavailable(false);
          if (result.totalPages) setTotalPages(result.totalPages);
          if (result.totalRecords !== undefined) setTotalRecords(result.totalRecords);
          if (result.fetchedAt) setFetchedAt(result.fetchedAt);
          setFreshnessUnconfirmed(result.freshnessUnconfirmed);
        } else {
          // No usable content
          setFreshnessUnconfirmed(false);
          setShowUnavailable(true);
        }

        setIsCheckingFreshness(false);
      };

      const initialResult = await getResilientAdvisories({
        fetchAll: true,
        forceRefresh,
        onUpdate: handleUpdate,
      });

      handleUpdate(initialResult);
    },
    [advisories.length]
  );

  useEffect(() => {
    loadAdvisories(1);
  }, [loadAdvisories]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const query = params.get("search") || "";
      const topic = params.get("topic");
      const date = params.get("date");
      const parsedSort = parseSortParam(params.get("sort"));
      const page = params.get("page");

      setSearchQuery(query);
      setSelectedTopic(topic === "Advisory" || topic === "Alert" ? topic : "all");
      setSelectedDate(date === "past-week" || date === "past-month" || date === "past-year" ? date : "all");
      setSortBy(parsedSort.sort);
      setHasExplicitSort(parsedSort.isExplicit);

      if (page) {
        const parsed = parseInt(page, 10);
        if (!isNaN(parsed) && parsed >= 1) {
          setCurrentPage(parsed);
          shouldScrollToAdvisoriesRef.current = true;
          return;
        }
      }
      setCurrentPage(1);
      shouldScrollToAdvisoriesRef.current = true;
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Pre-index advisories for deterministic search relevance scoring
  const indexedAdvisoriesMap = useMemo(() => {
    const map = new Map<number, IndexedSearchDocument>();
    for (const adv of advisories) {
      map.set(
        adv.id,
        indexDocument({
          id: `adv-${adv.id}`,
          type: adv.categoryName === "Alert" ? "alert" : "advisory",
          title: adv.title,
          description: adv.displaySummary || adv.sourceExcerpt || "",
          summary: adv.displaySummary || adv.sourceExcerpt || "",
          href: `/advisories/${adv.slug || adv.id}`,
          date: adv.rawDate || adv.date,
          publishedAt: adv.rawDate || adv.date,
          keywords: [
            ...tokenize(adv.rawTitle || adv.title),
            adv.referenceNumber || "",
            ...(adv.cveList || []),
            adv.categoryName || "",
          ],
          searchText: `${adv.rawTitle || ""} ${adv.sourceExcerpt || ""}`,
          cves: adv.cveList,
          advisoryId: adv.referenceNumber,
          categoryLabel: adv.categoryName === "Alert" ? "Alert" : "Advisory",
        })
      );
    }
    return map;
  }, [advisories]);

  // Filter, search and sort ALL loaded records
  const allFilteredAdvisories = useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    const lowerQuery = trimmedQuery.toLowerCase();
    const now = Date.now();

    const matchedItems: { advisory: Advisory; scored: SearchResultItem | null }[] = [];

    for (const advisory of advisories) {
      const matchesTopic =
        selectedTopic === "all" || advisory.categoryName === selectedTopic;
      if (!matchesTopic) continue;

      const matchesDate = (() => {
        if (selectedDate === "all") return true;
        const itemTime = getAdvisoryPublicationTime(advisory);
        if (!itemTime) return true;
        if (selectedDate === "past-week") {
          return itemTime >= now - 7 * 24 * 60 * 60 * 1000;
        }
        if (selectedDate === "past-month") {
          return itemTime >= now - 30 * 24 * 60 * 60 * 1000;
        }
        if (selectedDate === "past-year") {
          return itemTime >= now - 365 * 24 * 60 * 60 * 1000;
        }
        return true;
      })();
      if (!matchesDate) continue;

      if (!trimmedQuery) {
        matchedItems.push({ advisory, scored: null });
        continue;
      }

      const indexedDoc = indexedAdvisoriesMap.get(advisory.id);
      const scored = indexedDoc
        ? scoreDocument(indexedDoc, trimmedQuery, DEFAULT_SEARCH_WEIGHTS, { allowFuzzy: false })
        : null;

      const matchesSubstring =
        advisory.title.toLowerCase().includes(lowerQuery) ||
        advisory.rawTitle.toLowerCase().includes(lowerQuery) ||
        advisory.displaySummary.toLowerCase().includes(lowerQuery) ||
        advisory.sourceExcerpt.toLowerCase().includes(lowerQuery) ||
        Boolean(advisory.referenceNumber && advisory.referenceNumber.toLowerCase().includes(lowerQuery)) ||
        Boolean(advisory.cveList && advisory.cveList.some((cve) => cve.toLowerCase().includes(lowerQuery)));

      if ((scored && scored.score > 0) || matchesSubstring) {
        matchedItems.push({ advisory, scored });
      }
    }

    const useRelevanceOrdering = Boolean(trimmedQuery) && !hasExplicitSort;

    matchedItems.sort((a, b) => {
      if (useRelevanceOrdering) {
        if (a.scored && b.scored) {
          const relDiff = compareSearchResults(a.scored, b.scored);
          if (relDiff !== 0) return relDiff;
        } else if (a.scored && !b.scored) {
          return -1;
        } else if (!a.scored && b.scored) {
          return 1;
        }
        return compareAdvisoriesBySort(a.advisory, b.advisory, "newest");
      }

      return compareAdvisoriesBySort(a.advisory, b.advisory, sortBy);
    });

    return matchedItems.map((item) => item.advisory);
  }, [advisories, indexedAdvisoriesMap, searchQuery, selectedTopic, selectedDate, sortBy, hasExplicitSort]);

  const itemsPerPage = 10;
  const clientTotalPages = Math.max(1, Math.ceil(allFilteredAdvisories.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, clientTotalPages);

  // Scroll to Latest advisories section after new page data commits to DOM
  useLayoutEffect(() => {
    if (typeof document !== "undefined") {
      if (safeCurrentPage > 1) {
        document.title = `Cyber security advisories, page ${safeCurrentPage} of ${clientTotalPages} - TT-CSIRT`;
      } else {
        document.title = `Cyber security advisories - TT-CSIRT`;
      }
    }

    if (shouldScrollToAdvisoriesRef.current) {
      shouldScrollToAdvisoriesRef.current = false;
      const target = document.getElementById("latest-advisories-heading");
      
      if (target) {
        target.setAttribute("tabIndex", "-1");
        
        try {
          target.focus({ preventScroll: true });
        } catch {
          target.focus();
        }

        target.scrollIntoView({
          behavior: "auto",
          block: "start",
        });
      }
    }
  }, [safeCurrentPage, clientTotalPages, allFilteredAdvisories]);

  // Synchronize search, topic, date, sort, and page with URL query parameters
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }
      if (selectedTopic !== "all") {
        params.set("topic", selectedTopic);
      }
      if (selectedDate !== "all") {
        params.set("date", selectedDate);
      }
      if (sortBy !== "newest" || (hasExplicitSort && searchQuery.trim().length > 0)) {
        params.set("sort", sortBy);
      }
      if (safeCurrentPage > 1) {
        params.set("page", safeCurrentPage.toString());
      }

      const queryString = params.toString();
      const newUrl = queryString ? `/advisories?${queryString}` : "/advisories";
      const currentUrl = window.location.pathname + window.location.search;
      if (currentUrl !== newUrl) {
        window.history.replaceState({}, "", newUrl);
      }
      sessionStorage.setItem("ttcsirt_advisories_url", newUrl);
    }
  }, [searchQuery, selectedTopic, selectedDate, sortBy, hasExplicitSort, safeCurrentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (clientTotalPages && newPage > clientTotalPages) || newPage === currentPage) {
      return;
    }
    
    shouldScrollToAdvisoriesRef.current = true;
    setCurrentPage(newPage);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (newPage > 1) {
        params.set("page", newPage.toString());
      } else {
        params.delete("page");
      }
      const queryString = params.toString();
      const newUrl = queryString ? `/advisories?${queryString}` : "/advisories";
      window.history.pushState({}, "", newUrl);
      sessionStorage.setItem("ttcsirt_advisories_url", newUrl);
    }
  };

  
  // Clamp current page if filter changes
  useEffect(() => {
    if (currentPage > clientTotalPages) {
      setCurrentPage(safeCurrentPage);
    }
  }, [clientTotalPages, currentPage, safeCurrentPage]);

  const displayedAdvisories = allFilteredAdvisories.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );
  const resetAdvisoryFilters = () => {
    setSearchQuery("");
    setSelectedTopic("all");
    setSelectedDate("all");
    setSortBy("newest");
    setHasExplicitSort(false);
    setCurrentPage(1);
    window.history.pushState({}, "", "/advisories");
  };

  const paginationItems = getPaginationItems(safeCurrentPage, clientTotalPages);
  const formattedTimestamp = formatFreshnessTimestamp(fetchedAt);

  return (
    <div className="govuk-grid-row app-page-grid-row">
      {/* Left Column: Semantic in-page navigation matching site standard */}
      <PageNavigation
        navItems={ADVISORIES_NAV_ITEMS}
        defaultActiveId="search-advisories"
        ariaLabel="Advisories section navigation"
      />

      {/* Right Column: Primary content */}
      <div className="govuk-grid-column-two-thirds app-page-content">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="govuk-heading-xl"
        >
          Cyber security advisories
        </h1>

        <p className="govuk-body-l">
          TT-CSIRT publishes cyber security advisories to help individuals and organisations understand current cyber threats, identify risks and take appropriate action.
        </p>

        <p className="govuk-body">
          All advisories are published under the authority of the Ministry of Homeland Security as part of the National Cyber Security Incident Response framework.
        </p>

        {advisories.length > 0 && (
          <div id="search-advisories">
            <form
              role="search"
              aria-label="Search and filter advisories"
              onSubmit={handleSearchSubmit}
              noValidate
              className="advisories-search-form"
            >
            <div className="advisories-filter-section">
              <h2 className="govuk-heading-s advisories-filter-heading">Filter by</h2>
              <div className="advisories-filter-controls">
                <div className="govuk-form-group advisories-search-control">
                  <label className="govuk-label govuk-label--m" htmlFor="advisories-search-input">
                    Search advisories
                  </label>
                  <div id="advisories-search-hint" className="govuk-hint">
                    Search by keyword, vulnerability or product name
                  </div>
                  <div className="advisories-search-input-wrapper">
                    <input
                      className="govuk-input advisories-search-input"
                      id="advisories-search-input"
                      name="search"
                      type="search"
                      aria-describedby="advisories-search-hint"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="e.g. SharePoint"
                      spellCheck={false}
                    />
                    <Button
                      type="button"
                      role="secondary"
                      className="advisories-search-button"
                      onClick={submitSearch}
                    >
                      Search
                    </Button>
                  </div>
                </div>
                <FilterSelect id="advisory-topic" name="topic" label="Topic" value={selectedTopic} onChange={(value) => handleTopicChange(value as TopicFilter)}>
                  <option value="all">All topics</option>
                  <option value="Advisory">Advisory</option>
                  <option value="Alert">Alert</option>
                </FilterSelect>
                <FilterSelect id="filter-date" name="date" label="Date" value={selectedDate} onChange={(value) => handleDateChange(value as DateFilter)}>
                  <option value="all">All time</option>
                  <option value="past-week">Past week</option>
                  <option value="past-month">Past month</option>
                  <option value="past-year">Past year</option>
                </FilterSelect>
                <FilterSelect id="filter-sort" name="sort" label="Sort by" value={sortBy} onChange={(value) => handleSortChange(value as AdvisorySortOption)}>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="title-asc">Title A–Z</option>
                  <option value="title-desc">Title Z–A</option>
                </FilterSelect>
                <Button type="button" role="secondary" className="filter-panel__reset" onClick={resetAdvisoryFilters}>Clear filters</Button>
              </div>
              <p className="govuk-hint filter-panel__summary" aria-live="polite">
                Showing {allFilteredAdvisories.length} {allFilteredAdvisories.length === 1 ? "advisory" : "advisories"} matching these filters.
              </p>
            </div>
            </form>
          </div>
        )}

        {/* State C: Usable content available but freshness could not be confirmed */}
        {advisories.length > 0 && freshnessUnconfirmed && (
          <Notice type="warning" title="We could not check for newer information" titleAs="h2">
            <p className="govuk-body">
              The latest advisory information available was from {formattedTimestamp}.
            </p>
            <Button
              type="button"
              role="secondary"
              onClick={() => loadAdvisories(currentPage, true)}
              disabled={isCheckingFreshness}
            >
              {isCheckingFreshness ? "Checking…" : "Try again"}
            </Button>
          </Notice>
        )}

        {/* State A: No usable content available after initial threshold */}
        {advisories.length === 0 && showUnavailable && (
          <div
            className="govuk-error-summary ttcsirt-error-callout"
            aria-labelledby="error-summary-title"
            role="alert"
            tabIndex={-1}
            
          >
            <div className="ttcsirt-error-callout__row">
              <AlertCircle size={24} className="ttcsirt-error-callout__icon" aria-hidden="true" />
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
                    onClick={() => loadAdvisories(currentPage, true)}
                    disabled={isCheckingFreshness}
                  >
                    {isCheckingFreshness ? "Checking…" : "Try again"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* State B & Content Render: Usable advisories list */}
        {advisories.length > 0 && (
          <>
            {/* Accessible count announcement */}
            <div className="govuk-visually-hidden" aria-live="polite" aria-atomic="true">
              {allFilteredAdvisories.length === 0
                ? `No advisories found matching "${searchQuery}"`
                : `Showing page ${safeCurrentPage} of ${clientTotalPages}. ${allFilteredAdvisories.length} total advisories.`}
            </div>

            <section
              id="latest-advisories"
              aria-labelledby="latest-advisories-heading"
              style={{ scrollMarginTop: "24px" }}
              className="govuk-!-margin-top-6"
            >
              <h2
                id="latest-advisories-heading"
                className="govuk-heading-m"
              >
                Latest advisories
              </h2>

              {displayedAdvisories.length === 0 ? (
                <div className="govuk-inset-text">
                  <p className="govuk-body">
                    No advisories found matching your search criteria. Try adjusting your filter or search terms.
                  </p>
                </div>
              ) : (
                <div className="finder-results js-finder-results">
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
                                  if (typeof window !== "undefined") {
                                    sessionStorage.setItem("ttcsirt_advisories_url", window.location.pathname + window.location.search);
                                  }
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
                              {advisory.categoryName === "Alert" ? "Alert" : "Advisory"}
                            </li>
                            <li className="gem-c-document-list__attribute">
                              <time dateTime={advisory.rawDate || advisory.date}>{advisory.date}</time>
                            </li>
                            {advisory.cveList && advisory.cveList.length > 0 && (
                              <li className="gem-c-document-list__attribute">
                                <span className="govuk-visually-hidden">Vulnerabilities: </span>
                                {advisory.cveList.slice(0, 3).join(", ")}
                                {advisory.cveList.length > 3 ? ` +${advisory.cveList.length - 3} more` : ""}
                              </li>
                            )}
                            {advisory.referenceNumber && (
                              <li className="gem-c-document-list__attribute">
                                <span className="govuk-visually-hidden">Reference: </span>
                                {advisory.referenceNumber}
                              </li>
                            )}
                          </ul>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* GOV.UK Design System Pagination */}
              {clientTotalPages > 1 && (
                <nav className="govuk-pagination" aria-label="Pagination">
                  {safeCurrentPage > 1 && (
                    <div className="govuk-pagination__prev">
                      <a
                        className="govuk-link govuk-pagination__link"
                        href={`/advisories?page=${safeCurrentPage - 1}`}
                        rel="prev"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(safeCurrentPage - 1);
                        }}
                      >
                        <svg
                          className="govuk-pagination__icon govuk-pagination__icon--prev"
                          xmlns="http://www.w3.org/2000/svg"
                          height="13"
                          width="15"
                          aria-hidden="true"
                          focusable="false"
                          viewBox="0 0 15 13"
                        >
                          <path d="m6.5938-0.0078125-6.7266 6.7266 6.7266 6.7266 1.4141-1.4141-4.3125-4.3125 14.305-0.0001v-2l-14.305 0.0001 4.3125-4.3125-1.4141-1.4141z" />
                        </svg>
                        <span className="govuk-pagination__link-title">
                          Previous<span className="govuk-visually-hidden"> page</span>
                        </span>
                      </a>
                    </div>
                  )}

                  <ul className="govuk-pagination__list">
                    {paginationItems.map((item, idx) => {
                      if (item === "ellipsis") {
                        return (
                          <li className="govuk-pagination__item govuk-pagination__item--ellipsis" key={`ellipsis-${idx}`}>
                            &#x22EF;
                          </li>
                        );
                      }
                      const pageNum = item as number;
                      const isCurrent = pageNum === safeCurrentPage;
                      return (
                        <li
                          className={`govuk-pagination__item${isCurrent ? " govuk-pagination__item--current" : ""}`}
                          key={pageNum}
                        >
                          <a
                            className="govuk-link govuk-pagination__link"
                            href={`/advisories?page=${pageNum}`}
                            aria-label={`Page ${pageNum}`}
                            aria-current={isCurrent ? "page" : undefined}
                            onClick={(e) => {
                              e.preventDefault();
                              if (!isCurrent) {
                                handlePageChange(pageNum);
                              }
                            }}
                          >
                            {pageNum}
                          </a>
                        </li>
                      );
                    })}
                  </ul>

                  {safeCurrentPage < clientTotalPages && (
                    <div className="govuk-pagination__next">
                      <a
                        className="govuk-link govuk-pagination__link"
                        href={`/advisories?page=${safeCurrentPage + 1}`}
                        rel="next"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(safeCurrentPage + 1);
                        }}
                      >
                        <span className="govuk-pagination__link-title">
                          Next<span className="govuk-visually-hidden"> page</span>
                        </span>
                        <svg
                          className="govuk-pagination__icon govuk-pagination__icon--next"
                          xmlns="http://www.w3.org/2000/svg"
                          height="13"
                          width="15"
                          aria-hidden="true"
                          focusable="false"
                          viewBox="0 0 15 13"
                        >
                          <path d="m8.107-0.0078125-1.4136 1.414 4.2928 4.293h-12.986v2h12.896l-4.1855 4.1855 1.414 1.414 6.707-6.707-6.707-6.707z" />
                        </svg>
                      </a>
                    </div>
                  )}
                </nav>
              )}
            </section>
          </>
        )}

        <hr className="govuk-section-break govuk-section-break--visible govuk-!-margin-top-8 govuk-!-margin-bottom-8" />

        {/* Section: Get email updates */}
        <section id="get-email-updates" aria-labelledby="get-email-updates-heading">
          <h2 className="govuk-heading-m" id="get-email-updates-heading">
            Get email updates
          </h2>
          <p className="govuk-body">
            Receive TT-CSIRT cyber security advisories and alerts by email.
          </p>
          <p className="govuk-body">
            <a
              href="mailto:contacts@ttcsirt.gov.tt?subject=Subscribe%20to%20TT-CSIRT%20Advisories%20and%20Alerts"
              className="govuk-link"
            >
              Subscribe to email alerts
            </a>
          </p>
        </section>

        <hr className="govuk-section-break govuk-section-break--visible govuk-!-margin-top-8 govuk-!-margin-bottom-8" />

        {/* Section: Emergency incident reporting */}
        <section id="emergency-reporting" aria-labelledby="emergency-reporting-heading">
          <h2 className="govuk-heading-m" id="emergency-reporting-heading">
            Emergency incident reporting
          </h2>
          <p className="govuk-body">
            If your organisation is experiencing an active cyber incident, contact TT-CSIRT.
          </p>

          <div className="govuk-!-margin-bottom-4">
            <strong className="govuk-body govuk-!-font-weight-bold govuk-!-display-block govuk-!-margin-bottom-1">
              Phone
            </strong>
            <a href="tel:+18686257937" className="govuk-link govuk-body">
              +1 868 625 7937
            </a>
          </div>

          <div className="govuk-!-margin-bottom-4">
            <strong className="govuk-body govuk-!-font-weight-bold govuk-!-display-block govuk-!-margin-bottom-1">
              Email
            </strong>
            <a href="mailto:contacts@ttcsirt.gov.tt" className="govuk-link govuk-body">
              contacts@ttcsirt.gov.tt
            </a>
          </div>

          <p className="govuk-body">
            <a
              href="/report-an-incident"
              className="govuk-link"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate("/report-an-incident");
                else window.location.href = "/report-an-incident";
              }}
            >
              Report an incident
            </a>
          </p>
        </section>

        <hr className="govuk-section-break govuk-section-break--visible govuk-!-margin-top-8 govuk-!-margin-bottom-8" />

        {/* Section: Related resources */}
        <section id="related-resources" aria-labelledby="related-resources-heading">
          <h2 className="govuk-heading-m" id="related-resources-heading">
            Related resources
          </h2>
          <ul className="govuk-list govuk-body govuk-list--spaced">
            <li>
              <a href="https://ttcsirt.gov.tt/category/security-advisories/" target="_blank" rel="noopener noreferrer" className="govuk-link">
                Advisories archive on ttcsirt.gov.tt
                <span className="govuk-visually-hidden"> (opens in new tab)</span>
              </a>
            </li>
            <li>
              <a
                href="/guidance"
                className="govuk-link"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigate) onNavigate("/guidance");
                  else window.location.href = "/guidance";
                }}
              >
                Cyber security guidance
              </a>
            </li>
            <li className="govuk-!-margin-bottom-0">
              <a
                href="/national-cyber-security-strategy"
                className="govuk-link"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigate) onNavigate("/national-cyber-security-strategy");
                  else window.location.href = "/national-cyber-security-strategy";
                }}
              >
                National Cyber Security Strategy
              </a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
