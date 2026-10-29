/**
 * Central Routing Model for TT-CSIRT Portal
 * Single source of truth for URL resolution, active navigation,
 * breadcrumbs, page titles, and layout contracts.
 */

import { getEditorialItemBySlug } from "@/services/newsEventsContent";
import { getGuidanceSummaryBySlug } from "@/services/guidanceContent";

export type Route =
  | { type: "home" }
  | { type: "services" }
  | { type: "service-incident-response" }
  | { type: "report-incident" }
  | { type: "service-proactive-risk" }
  | { type: "service-detail"; slug: string }
  | { type: "advisories" }
  | { type: "advisory-detail"; id: string }
  | { type: "guidance" }
  | { type: "guidance-detail"; slug: string }
  | { type: "news-events" }
  | { type: "news" }
  | { type: "news-detail"; slug: string }
  | { type: "events" }
  | { type: "event-detail"; slug: string }
  | { type: "training" }
  | { type: "training-detail"; slug: string }
  | { type: "workshop-detail"; slug: string }
  | { type: "statistics" }
  | { type: "about" }
  | { type: "strategy" }
  | { type: "contact" }
  | { type: "accessibility-statement" }
  | { type: "privacy-policy" }
  | { type: "search"; query: string }
  | { type: "not-found"; pathname: string };

export type PageLayout =
  | "landing"
  | "collection"
  | "document"
  | "service"
  | "data";

export interface BreadcrumbItem {
  label: string;
  path?: string;
  isCurrent?: boolean;
}

/**
 * Resolves a pathname and query string into a strongly-typed Route
 */
export function resolveRoute(pathname: string, search = ""): Route {
  // Normalize path
  let path = pathname.split("?")[0].replace(/\/+$/, "");
  if (path === "") path = "/";

  // Check search query parameter
  const searchParams = new URLSearchParams(search || (typeof window !== "undefined" ? window.location.search : ""));

  if (path === "/search") {
    const query = searchParams.get("q") || searchParams.get("search") || "";
    return { type: "search", query };
  }

  if (path === "/") {
    return { type: "home" };
  }

  if (path === "/services") {
    return { type: "services" };
  }

  if (path === "/services/incident-response") {
    return { type: "service-incident-response" };
  }

  if (path === "/report-an-incident" || path === "/report") {
    return { type: "report-incident" };
  }

  if (path === "/services/proactive-risk-management" || path === "/services/proactive-risk") {
    return { type: "service-proactive-risk" };
  }

  if (path.startsWith("/services/")) {
    const slug = path.substring("/services/".length);
    if (slug === "incident-response") return { type: "service-incident-response" };
    if (slug === "proactive-risk-management" || slug === "proactive-risk") return { type: "service-proactive-risk" };
    return { type: "service-detail", slug };
  }

  if (path === "/advisories") {
    return { type: "advisories" };
  }

  if (path.startsWith("/advisories/")) {
    const id = decodeURIComponent(path.substring("/advisories/".length));
    if (id) {
      return { type: "advisory-detail", id };
    }
    return { type: "advisories" };
  }

  if (path === "/guidance") {
    return { type: "guidance" };
  }

  if (path.startsWith("/guidance/")) {
    const slug = path.substring("/guidance/".length);
    if (slug) {
      return { type: "guidance-detail", slug };
    }
    return { type: "guidance" };
  }

  if (path === "/news-events") {
    return { type: "news-events" };
  }

  if (path === "/news") {
    return { type: "news" };
  }

  if (path.startsWith("/news/")) {
    const slug = decodeURIComponent(path.substring("/news/".length));
    if (slug) {
      return { type: "news-detail", slug };
    }
    return { type: "news" };
  }

  if (path === "/events") {
    return { type: "events" };
  }

  if (path.startsWith("/events/")) {
    const slug = decodeURIComponent(path.substring("/events/".length));
    if (slug) {
      return { type: "event-detail", slug };
    }
    return { type: "events" };
  }

  if (path === "/training") {
    return { type: "training" };
  }

  if (path.startsWith("/training/")) {
    const slug = decodeURIComponent(path.substring("/training/".length));
    if (slug) {
      return { type: "training-detail", slug };
    }
    return { type: "training" };
  }

  if (path === "/workshops") {
    return { type: "events" };
  }

  if (path.startsWith("/workshops/")) {
    const slug = decodeURIComponent(path.substring("/workshops/".length));
    if (slug) {
      return { type: "workshop-detail", slug };
    }
    return { type: "events" };
  }

  if (path === "/statistics") {
    return { type: "statistics" };
  }

  if (path === "/about") {
    return { type: "about" };
  }

  if (
    path === "/national-cyber-security-strategy" ||
    path === "/about/national-cyber-security-strategy" ||
    path === "/about/strategy" ||
    path === "/strategy"
  ) {
    return { type: "strategy" };
  }

  if (path === "/contact" || path === "/contact-us") {
    return { type: "contact" };
  }

  if (path === "/accessibility-statement" || path === "/accessibility") {
    return { type: "accessibility-statement" };
  }

  if (path === "/privacy-policy" || path === "/privacy") {
    return { type: "privacy-policy" };
  }

  return { type: "not-found", pathname: path };
}

