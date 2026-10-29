import { PageNavigation } from "@/components/PageNavigation";
import { HyperlinkList } from "@/components/HyperlinkList";
import { GcdsDataTable } from "@/components/GcdsDataTable";
import { Button } from "@/components/gcds/Button";
import {
  getGuidanceArticleBySlug,
  getGuidanceSummaryBySlug,
  GuidanceArticle,
  GuidanceSummary,
} from "@/services/guidanceContent";

interface GuidanceDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export function GuidanceDetailPage({ slug, onNavigate }: GuidanceDetailPageProps) {
  const article: GuidanceArticle | undefined = getGuidanceArticleBySlug(slug);
  const summary: GuidanceSummary | undefined = getGuidanceSummaryBySlug(slug);

  if (!article) {
    return (
      <div className="govuk-grid-row app-page-grid-row">
        <div className="govuk-grid-column-two-thirds app-page-content">
          <a
            href="/guidance"
            className="govuk-back-link"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("/guidance");
            }}
          >
            Back to Cyber security guidance
          </a>

          <h1 className="govuk-heading-xl govuk-!-margin-top-4">
            Guidance document not found
          </h1>

          <p className="govuk-body-l">
            The requested guidance document could not be located. It may have been moved or updated in the national guidance library.
          </p>

          <p className="govuk-body">
            You can return to the main guidance library to browse all published cybersecurity guidance, frameworks, and procedural checklists:
          </p>

