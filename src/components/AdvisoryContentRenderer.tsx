import React, { useMemo } from "react";
import { Notice } from "@/components/Notice";
import { GcdsDataTable } from "@/components/GcdsDataTable";
import { sanitizeAdvisoryHtml } from "@/services/safeHtml";
import {
  CanonicalAdvisoryDocument,
  CanonicalNode,
  CanonicalSection,
  parseCanonicalAdvisoryDocument,
  normalizeHeadingSentenceCase,
  generateDeterministicSlug,
} from "@/services/advisoryDocument";

// Re-export helpers for backward compatibility
export const normalizeHeadingText = normalizeHeadingSentenceCase;
export function slugifyHeading(text: string): string {
  const dummy = new Set<string>();
  return generateDeterministicSlug(text, dummy);
}

export interface AdvisoryContentRendererProps {
  contentHtml?: string;
  advisoryTitle?: string;
  document?: CanonicalAdvisoryDocument;
}

/**
 * Normalizes list HTML to authentic GOV.UK Frontend list classes:
 * - Unordered lists (both top-level and nested) receive "govuk-list govuk-list--bullet"
 * - Ordered lists (both top-level and nested) receive "govuk-list govuk-list--number"
 * - Removes legacy WordPress classes such as "wp-block-list"
 * - Strips stray <br> tags adjacent to list boundaries
 */
export function normalizeAdvisoryListHtml(html: string): string {
  if (!html) return html;
  if (!html.includes("<ul") && !html.includes("<ol")) return html;

  // Clean any stray <br> tags immediately after <ul> or <ol>, or before </ul> or </ol>
  let result = html.replace(/(<(?:ul|ol)\b[^>]*>)\s*<br\s*\/?>/gi, "$1");
  result = result.replace(/<br\s*\/?>\s*(<\/(?:ul|ol)>)/gi, "$1");

  // Process all <ul ...> tags
  result = result.replace(/<ul\b([^>]*)>/gi, (_match, rawAttrs) => {
    let attrs = rawAttrs.trim();
    attrs = attrs.replace(/\bwp-block-list\b/g, "").trim();

    const classMatch = attrs.match(/class\s*=\s*["']([^"']*)["']/i);
    const classes: string[] = ["govuk-list", "govuk-list--bullet"];
    if (classMatch) {
      const existing = classMatch[1].split(/\s+/).filter(Boolean);
      for (const c of existing) {
        if (c !== "wp-block-list" && !classes.includes(c)) {
          classes.push(c);
        }
      }
      attrs = attrs.replace(/\bclass\s*=\s*["'][^"']*["']/gi, "").trim();
    }
    const finalAttrs = attrs ? ` ${attrs}` : "";
    return `<ul class="${classes.join(" ")}"${finalAttrs}>`;
  });

  // Process all <ol ...> tags
  result = result.replace(/<ol\b([^>]*)>/gi, (_match, rawAttrs) => {
    let attrs = rawAttrs.trim();
    attrs = attrs.replace(/\bwp-block-list\b/g, "").trim();

    const classMatch = attrs.match(/class\s*=\s*["']([^"']*)["']/i);
    const classes: string[] = ["govuk-list", "govuk-list--number"];
    if (classMatch) {
      const existing = classMatch[1].split(/\s+/).filter(Boolean);
      for (const c of existing) {
        if (c !== "wp-block-list" && !classes.includes(c)) {
          classes.push(c);
        }
      }
      attrs = attrs.replace(/\bclass\s*=\s*["'][^"']*["']/gi, "").trim();
    }
    const finalAttrs = attrs ? ` ${attrs}` : "";
    return `<ol class="${classes.join(" ")}"${finalAttrs}>`;
  });

  return result;
}

/**
 * Enriches HTML strings by adding secure target and rel attributes to external links,
 * stripping legacy formatting elements (such as <font> and inline styles),
 * and ensuring authentic GOV.UK link semantics across all links.
 */