/**
 * Maps route to page layout contract
 */
export function getLayoutForRoute(route: Route): PageLayout {
  switch (route.type) {
    case "home":
      return "landing";
    case "services":
    case "service-incident-response":
    case "report-incident":
    case "service-proactive-risk":
    case "service-detail":
      return "service";
    case "advisories":
    case "guidance":
    case "news-events":
    case "news":
    case "events":
    case "training":
    case "search":
      return "collection";
    case "advisory-detail":
    case "guidance-detail":
    case "news-detail":
    case "event-detail":
    case "training-detail":
    case "workshop-detail":
    case "about":
    case "strategy":
    case "contact":
    case "accessibility-statement":
    case "privacy-policy":
      return "document";
    case "statistics":
      return "data";
    case "not-found":
      return "document";
  }
}

/**
 * Generates official page title for <title> and accessibility announcements
 */
export function getPageTitle(route: Route): string {
  const suffix = " – TT-CSIRT";
  switch (route.type) {
    case "home":
      return "Trinidad and Tobago Cyber Security Incident Response Team (TT-CSIRT)";
    case "services":
      return `Cyber security services${suffix}`;
    case "service-incident-response":
      return `Incident response service${suffix}`;
    case "report-incident":
      return `Report a cyber security incident${suffix}`;
    case "service-proactive-risk":
      return `Proactive risk exposure management${suffix}`;
    case "service-detail":
      return `Service details${suffix}`;
    case "advisories":
      return `Cyber security advisories & alerts${suffix}`;
    case "advisory-detail":
      return `Advisory details${suffix}`;
    case "guidance":
      return `Cyber security guidance${suffix}`;
    case "guidance-detail": {
      const summary = getGuidanceSummaryBySlug(route.slug);
      return `${summary ? summary.title : "Guidance document"}${suffix}`;
    }
    case "news-events":
      return `News, events and training${suffix}`;
    case "news":
      return `Cyber security news${suffix}`;
    case "news-detail": {
      const item = getEditorialItemBySlug(route.slug);
      return `${item ? item.title : "News details"}${suffix}`;
    }
    case "events":
      return `Cyber security events${suffix}`;
    case "event-detail": {
      const item = getEditorialItemBySlug(route.slug);
      return `${item ? item.title : "Event details"}${suffix}`;
    }
    case "training":
      return `Cyber training and education${suffix}`;
    case "training-detail": {
      const item = getEditorialItemBySlug(route.slug);
      return `${item ? item.title : "Training program details"}${suffix}`;
    }
    case "workshop-detail": {
      const item = getEditorialItemBySlug(route.slug);
      return `${item ? item.title : "Workshop details"}${suffix}`;
    }
    case "statistics":
      return `National cyber security statistics${suffix}`;
    case "about":
      return `About TT-CSIRT${suffix}`;
    case "strategy":
      return `National Cyber Security Strategy${suffix}`;
    case "contact":
      return `Contact TT-CSIRT${suffix}`;
    case "accessibility-statement":
      return `Accessibility statement${suffix}`;
    case "privacy-policy":
      return `Privacy policy and data protection${suffix}`;
    case "search":
      return `Search results${suffix}`;
    case "not-found":
      return `Page not found${suffix}`;
  }
}

/**
 * Builds breadcrumb trail from Route hierarchy
 */
