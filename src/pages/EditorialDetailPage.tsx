import { PageNavigation } from "@/components/PageNavigation";
import { Button } from "@/components/gcds/Button";
import { EditorialItem, getEditorialItemBySlug, getEditorialItemUrl } from "@/services/newsEventsContent";

interface EditorialDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export function EditorialDetailPage({ slug, onNavigate }: EditorialDetailPageProps) {
  const item: EditorialItem | undefined = getEditorialItemBySlug(slug);

  if (!item) {
    return (
      <div className="govuk-grid-row app-page-grid-row">
        <div className="govuk-grid-column-two-thirds app-page-content">
          <a
            href="/news-events"
            className="govuk-back-link"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("/news-events");
            }}
          >
            Back to News, events and training
          </a>

          <h1 className="govuk-heading-xl govuk-!-margin-top-4">
            Content item not found
          </h1>

          <p className="govuk-body-l">
            The requested update or announcement could not be located. It may have been relocated or updated.
          </p>

          <p className="govuk-body">
            You can return to the main catalogue to browse all current announcements, technical events, and training opportunities:
          </p>

          <p className="govuk-body">
            <Button
              type="link"
              role="primary"
              href="/news-events"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("/news-events");
              }}
            >
              Return to News, events and training
            </Button>
          </p>
        </div>
      </div>
    );
  }

  // Determine back destination based on content type
  const backHref =
    item.type === "news"
      ? "/news"
      : item.type === "event" || item.type === "workshop"
      ? "/events"
      : "/training";

  const backLabel =
    item.type === "news"
      ? "Back to News"
      : item.type === "event" || item.type === "workshop"
      ? "Back to Events and workshops"
      : "Back to Training and education";

  const navItems = [
    { id: "overview-section", label: "Overview" },
    ...(item.audience ? [{ id: "audience-section", label: "Target audience" }] : []),
    ...(item.purpose ? [{ id: "purpose-section", label: "Purpose & objectives" }] : []),
    ...(item.keyHighlights && item.keyHighlights.length > 0
      ? [{ id: "highlights-section", label: "Key highlights" }]
      : []),
    ...(item.bodyParagraphs && item.bodyParagraphs.length > 1
      ? [{ id: "details-section", label: "Full details" }]
      : []),
    { id: "contact-section", label: "Enquiries & contact" },
  ];

  return (
    <div className="govuk-grid-row app-page-grid-row">
      <PageNavigation navItems={navItems} />

      <div className="govuk-grid-column-two-thirds app-page-content">
        <a
          href={backHref}
          className="govuk-back-link"
          onClick={(e) => {
            e.preventDefault();
            onNavigate(backHref);
          }}
        >
          {backLabel}
        </a>

        <span className="govuk-caption-xl govuk-!-margin-top-4">{item.tag}</span>
        <h1 className="govuk-heading-xl govuk-!-margin-top-0" id="editorial-main-heading">
          {item.title}
        </h1>

        <p className="govuk-body-s app-neutral-secondary govuk-!-margin-bottom-4">
          Published {item.date}
        </p>

        <p className="govuk-body-l">{item.summary}</p>

        {item.status && (
          <div className="govuk-inset-text">
            <p className="govuk-body govuk-!-margin-bottom-0">
              <strong>Status:</strong> {item.status}
              {item.location && (
                <>
                  <br />
                  <strong>Location:</strong> {item.location}
                </>
              )}
              {item.format && (
                <>
                  <br />
                  <strong>Format:</strong> {item.format}
                </>
              )}
            </p>
          </div>
        )}

        <section id="overview-section" aria-labelledby="overview-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="overview-heading">
            Overview
          </h2>
          <p className="govuk-body">{item.bodyParagraphs[0]}</p>
        </section>

        {item.audience && (
          <>
            <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />
            <section id="audience-section" aria-labelledby="audience-heading" className="govuk-!-margin-bottom-8">
              <h2 className="govuk-heading-l" id="audience-heading">
                Target audience
              </h2>
              <p className="govuk-body">{item.audience}</p>
            </section>
          </>
        )}

        {item.purpose && (
          <>
            <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />
            <section id="purpose-section" aria-labelledby="purpose-heading" className="govuk-!-margin-bottom-8">
              <h2 className="govuk-heading-l" id="purpose-heading">
                Purpose &amp; objectives
              </h2>
              <p className="govuk-body">{item.purpose}</p>
              {item.organizers && item.organizers.length > 0 && (
                <div className="govuk-!-margin-top-4">
                  <h3 className="govuk-heading-s govuk-!-margin-bottom-2">
                    Delivered in partnership with:
                  </h3>
                  <ul className="govuk-list govuk-list--bullet">
                    {item.organizers.map((org, index) => (
                      <li key={index}>{org}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </>
        )}

        {item.keyHighlights && item.keyHighlights.length > 0 && (
          <>
            <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />
            <section id="highlights-section" aria-labelledby="highlights-heading" className="govuk-!-margin-bottom-8">
              <h2 className="govuk-heading-l" id="highlights-heading">
                Key highlights
              </h2>
              <ul className="govuk-list govuk-list--bullet">
                {item.keyHighlights.map((highlight, index) => (
                  <li key={index}>{highlight}</li>
                ))}
              </ul>
            </section>
          </>
        )}

        {item.bodyParagraphs && item.bodyParagraphs.length > 1 && (
          <>
            <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />
            <section id="details-section" aria-labelledby="details-heading" className="govuk-!-margin-bottom-8">
              <h2 className="govuk-heading-l" id="details-heading">
                Full details &amp; background
              </h2>
              {item.bodyParagraphs.slice(1).map((paragraph, index) => (
                <p key={index} className="govuk-body">
                  {paragraph}
                </p>
              ))}
            </section>
          </>
        )}

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        <section id="contact-section" aria-labelledby="contact-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="contact-heading">
            Enquiries &amp; contact
          </h2>
          <p className="govuk-body">
            For questions, registration details, or further information regarding this {item.tag.toLowerCase()}:
          </p>
          <div className="govuk-inset-text">
            <p className="govuk-body govuk-!-margin-bottom-1">
              <strong>Email:</strong>{" "}
              <a href={`mailto:${item.contactEmail || "contacts@ttcsirt.gov.tt"}`} className="govuk-link">
                {item.contactEmail || "contacts@ttcsirt.gov.tt"}
              </a>
            </p>
            <p className="govuk-body govuk-!-margin-bottom-0">
              <strong>Telephone:</strong> {item.contactPhone || "+1 (868) 625-7937"}
            </p>
          </div>

          <p className="govuk-body-s govuk-!-margin-top-6">
            <a
              href="/news-events"
              className="govuk-link"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("/news-events");
              }}
            >
              Browse all News, events and training updates
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