function addLinkSemantics(html: string): string {
  if (!html) return html;

  // 1. Strip legacy <font> tags while preserving their contents
  let cleaned = html.replace(/<\/?font[^>]*>/gi, "");

  if (!cleaned.includes("<a")) return cleaned;

  // 2. Process all anchor tags: sanitize inline style/color, ensure govuk-link, and add external target/rel
  return cleaned.replace(
    /<a\s+([\s\S]*?)href=(["'])([^"']+)\2([\s\S]*?)>(.*?)<\/a>/gi,
    (_match, before, _quote, href, after, linkText) => {
      let attrs = `${before} ${after}`.trim();

      // Remove conflicting inline styles or color attributes from legacy content
      attrs = attrs.replace(/style\s*=\s*(["'])[\s\S]*?\1/gi, "");
      attrs = attrs.replace(/color\s*=\s*(["'])[\s\S]*?\1/gi, "");

      // Ensure class contains govuk-link
      if (/class\s*=\s*(["'])([\s\S]*?)\1/i.test(attrs)) {
        attrs = attrs.replace(/class\s*=\s*(["'])([\s\S]*?)\1/i, (_m, q, classes) => {
          const classList = classes.split(/\s+/).filter(Boolean);
          if (!classList.includes("govuk-link")) {
            classList.push("govuk-link");
          }
          return `class=${q}${classList.join(" ")}${q}`;
        });
      } else {
        attrs = `${attrs} class="govuk-link"`.trim();
      }

      const isInternal = href.includes("ttcsirt.gov.tt") || href.startsWith("/") || href.startsWith("#");
      const isMailtoOrTel = href.startsWith("mailto:") || href.startsWith("tel:");

      if (isInternal || isMailtoOrTel) {
        return `<a href="${href}" ${attrs}>${linkText}</a>`;
      }

      // Ensure target="_blank" and rel="noopener noreferrer" for external web links
      if (!/target\s*=/i.test(attrs)) {
        attrs += ' target="_blank"';
      }
      if (!/rel\s*=/i.test(attrs)) {
        attrs += ' rel="noopener noreferrer"';
      }

      // Avoid double-adding the hidden announcement if already present
      if (linkText.includes("(opens in new tab)") || linkText.includes("govuk-visually-hidden")) {
        return `<a href="${href}" ${attrs}>${linkText}</a>`;
      }

      return `<a href="${href}" ${attrs}>${linkText} <span class="govuk-visually-hidden">(opens in new tab)</span></a>`;
    }
  );
}

/**
 * Every string that reaches dangerouslySetInnerHTML in this file goes through
 * here: tidy the links first, then run the result through DOMPurify so nothing
 * unsafe can survive the tidy-up.
 */
function enrichExternalLinksHtml(html: string): string {
  return sanitizeAdvisoryHtml(addLinkSemantics(html));
}

export function AdvisoryContentRenderer({
  contentHtml = "",
  advisoryTitle = "",
  document: propDoc,
}: AdvisoryContentRendererProps) {
  const doc = useMemo(() => {
    if (propDoc) return propDoc;
    return parseCanonicalAdvisoryDocument(contentHtml, advisoryTitle);
  }, [propDoc, contentHtml, advisoryTitle]);

  if (!doc || (doc.sections.length === 0 && !doc.leadParagraph)) {
    return (
      <div className="govuk-body ttcsirt-secondary-text">
        No detailed technical notes are provided for this advisory.
      </div>
    );
  }

  return (
    <div className="advisory-document-body" data-canonical-sections={doc.sections.length}>
      {doc.sections.map((section: CanonicalSection) => (
        <section
          key={section.id}
          id={section.id}
          className="govuk-!-margin-bottom-8 advisory-section-wrapper"
          aria-labelledby={section.title ? `${section.id}-heading` : undefined}
        >
          {section.title && (
            <h2 className="govuk-heading-l govuk-!-margin-bottom-4" id={`${section.id}-heading`}>
              {section.title}
            </h2>
          )}

          <div className="advisory-section-content">
            {section.nodes.map((node: CanonicalNode, nIdx: number) => {
              const nodeKey = `${section.id}-node-${nIdx}`;

              switch (node.type) {
                case "subheading":
                  return (
                    <h3
                      key={nodeKey}
                      className="govuk-heading-m govuk-!-margin-top-6 govuk-!-margin-bottom-3"
                      id={node.id}
                    >
                      {node.title}
                    </h3>
                  );

                case "paragraph": {
                  const enrichedHtml = enrichExternalLinksHtml(node.html);

                  if (/^\s*<p[\s>]/i.test(enrichedHtml)) {
                    return (
                      <div
                        key={nodeKey}
                        className="govuk-body govuk-!-margin-bottom-4"
                        dangerouslySetInnerHTML={{ __html: enrichedHtml }}
                      />
                    );
                  }
                  return (
                    <p
                      key={nodeKey}
                      className="govuk-body govuk-!-margin-bottom-4"
                      dangerouslySetInnerHTML={{ __html: enrichedHtml }}
                    />
                  );
                }

                case "metadata-block":
                  if (!node.html) return null;
                  if (node.html.includes("<dl")) {
                    return (
                      <div
                        key={nodeKey}
                        className="govuk-!-margin-top-2 govuk-!-margin-bottom-6"
                        dangerouslySetInnerHTML={{ __html: enrichExternalLinksHtml(node.html) }}
                      />
                    );
                  }
                  return (
                    <div
                      key={nodeKey}
                      className="govuk-inset-text govuk-!-margin-top-3 govuk-!-margin-bottom-4 ttcsirt-inset-compact"
                      dangerouslySetInnerHTML={{ __html: enrichExternalLinksHtml(node.html) }}
                    />
                  );

                case "warning":
                  return (
                    <Notice key={nodeKey} type="warning" title="Advisory" titleAs="h3">
                      <div dangerouslySetInnerHTML={{ __html: enrichExternalLinksHtml(node.html) }} />
                    </Notice>
                  );

                case "table":
                  if (node.headers?.length && node.rows) {
                    const fields = node.headers.map((header, index) => `column-${index}-${header.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`);
                    return (
                      <GcdsDataTable
                        key={nodeKey}
                        className="govuk-!-margin-top-4 govuk-!-margin-bottom-6"
                        labelledBy={`${section.id}-heading`}
                        caption={`${advisoryTitle || "Cyber security advisory"}: ${node.caption && node.caption !== "Technical advisory data table" ? node.caption : section.title}`}
                        columns={node.headers.map((header, index) => ({
                          field: fields[index],
                          header,
                          rowHeader: index === 0,
                          alignment: node.rows?.length && node.rows.every((row) => /^v?[\d,]+(?:\.[\d]+)*(?:%|\/10)?$/i.test(row[index]?.text.trim() ?? "")) ? "end" : "start",
                          renderCell: ({ row, value }) => {
                            const html = String(row[`${fields[index]}-html`] ?? "");
                            return /<a\b/i.test(html) ? <span dangerouslySetInnerHTML={{ __html: enrichExternalLinksHtml(html) }} /> : String(value ?? "Not provided");
                          },
                        }))}
                        rows={node.rows.map((row) => Object.fromEntries(fields.flatMap((field, index) => [
                          [field, row[index]?.text || "Not provided"],
                          [`${field}-html`, row[index]?.html || ""],
                        ])))}
                      >
                      </GcdsDataTable>
                    );
                  }
                  return (
                    <div
                      key={nodeKey}
                      className="govuk-!-margin-top-4 govuk-!-margin-bottom-6 advisory-table-container"
                      dangerouslySetInnerHTML={{ __html: enrichExternalLinksHtml(node.html) }}
                    />
                  );

                case "list":
                  return (
                    <div
                      key={nodeKey}
                      className="govuk-!-margin-bottom-4"
                      dangerouslySetInnerHTML={{
                        __html: enrichExternalLinksHtml(normalizeAdvisoryListHtml(node.html)),
                      }}
                    />
                  );

                case "references":
                  return (
                    <div
                      key={nodeKey}
                      className="govuk-!-margin-bottom-4"
                      dangerouslySetInnerHTML={{
                        __html: enrichExternalLinksHtml(normalizeAdvisoryListHtml(node.html)),
                      }}
                    />
                  );

                case "code":
                  return (
                    <div key={nodeKey} className="govuk-!-margin-top-3 govuk-!-margin-bottom-4">
                      <pre className="govuk-!-font-size-14 ttcsirt-code-block">
                        <code>{node.text || node.html.replace(/<[^>]*>/g, "")}</code>
                      </pre>
                    </div>
                  );

                case "raw-html":
                  return (
                    <div
                      key={nodeKey}
                      className="govuk-body govuk-!-margin-bottom-4"
                      dangerouslySetInnerHTML={{
                        __html: enrichExternalLinksHtml(normalizeAdvisoryListHtml(node.html)),
                      }}
                    />
                  );

                default:
                  return null;
              }
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