          <p className="govuk-body">
            <Button
              type="link"
              role="primary"
              href="/guidance"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("/guidance");
              }}
            >
              Return to Guidance library
            </Button>
          </p>
        </div>
      </div>
    );
  }

  // Build side navigation items from article structure
  const navItems = [
    { id: "overview-actions", label: "Purpose & key actions" },
    ...article.sections.map((section) => ({
      id: section.id,
      label: section.title,
    })),
    ...(article.checklist ? [{ id: "action-checklist", label: "Practical checklist" }] : []),
    { id: "reporting-assistance", label: "When to seek help" },
    { id: "related-guidance", label: "Related guidance" },
    { id: "sources-provenance", label: "Sources & provenance" },
  ];

  return (
    <div className="govuk-grid-row app-page-grid-row">
      <PageNavigation navItems={navItems} />

      <div className="govuk-grid-column-two-thirds app-page-content">
        <a
          href="/guidance"
          className="govuk-back-link"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("/guidance");
          }}
        >
          Back to Cyber security guidance
        </a>

        {/* Primary Page Title (H1) */}
        <div className="govuk-!-margin-top-4">
          <h1 className="govuk-heading-xl govuk-!-margin-bottom-4" id="guidance-article-title">
            {article.title}
          </h1>
        </div>

        {/* Short Purpose Statement */}
        <p className="govuk-body-l">
          {article.shortPurpose}
        </p>

        {/* Document metadata: restrained, authoritative GDS metadata */}
        <div className="app-c-metadata govuk-!-margin-bottom-6">
          <dl className="app-c-metadata__list">
            <div className="app-c-metadata__item">
              <dt className="app-c-metadata__term">Audience</dt>
              <dd className="app-c-metadata__definition">{article.audienceDescription || article.audienceLabel}</dd>
            </div>
            <div className="app-c-metadata__item">
              <dt className="app-c-metadata__term">Last reviewed</dt>
              <dd className="app-c-metadata__definition">{article.lastReviewed}</dd>
            </div>
            {summary?.primarySource && (
              <div className="app-c-metadata__item">
                <dt className="app-c-metadata__term">Primary source</dt>
                <dd className="app-c-metadata__definition">{summary.primarySource}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* At a glance / Key actions */}
        <section id="overview-actions" aria-labelledby="key-actions-heading" className="govuk-!-margin-bottom-8">
          <h2 className="govuk-heading-l" id="key-actions-heading">
            At a glance: key actions
          </h2>
          <p className="govuk-body">
            Priority recommendations recommended by TT-CSIRT and authoritative cybersecurity frameworks:
          </p>
          <ul className="govuk-list govuk-list--bullet">
            {article.keyActions.map((action, idx) => (
              <li key={idx}>{action}</li>
            ))}
          </ul>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        {/* Main Content Sections */}
        {article.sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={`${section.id}-heading`}
            className="govuk-!-margin-bottom-8"
          >
            <h2 className="govuk-heading-l" id={`${section.id}-heading`}>
              {section.title}
            </h2>

            {section.lead && (
              <p className="govuk-body-l govuk-!-margin-bottom-4">
                {section.lead}
              </p>
            )}

            {section.paragraphs?.map((p, idx) => (
              <p key={idx} className="govuk-body">
                {p}
              </p>
            ))}

            {section.list && section.list.length > 0 && (
              <ul className="govuk-list govuk-list--bullet">
                {section.list.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            )}

            {section.subsections?.map((sub, sIdx) => (
              <div key={sIdx} className="govuk-!-margin-top-6">
                <h3 className="govuk-heading-m">
                  {sub.title}
                </h3>
                {sub.paragraphs?.map((p, pIdx) => (
                  <p key={pIdx} className="govuk-body">
                    {p}
                  </p>
                ))}
                {sub.callout && (
                  <div className="govuk-inset-text">
                    <p className="govuk-body govuk-!-margin-bottom-0">
                      {sub.callout}
                    </p>
                  </div>
                )}
                {sub.list && sub.list.length > 0 && (
                  <ul className="govuk-list govuk-list--bullet">
                    {sub.list.map((item, lIdx) => (
                      <li key={lIdx}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        ))}

        {/* Practical Checklist Table (if provided) */}
        {article.checklist && (
          <>
            <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />
            <section
              id="action-checklist"
              aria-labelledby="checklist-heading"
              className="govuk-!-margin-bottom-8"
            >
              <h2 className="govuk-heading-l" id="checklist-heading">
                {article.checklist.title}
              </h2>
              {article.checklist.description && (
                <p className="govuk-body">{article.checklist.description}</p>
              )}

              <GcdsDataTable
                caption={`${article.checklist.title}: action items, implementation details and priorities`}
                labelledBy="checklist-heading"
                columns={[
                  { field: "action", header: "Action item", rowHeader: true },
                  { field: "detail", header: "Implementation detail" },
                  { field: "priority", header: "Priority" },
                ]}
                rows={article.checklist.items.map((item) => ({
                  action: item.task,
                  detail: item.detail,
                  priority: item.priority === "immediate" ? "Immediate" : item.priority === "high" ? "High" : "Standard",
                }))}
              />
            </section>
          </>
        )}

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        {/* When to seek help / When to report */}
        <section
          id="reporting-assistance"
          aria-labelledby="reporting-heading"
          className="govuk-!-margin-bottom-8"
        >
          <h2 className="govuk-heading-l" id="reporting-heading">
            When to seek help and report to TT-CSIRT
          </h2>
          <div className="govuk-inset-text">
            <p className="govuk-body">{article.whenToReport.text}</p>
            {article.whenToReport.emergencyPhone && (
              <p className="govuk-body">
                <strong>TT-CSIRT Emergency Hotline:</strong>{" "}
                <a href="tel:+18686257937" className="govuk-link">
                  {article.whenToReport.emergencyPhone}
                </a>
              </p>
            )}
            <div className="govuk-!-margin-top-4">
              <Button
                type="link"
                role="primary"
                className="govuk-!-margin-bottom-0"
                href={article.whenToReport.reportLinkHref || "/report-an-incident"}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(article.whenToReport.reportLinkHref || "/report-an-incident");
                }}
              >
                {article.whenToReport.reportLinkText || "Report an incident to TT-CSIRT"}
              </Button>
            </div>
          </div>
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        {/* Related TT-CSIRT Guidance */}
        <section
          id="related-guidance"
          aria-labelledby="related-heading"
          className="govuk-!-margin-bottom-8"
        >
          <h2 className="govuk-heading-l" id="related-heading">
            Related cyber security guidance
          </h2>
          <HyperlinkList
            ariaLabel="Related cyber security guidance"
            onNavigate={onNavigate}
            items={article.relatedGuidance.map((rel) => ({
              href: `/guidance/${rel.slug}`,
              label: rel.title,
              description: rel.description,
            }))}
          />
        </section>

        <hr className="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

        {/* Sources and Further Reading (GDS semantic prose links, no decorative bullets) */}
        <section
          id="sources-provenance"
          aria-labelledby="sources-heading"
          className="govuk-!-margin-bottom-8"
        >
          <h2 className="govuk-heading-l" id="sources-heading">
            Sources and further reading
          </h2>
          <p className="govuk-body">
            This guidance is synthesized from primary national publications by TT-CSIRT and authoritative technical references issued by international standards bodies. Where statutory obligations are discussed, Trinidad and Tobago laws take precedence.
          </p>

          {article.sources.map((src, idx) => (
            <p key={idx} className="govuk-body">
              For additional reference from {src.publisher}, consult{" "}
              <a
                href={src.url}
                className="govuk-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {src.title}
              </a>
              {src.context ? ` (${src.context})` : ""}.
            </p>
          ))}

          <div className="govuk-!-margin-top-6">
            <p className="govuk-body-s govuk-!-font-weight-regular" style={{ color: "#505a5f" }}>
              <strong>Content provenance:</strong> {article.provenanceNote}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
