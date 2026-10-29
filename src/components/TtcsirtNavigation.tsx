import React, { useEffect, useId, useLayoutEffect, useRef } from "react";
import { resolveRoute } from "@/routing/routes";
import "./ttcsirt-navigation.css";

export type NavigationLink = {
  id?: string;
  label: string;
  href: string;
};

export type NavigationSection = {
  id: string;
  title: string;
  links: NavigationLink[];
};

// Backward-compatible type export
export type NavigationItem = NavigationSection;

export type TtcsirtNavigationProps = {
  currentPath: string;
  onNavigate: (path: string) => void;
  mobileOpen?: boolean;
  onMobileToggle?: () => void;
  mobileMenuId?: string;
  searchOpen?: boolean;
  onToggleSearch?: () => void;
  searchPanelId?: string;
  searchToggleRef?: React.RefObject<HTMLButtonElement | null>;
};

export const NAVIGATION: NavigationSection[] = [
  {
    id: "services",
    title: "Services",
    links: [
      {
        id: "services",
        label: "All services",
        href: "/services",
      },
      {
        id: "report-incident",
        label: "Incident reporting",
        href: "/report-an-incident",
      },
      {
        id: "advisories",
        label: "Cyber security advisories",
        href: "/advisories",
      },
      {
        id: "service-proactive-risk",
        label: "Proactive risk management",
        href: "/services/proactive-risk-management",
      },
    ],
  },
  {
    id: "guidance",
    title: "Guidance",
    links: [
      {
        id: "guidance",
        label: "All guidance",
        href: "/guidance",
      },
      {
        id: "guidance-ransomware",
        label: "Ransomware response",
        href: "/guidance/ransomware-prevention-response",
      },
      {
        id: "guidance-dpa",
        label: "Data protection (DPA)",
        href: "/guidance/data-protection-security",
      },
      {
        id: "guidance-taxonomy",
        label: "Incident taxonomy",
        href: "/guidance/national-cyber-security-incident-taxonomy",
      },
    ],
  },
  {
    id: "news-events",
    title: "News & events",
    links: [
      {
        id: "news-events",
        label: "All news & events",
        href: "/news-events",
      },
      {
        id: "news",
        label: "News",
        href: "/news",
      },
      {
        id: "events",
        label: "Events",
        href: "/events",
      },
      {
        id: "training",
        label: "Training & education",
        href: "/training",
      },
    ],
  },
  {
    id: "statistics",
    title: "Statistics",
    links: [
      {
        id: "statistics",
        label: "Incident statistics",
        href: "/statistics",
      },
    ],
  },
];

function isLinkActive(
  link: NavigationLink,
  currentPath: string,
  currentRoute: ReturnType<typeof resolveRoute>
): boolean {
  if (currentPath === link.href) return true;
  switch (link.id) {
    case "services":
      return currentRoute.type === "services";
    case "report-incident":
      return currentRoute.type === "report-incident";
    case "advisories":
      return currentRoute.type === "advisories" || currentRoute.type === "advisory-detail";
    case "service-proactive-risk":
      return currentRoute.type === "service-proactive-risk";
    case "guidance":
      return currentRoute.type === "guidance";
    case "guidance-ransomware":
      return currentPath === "/guidance/ransomware-prevention-response";
    case "guidance-dpa":
      return currentPath === "/guidance/data-protection-security";
    case "guidance-taxonomy":
      return currentPath === "/guidance/national-cyber-security-incident-taxonomy";
    case "news-events":
      return currentRoute.type === "news-events";
    case "news":
      return currentRoute.type === "news" || currentRoute.type === "news-detail";
    case "events":
      return (
        currentRoute.type === "events" ||
        currentRoute.type === "event-detail" ||
        currentRoute.type === "workshop-detail"
      );
    case "training":
      return currentRoute.type === "training" || currentRoute.type === "training-detail";
    case "statistics":
      return currentRoute.type === "statistics";
    default:
      return currentPath.startsWith(`${link.href}/`);
  }
}

export default function TtcsirtNavigation({
  currentPath,
  onNavigate,
  mobileOpen: mobileOpenProp,
  onMobileToggle,
  mobileMenuId: mobileMenuIdProp,
}: TtcsirtNavigationProps) {
  const rootRef = useRef<HTMLElement>(null);
  const generatedMobileMenuId = useId();

  const isMenuOpen = mobileOpenProp ?? false;
  const mobileMenuId = mobileMenuIdProp || generatedMobileMenuId;

  const currentRoute = resolveRoute(currentPath);

  useLayoutEffect(() => {
    if (rootRef.current) {
      rootRef.current.inert = !isMenuOpen;
    }
  }, [isMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (onMobileToggle && isMenuOpen) {
          onMobileToggle();
          const menuBtn = document.querySelector<HTMLButtonElement>(".ttcsirt-header-menu-toggle");
          menuBtn?.focus();
        }
      }
    };

    if (isMenuOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen, onMobileToggle]);

  const activateLink = (href: string) => {
    onNavigate(href);
    if (onMobileToggle && isMenuOpen) {
      onMobileToggle();
    }
  };

  return (
    <nav
      ref={rootRef}
      id={mobileMenuId}
      className={`ttcsirt-navigation${isMenuOpen ? " ttcsirt-navigation--open" : ""}`}
      aria-label="TT-CSIRT service navigation"
      aria-hidden={!isMenuOpen}
    >
      <div className="govuk-width-container ttcsirt-navigation__inner">
        <div className="ttcsirt-navigation__grid ttcsirt-navigation__list">
          {NAVIGATION.map((section) => (
            <div
              key={section.title}
              className="ttcsirt-navigation__column ttcsirt-navigation__item"
            >
              <h2
                id={`ttcsirt-nav-heading-${section.id}`}
                className="govuk-heading-m ttcsirt-navigation__column-heading"
                tabIndex={-1}
              >
                {section.title}
              </h2>

              <ul
                className="govuk-list ttcsirt-navigation__links-list ttcsirt-navigation__sub-list"
                aria-labelledby={`ttcsirt-nav-heading-${section.id}`}
              >
                {section.links.map((link) => {
                  const isCurrent = isLinkActive(link, currentPath, currentRoute);

                  return (
                    <li
                      key={link.href}
                      className={`ttcsirt-navigation__link-item ttcsirt-navigation__sub-item${
                        isCurrent ? " ttcsirt-navigation__sub-item--active" : ""
                      }`}
                    >
                      <a
                        href={link.href}
                        className={`govuk-link ttcsirt-navigation__link ttcsirt-navigation__sub-link${
                          isCurrent
                            ? " ttcsirt-navigation__link--current ttcsirt-navigation__sub-link--current"
                            : ""
                        }`}
                        aria-current={isCurrent ? "page" : undefined}
                        onClick={(event) => {
                          if (
                            event.button !== 0 ||
                            event.metaKey ||
                            event.ctrlKey ||
                            event.shiftKey ||
                            event.altKey
                          ) {
                            return;
                          }

                          event.preventDefault();
                          activateLink(link.href);
                        }}
                      >
                        {link.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}

export { TtcsirtNavigation };
