import { useState, useEffect } from "react";
import { PageNavigation } from "@/components/PageNavigation";
import { Button } from "@/components/gcds/Button";
import {
  EDITORIAL_ITEMS,
  EditorialContentType,
  EditorialItem,
  getEditorialItemUrl,
} from "@/services/newsEventsContent";

interface NewsEventsPageProps {
  onNavigate: (path: string) => void;
  initialFilter?: "all" | "news" | "event" | "training" | "workshop";
}

const NEWS_EVENTS_NAV_ITEMS = [
  { id: "filter-controls", label: "Filter updates" },
  { id: "all-updates", label: "Latest updates" },
  { id: "contact-press", label: "Press and enquiries" },
];

export function NewsEventsPage({ onNavigate, initialFilter = "all" }: NewsEventsPageProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | EditorialContentType>(initialFilter);

  useEffect(() => {
    if (initialFilter) {
      setActiveFilter(initialFilter);
    }
  }, [initialFilter]);

  const filteredItems =
    activeFilter === "all"
      ? EDITORIAL_ITEMS
      : EDITORIAL_ITEMS.filter((item) => item.type === activeFilter);

  const getActionLinkText = (item: EditorialItem): string => {
    switch (item.type) {
      case "training":
        return "Read training details and registration requirements";
      case "event":
        return "Read event details and participation information";
      case "workshop":
        return "Read workshop objectives and session details";
      case "news":
        return "Read full announcement";
    }
  };

  return (
    <div className="govuk-grid-row app-page-grid-row">
      <PageNavigation navItems={NEWS_EVENTS_NAV_ITEMS} />

      <div className="govuk-grid-column-two-thirds app-page-content">
        <h1 className="govuk-heading-xl" id="news-events-main-heading">
          News, events and training
        </h1>

        <p className="govuk-body-l">
          National cybersecurity announcements, inter-agency agreements, upcoming technical workshops, and workforce training opportunities from TT-CSIRT.
        </p>

        <div className="govuk-inset-text">
          <p className="govuk-body govuk-!-margin-bottom-0">
            Looking for vulnerability advisories or technical CVE disclosures? Visit{" "}
            <a
              href="/advisories"
              className="govuk-link"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("/advisories");
              }}
            >
              Cyber security advisories and alerts
            </a>.
          </p>
        </div>

        {/* Filter controls */}
        <section id="filter-controls" aria-labelledby="filter-heading" className="govuk-!-margin-bottom-6">
          <h2 className="govuk-heading-s govuk-!-margin-bottom-2" id="filter-heading">
            Filter by update type:
          </h2>
          <div className="govuk-button-group" role="group" aria-label="Filter updates">
            <Button
              type="button"
              role={activeFilter === "all" ? "primary" : "secondary"}
              onClick={() => setActiveFilter("all")}
              ariaPressed={activeFilter === "all"}
            >
              All updates ({EDITORIAL_ITEMS.length})
            </Button>
            <Button
              type="button"
              role={activeFilter === "news" ? "primary" : "secondary"}
              onClick={() => setActiveFilter("news")}
              ariaPressed={activeFilter === "news"}
            >
              News ({EDITORIAL_ITEMS.filter((i) => i.type === "news").length})
            </Button>
            <Button
              type="button"
              role={activeFilter === "event" ? "primary" : "secondary"}
              onClick={() => setActiveFilter("event")}
              ariaPressed={activeFilter === "event"}
            >
              Events ({EDITORIAL_ITEMS.filter((i) => i.type === "event").length})
            </Button>
            <Button
              type="button"
              role={activeFilter === "training" ? "primary" : "secondary"}
              onClick={() => setActiveFilter("training")}
              ariaPressed={activeFilter === "training"}
            >
              Training ({EDITORIAL_ITEMS.filter((i) => i.type === "training").length})
            </Button>
            <Button
              type="button"
              role={activeFilter === "workshop" ? "primary" : "secondary"}
              onClick={() => setActiveFilter("workshop")}
              ariaPressed={activeFilter === "workshop"}
            >
              Workshops ({EDITORIAL_ITEMS.filter((i) => i.type === "workshop").length})
            </Button>
          </div>
        </section>

        <hr className="govuk-section-break govuk-section-break--m govuk-section-break--visible" />

        {/* Updates Listing */}
        <section id="all-updates" aria-labelledby="updates-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="updates-heading">
            {activeFilter === "all"
              ? "All updates"
              : activeFilter === "news"
              ? "News and announcements"
              : activeFilter === "event"
              ? "Events"
              : activeFilter === "training"
              ? "Training and education programs"
              : "Workshops"}
          </h2>

          <ul className="govuk-list">
            {filteredItems.map((item) => {
              const canonicalUrl = getEditorialItemUrl(item);
              const actionText = getActionLinkText(item);

              return (
                <li key={item.id} className="govuk-!-margin-bottom-6 app-border-bottom-divider">
                  <p className="govuk-body-s app-neutral-secondary govuk-!-margin-bottom-2">
                    <span className="govuk-!-font-weight-bold">{item.tag}</span>
                    <span aria-hidden="true"> • </span>
                    <span>Published {item.date}</span>
                  </p>

                  <h3 className="govuk-heading-m govuk-!-margin-bottom-2">
                    <a
                      href={canonicalUrl}
                      className="govuk-link"
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(canonicalUrl);
                      }}
                    >
                      {item.title}
                    </a>
                  </h3>

                  <p className="govuk-body">{item.summary}</p>

                  <p className="govuk-body-s">
                    <a
                      href={canonicalUrl}
                      className="govuk-link"
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(canonicalUrl);
                      }}
                    >
                      {actionText}
                    </a>
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="contact-press" aria-labelledby="press-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="press-heading">
            Press and media enquiries
          </h2>
          <p className="govuk-body">
            For media enquiries, interview requests, or official statements regarding national cybersecurity matters:
          </p>
          <div className="govuk-inset-text">
            <p className="govuk-body govuk-!-margin-bottom-1">
              <strong>Email:</strong>{" "}
              <a href="mailto:contacts@ttcsirt.gov.tt" className="govuk-link">
                contacts@ttcsirt.gov.tt
              </a>
            </p>
            <p className="govuk-body govuk-!-margin-bottom-0">
              <strong>Telephone:</strong> +1 (868) 625-7937
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
