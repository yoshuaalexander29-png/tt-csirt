import { useState, useEffect } from "react";

export interface NavItem {
  id: string;
  label: string;
  isSubItem?: boolean;
}

interface PageNavigationProps {
  navItems: NavItem[];
  defaultActiveId?: string;
  ariaLabel?: string;
}

export function PageNavigation({ navItems, defaultActiveId, ariaLabel = "On this page" }: PageNavigationProps) {
  const [activeSection, setActiveSection] = useState(defaultActiveId || navItems[0]?.id || "");

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && navItems.some((item) => item.id === hash)) {
        setActiveSection(hash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    if (window.location.hash) {
      handleHashChange();
    }

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const offsets = navItems.map((item) => {
            const el = document.getElementById(item.id);
            if (!el) return { id: item.id, offset: Infinity };
            return { id: item.id, offset: el.getBoundingClientRect().top };
          });

          // Offset of 150px to trigger just before it hits the top navigation
          const pastItems = offsets.filter((item) => item.offset <= 150);

          if (pastItems.length > 0) {
            // The last item in the DOM order that is above the threshold
            setActiveSection(pastItems[pastItems.length - 1].id);
          } else if (offsets.length > 0) {
            // If at the very top, highlight the first item
            setActiveSection(offsets[0].id);
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Trigger once on mount
    handleScroll();

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [navItems]);

  return (
    <nav className="govuk-grid-column-one-third app-page-nav" aria-label={ariaLabel}>
      {/* On mobile this appears as a disclosure; on desktop it is a sticky sidebar */}
      <div className="app-page-nav__container">
        <div className="app-page-nav__desktop">
          <p className="govuk-heading-s govuk-!-margin-bottom-2">On this page</p>
          <ul className="govuk-list">
            {navItems.map((item) => {
              const isCurrent = activeSection === item.id;
              return (
                <li
                  key={item.id}
                  className={`govuk-!-margin-bottom-2${item.isSubItem ? " govuk-!-padding-left-3" : ""}`}
                >
                  <a
                    className={`govuk-link${isCurrent ? " govuk-link--no-visited-state govuk-!-font-weight-bold" : ""}`}
                    href={`#${item.id}`}
                    aria-current={isCurrent ? "true" : undefined}
                    onClick={() => setActiveSection(item.id)}
                    style={isCurrent ? { fontWeight: "bold" } : undefined}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <details className="app-page-nav__mobile">
          <summary className="app-page-nav__mobile-summary">On this page</summary>
          <ul className="govuk-list">
            {navItems.map((item) => {
              const isCurrent = activeSection === item.id;
              return (
                <li
                  key={item.id}
                  className={item.isSubItem ? "govuk-!-padding-left-3" : undefined}
                >
                  <a
                    className={`govuk-link${isCurrent ? " govuk-link--no-visited-state govuk-!-font-weight-bold" : ""}`}
                    href={`#${item.id}`}
                    aria-current={isCurrent ? "true" : undefined}
                    onClick={(event) => {
                      setActiveSection(item.id);
                      const disclosure = event.currentTarget.closest("details");
                      if (disclosure) disclosure.open = false;
                    }}
                    style={isCurrent ? { fontWeight: "bold" } : undefined}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </details>
      </div>
    </nav>
  );
}
