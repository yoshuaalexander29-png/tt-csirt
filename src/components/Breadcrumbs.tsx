import type { MouseEvent } from "react";
import { Route, getBreadcrumbTrail } from "@/routing/routes";

interface BreadcrumbsProps {
  currentRoute: Route;
  onNavigate: (path: string) => void;
}

export function Breadcrumbs({ currentRoute, onNavigate }: BreadcrumbsProps) {
  if (currentRoute.type === "home") return null;

  const items = getBreadcrumbTrail(currentRoute)
    .filter((item) => !item.isCurrent && item.path !== "https://homelandsecurity.gov.tt")
    .map((item, index) => index === 0 && item.path === "/" ? { ...item, label: "Home" } : item);

  const navigate = (event: MouseEvent<HTMLAnchorElement>, href: string, isExternal: boolean) => {
    if (isExternal || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(href);
  };

  return (
    <nav className="govuk-breadcrumbs app-breadcrumbs" aria-label="Breadcrumb">
      <ol className="govuk-breadcrumbs__list">
      {items.map((item, index) => {
        const href = item.path || "/";
        const isExternal = href.startsWith("http");
        return (
          <li className="govuk-breadcrumbs__list-item" key={`${href}-${index}`}>
            <a className="govuk-breadcrumbs__link" href={href} onClick={(event) => navigate(event, href, isExternal)}>
              {item.label}
            </a>
          </li>
        );
      })}
      </ol>
    </nav>
  );
}