export function getBreadcrumbTrail(route: Route): BreadcrumbItem[] {
  // Common root items
  const rootMinistry: BreadcrumbItem = {
    label: "Ministry of Homeland Security",
    path: "https://homelandsecurity.gov.tt",
  };

  const ttcsirtHome: BreadcrumbItem = {
    label: "TT-CSIRT",
    path: "/",
  };

  switch (route.type) {
    case "home":
      return [
        rootMinistry,
        { label: "TT-CSIRT", isCurrent: true },
      ];

    case "services":
      return [
        rootMinistry,
        ttcsirtHome,
        { label: "Services", isCurrent: true },
      ];

    case "service-incident-response":
      return [
        rootMinistry,
        ttcsirtHome,
        { label: "Services", path: "/services" },
        { label: "Incident response", isCurrent: true },
      ];

    case "report-incident":
      return [
        rootMinistry,
        ttcsirtHome,
        { label: "Services", path: "/services" },
        { label: "Report a cyber security incident", isCurrent: true },
      ];

    case "service-proactive-risk":
      return [
        rootMinistry,
        ttcsirtHome,
        { label: "Services", path: "/services" },
        { label: "Proactive risk exposure management", isCurrent: true },
      ];

    case "service-detail":
      return [
        rootMinistry,
        ttcsirtHome,
        { label: "Services", path: "/services" },
        { label: "Service", isCurrent: true },
      ];

    case "advisories":
      return [
        rootMinistry,
        ttcsirtHome,
        { label: "Advisories & alerts", isCurrent: true },
      ];

    case "advisory-detail":
      return [
        rootMinistry,
        ttcsirtHome,
        { label: "Advisories & alerts", path: "/advisories" },
        { label: "Advisory", isCurrent: true },
      ];

    case "guidance":
      return [
        rootMinistry,
        ttcsirtHome,
        { label: "Guidance", isCurrent: true },
      ];

    case "guidance-detail": {
      const summary = getGuidanceSummaryBySlug(route.slug);
      return [
        rootMinistry,
        ttcsirtHome,
        { label: "Guidance", path: "/guidance" },
        { label: summary ? summary.title : "Guide", isCurrent: true },
      ];
    }

    case "news-events":
      return [
        rootMinistry,
        ttcsirtHome,
        { label: "News & events", isCurrent: true },
      ];

    case "news":
      return [
        rootMinistry,
        ttcsirtHome,
        { label: "News & events", path: "/news-events" },
        { label: "News", isCurrent: true },
      ];

    case "news-detail": {
      const item = getEditorialItemBySlug(route.slug);
      return [
        rootMinistry,
        ttcsirtHome,
        { label: "News & events", path: "/news-events" },
        { label: "News", path: "/news" },
        { label: item ? item.title : "News details", isCurrent: true },
      ];
    }

    case "events":
      return [
        rootMinistry,
        ttcsirtHome,
        { label: "News & events", path: "/news-events" },
        { label: "Events", isCurrent: true },
      ];

    case "event-detail": {
      const item = getEditorialItemBySlug(route.slug);
      return [
        rootMinistry,
        ttcsirtHome,
        { label: "News & events", path: "/news-events" },
        { label: "Events", path: "/events" },
        { label: item ? item.title : "Event details", isCurrent: true },
      ];
    }

    case "training":
      return [
        rootMinistry,
        ttcsirtHome,
        { label: "News & events", path: "/news-events" },
        { label: "Training & education", isCurrent: true },
      ];

    case "training-detail": {
      const item = getEditorialItemBySlug(route.slug);
      return [
        rootMinistry,
        ttcsirtHome,
        { label: "News & events", path: "/news-events" },
        { label: "Training & education", path: "/training" },
        { label: item ? item.title : "Training program", isCurrent: true },
      ];
    }

    case "workshop-detail": {
      const item = getEditorialItemBySlug(route.slug);
      return [
        rootMinistry,
        ttcsirtHome,
        { label: "News & events", path: "/news-events" },
        { label: "Events & workshops", path: "/events" },
        { label: item ? item.title : "Workshop details", isCurrent: true },
      ];
    }

    case "statistics":
      return [
        rootMinistry,
        ttcsirtHome,
        { label: "Statistics", isCurrent: true },
      ];

    case "about":
      return [
        rootMinistry,
        ttcsirtHome,
        { label: "About TT-CSIRT", isCurrent: true },
      ];

    case "strategy":
      return [
        rootMinistry,
        ttcsirtHome,
        { label: "About TT-CSIRT", path: "/about" },
        { label: "National Cyber Security Strategy", isCurrent: true },
      ];

    case "contact":
      return [
        rootMinistry,
        ttcsirtHome,
        { label: "About TT-CSIRT", path: "/about" },
        { label: "Contact", isCurrent: true },
      ];

    case "accessibility-statement":
      return [
        rootMinistry,
        ttcsirtHome,
        { label: "Accessibility statement", isCurrent: true },
      ];

    case "privacy-policy":
      return [
        rootMinistry,
        ttcsirtHome,
        { label: "Privacy policy", isCurrent: true },
      ];

    case "search":
      return [
        rootMinistry,
        ttcsirtHome,
        { label: "Search results", isCurrent: true },
      ];

    case "not-found":
      return [
        rootMinistry,
        ttcsirtHome,
        { label: "Page not found", isCurrent: true },
      ];
  }
}

export function getDocumentTitle(route: Route): string {
  switch (route.type) {
    case "home":
      return "TT-CSIRT | Trinidad and Tobago Cyber Security Incident Response Team";
    case "services":
      return "Cyber security services - TT-CSIRT";
    case "service-incident-response":
      return "Incident response service - TT-CSIRT";
    case "report-incident":
      return "Report a cyber security incident - TT-CSIRT";
    case "service-proactive-risk":
      return "Proactive risk exposure management - TT-CSIRT";
    case "service-detail":
      return "Service details - TT-CSIRT";
    case "advisories":
      return "Cyber security advisories and alerts - TT-CSIRT";
    case "advisory-detail":
      return "Advisory - TT-CSIRT";
    case "guidance":
      return "Cyber security guidance - TT-CSIRT";
    case "guidance-detail": {
      const summary = getGuidanceSummaryBySlug(route.slug);
      return `${summary ? summary.title : "Guidance document"} - TT-CSIRT`;
    }
    case "news-events":
      return "News, events and training - TT-CSIRT";
    case "news":
      return "News - TT-CSIRT";
    case "news-detail": {
      const item = getEditorialItemBySlug(route.slug);
      return `${item ? item.title : "News details"} - TT-CSIRT`;
    }
    case "events":
      return "Events - TT-CSIRT";
    case "event-detail": {
      const item = getEditorialItemBySlug(route.slug);
      return `${item ? item.title : "Event details"} - TT-CSIRT`;
    }
    case "training":
      return "Cyber training and education - TT-CSIRT";
    case "training-detail": {
      const item = getEditorialItemBySlug(route.slug);
      return `${item ? item.title : "Training program"} - TT-CSIRT`;
    }
    case "workshop-detail": {
      const item = getEditorialItemBySlug(route.slug);
      return `${item ? item.title : "Workshop details"} - TT-CSIRT`;
    }
    case "statistics":
      return "National cyber incident statistics - TT-CSIRT";
    case "about":
      return "About TT-CSIRT - TT-CSIRT";
    case "strategy":
      return "National Cyber Security Strategy - TT-CSIRT";
    case "contact":
      return "Contact TT-CSIRT - TT-CSIRT";
    case "accessibility-statement":
      return "Accessibility statement - TT-CSIRT";
    case "privacy-policy":
      return "Privacy policy and data protection - TT-CSIRT";
    case "search":
      return `Search results${route.query ? ` for "${route.query}"` : ""} - TT-CSIRT`;
    case "not-found":
      return "Page not found - TT-CSIRT";
    default:
      return "TT-CSIRT | Trinidad and Tobago Cyber Security Incident Response Team";
  }
}

export function getCanonicalPath(route: Route): string {
  switch (route.type) {
    case "home":
      return "/";
    case "services":
      return "/services";
    case "service-incident-response":
      return "/services/incident-response";
    case "report-incident":
      return "/report-an-incident";
    case "service-proactive-risk":
      return "/services/proactive-risk-management";
    case "service-detail":
      return `/services/${route.slug}`;
    case "advisories":
      return "/advisories";
    case "advisory-detail":
      return `/advisories/${encodeURIComponent(route.id)}`;
    case "guidance":
      return "/guidance";
    case "guidance-detail":
      return `/guidance/${encodeURIComponent(route.slug)}`;
    case "news-events":
      return "/news-events";
    case "news":
      return "/news";
    case "news-detail":
      return `/news/${encodeURIComponent(route.slug)}`;
    case "events":
      return "/events";
    case "event-detail":
      return `/events/${encodeURIComponent(route.slug)}`;
    case "training":
      return "/training";
    case "training-detail":
      return `/training/${encodeURIComponent(route.slug)}`;
    case "workshop-detail":
      return `/workshops/${encodeURIComponent(route.slug)}`;
    case "statistics":
      return "/statistics";
    case "about":
      return "/about";
    case "strategy":
      return "/national-cyber-security-strategy";
    case "contact":
      return "/contact";
    case "accessibility-statement":
      return "/accessibility-statement";
    case "privacy-policy":
      return "/privacy-policy";
    case "search":
      return route.query ? `/search?q=${encodeURIComponent(route.query)}` : "/search";
    case "not-found":
      return route.pathname;
    default:
      return "/";
  }
}
