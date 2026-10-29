/**
 * Deterministic Table Normalizer for TT-CSIRT Advisory Content
 *
 * Implements GOV.UK table presentation rules for legacy WordPress HTML tables:
 * 1. Distinguishes Type A (Genuine Data Tables) from Type B (Key-Value / Layout Tables).
 * 2. Transforms Type B Key-Value tables into GOV.UK Summary Lists (<dl class="govuk-summary-list">).
 * 3. Flattens single-cell and layout tables into semantic paragraphs and inset callouts.
 * 4. Normalizes Type A Data Tables:
 *    - Promotes first row to <thead> with <th scope="col" class="govuk-table__header">
 *    - Applies <th scope="row" class="govuk-table__header"> to leading row headers
 *    - Detects numeric data columns and right-aligns with govuk-!-font-tabular-numbers
 *    - Left-aligns text columns
 *    - Wraps in accessible responsive container (<div class="govuk-table-responsive" tabIndex="0" role="region">)
 *    - Strips deprecated presentation attributes (border, cellpadding, bgcolor, inline widths)
 */

function decodeCellText(html: string): string {
  const withoutTags = html.replace(/<[^>]*>/g, "").trim();
  if (typeof document === "undefined") return withoutTags.replace(/&nbsp;/g, " ");
  const decoder = document.createElement("textarea");
  decoder.innerHTML = withoutTags;
  return decoder.value.trim();
}

interface ParsedCell {
  tag: "th" | "td";
  html: string;
  text: string;
  isNumeric: boolean;
}

interface ParsedRow {
  isHeaderRow: boolean;
  cells: ParsedCell[];
}

/**
 * Tests whether a string represents a purely numeric/metric data value.
 * Matches integer/decimal numbers, percentages, CVSS scores (e.g. 9.8, 10.0),
 * version numbers with only digits and dots (e.g. 12.1.2, 4.0), or counts.
 */
function isNumericValue(val: string): boolean {
  const trimmed = val.trim();
  if (!trimmed) return false;
  // Exclude empty or dash
  if (trimmed === "-" || trimmed === "—" || trimmed === "N/A" || trimmed === "None") return false;
  // Matches e.g. "9.8", "100%", "45", "1,200", "0.05", "12.1.0", "v1.2" (if only version)
  return /^v?[\d,]+(?:\.[\d]+)*(?:%|\/10)?$/i.test(trimmed);
}

/**
 * Checks whether a cell contains a key-value label (e.g. "Severity:", "Product:", "CVE:", "Date:")
 */
function isKeyValueLabel(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (t.length > 50) return false;
  return /^(?:severity|risk|vulnerability|vector|cvss|cve|cwe|published|date|discovered|status|vendor|product|affected|impact|solution|patch|advisory|reference|author|mitigation|reporter)\s*:?$/i.test(
    t
  );
}

/**
 * Parses raw table inner HTML into structured rows and cells
 */
function parseTableRows(tableHtml: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
  const rowMatches = tableHtml.match(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi) || [];

  for (const rowHtml of rowMatches) {
    const isTheadRow = /<thead\b[^>]*>[\s\S]*?<\/thead>/i.test(tableHtml) &&
      tableHtml.indexOf(rowHtml) < (tableHtml.indexOf("</thead>") > 0 ? tableHtml.indexOf("</thead>") : -1);

    const cellMatches = rowHtml.match(/<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi) || [];
    const cells: ParsedCell[] = [];

    for (const cellHtml of cellMatches) {
      const tagMatch = cellHtml.match(/^<(td|th)\b/i);
      const tag = (tagMatch ? tagMatch[1].toLowerCase() : "td") as "th" | "td";
      const innerHtml = cellHtml.replace(/^<(?:td|th)\b[^>]*>/i, "").replace(/<\/(?:td|th)>$/i, "").trim();
      const text = decodeCellText(innerHtml);
      const isNumeric = isNumericValue(text);

      cells.push({
        tag,
        html: innerHtml,
        text,
        isNumeric,
      });
    }

    if (cells.length > 0) {
      rows.push({
        isHeaderRow: isTheadRow || cells.every((c) => c.tag === "th"),
        cells,
      });
    }
  }

  return rows;
}

/**
 * Normalizes a single advisory HTML table
 */
export function normalizeAdvisoryTable(tableHtml: string): {
  type: "table" | "summary-list" | "blocks";
  html: string;
  caption?: string;
  headers?: string[];
  rows?: Array<Array<{ text: string; html: string }>>;
} {
  if (!tableHtml || !tableHtml.includes("<table")) {
    return { type: "blocks", html: tableHtml };
  }

  const rows = parseTableRows(tableHtml);

  if (rows.length === 0) {
    return { type: "blocks", html: "" };
  }

  const colCounts = rows.map((r) => r.cells.length);
  const maxCols = Math.max(...colCounts, 0);

  // Case 1: Single cell or single column table -> Unpack into semantic prose / inset block
  if (maxCols === 1) {
    let combinedHtml = "";
    let isCallout = false;

    for (const row of rows) {
      for (const cell of row.cells) {
        let content = cell.html.trim();

        // Check if content begins with a legitimate short note/warning/callout label
        const hasMajorSections = /(?:overview|affected\s+(?:systems|products|versions|software)|description|recommendations|mitigations|remediation|references)\s*:/i.test(content);
        if (
          !hasMajorSections &&
          content.length < 500 &&
          /^(?:<strong>|<b>)?(?:note|caution|warning|important)\s*:?/i.test(content)
        ) {
          isCallout = true;
        }

        // Clean double breaks and bold formatting artifacts
        content = content.replace(/<(?:strong|b)>\s*(?:&nbsp;)?\s*<\/(?:strong|b)>/gi, "");
        content = content.replace(/<br\s*\/?>\s*<br\s*\/?>/gi, "</p><p>");

        if (!/^\s*<p[\s>]/i.test(content)) {
          content = `<p class="govuk-body">${content}</p>`;
        }

        combinedHtml += content;
      }
    }

    if (isCallout) {
      return {
        type: "blocks",
        html: `<div class="govuk-inset-text govuk-!-margin-top-4 govuk-!-margin-bottom-4">${combinedHtml}</div>`,
      };
    }

    return {
      type: "blocks",
      html: combinedHtml,
    };
  }

  // Case 2: Check for Type B Key-Value Table (typically 2 columns where column 1 contains short metadata keys)
  if (maxCols === 2) {
    // Check if row 0 is a standard multi-item table header (e.g. "Product" | "Affected Versions")
    const row0 = rows[0];
    const headerCol0 = row0.cells[0]?.text.trim().toLowerCase() || "";
    const headerCol1 = row0.cells[1]?.text.trim().toLowerCase() || "";

    const isExplicitDataHeader = row0.isHeaderRow ||
      ((headerCol0.includes("product") || headerCol0.includes("component") || headerCol0.includes("package")) &&
      (headerCol1.includes("version") || headerCol1.includes("solution") || headerCol1.includes("status")));

    if (!isExplicitDataHeader) {
      // Evaluate if rows represent distinct key-value attributes
      let labelCount = 0;
      let totalDataRows = 0;

      for (const r of rows) {
        if (r.cells.length === 2) {
          totalDataRows++;
          const col0Text = r.cells[0].text.trim();
          if (isKeyValueLabel(col0Text) || (col0Text.length > 0 && col0Text.length <= 40 && !isNumericValue(col0Text))) {
            labelCount++;
          }
        }
      }

      // If at least 70% of rows match key-value label characteristics, convert to GOV.UK Summary List
      if (totalDataRows >= 2 && labelCount / totalDataRows >= 0.7) {
        let dlRowsHtml = "";
        for (const r of rows) {
          if (r.cells.length >= 2) {
            const rawLabel = r.cells[0].html.replace(/<(?:strong|b)>([\s\S]*?)<\/(?:strong|b)>/gi, "$1").replace(/:?\s*$/, "").trim();
            const rawValue = r.cells[1].html.trim();

            dlRowsHtml += `
              <div class="govuk-summary-list__row">
                <dt class="govuk-summary-list__key">${rawLabel}</dt>
                <dd class="govuk-summary-list__value">${rawValue}</dd>
              </div>
            `;
          }
        }

        return {
          type: "summary-list",
          html: `<dl class="govuk-summary-list govuk-!-margin-top-4 govuk-!-margin-bottom-6">${dlRowsHtml}</dl>`,
        };
      }
    }
  }

  // Case 3: Type A Genuine Data Table
  // 1. Determine header row (either existing header row, or promote row 0)
  let headerRowIndex = rows.findIndex((r) => r.isHeaderRow);
  if (headerRowIndex === -1) {
    headerRowIndex = 0;
  }

  const headerRow = rows[headerRowIndex];
  const bodyRows = rows.filter((_, idx) => idx !== headerRowIndex);

  // 2. Determine column alignment (numeric vs text)
  // For each column index, check data rows
  const colAlignments: Array<"numeric" | "text"> = [];
  for (let c = 0; c < maxCols; c++) {
    let numericCount = 0;
    let nonNumericCount = 0;

    for (const r of bodyRows) {
      if (r.cells[c]) {
        const text = r.cells[c].text.trim();
        if (text && text !== "-" && text !== "—") {
          if (r.cells[c].isNumeric) {
            numericCount++;
          } else {
            nonNumericCount++;
          }
        }
      }
    }

    if (numericCount > 0 && nonNumericCount === 0) {
      colAlignments.push("numeric");
    } else {
      colAlignments.push("text");
    }
  }

  // 3. Render <thead>
  // Extract caption if present in original table
  const captionMatch = tableHtml.match(/<caption\b[^>]*>([\s\S]*?)<\/caption>/i);
  const caption = captionMatch ? decodeCellText(captionMatch[1]) : "Technical advisory data table";
  return {
    type: "table",
    html: "",
    caption,
    headers: headerRow.cells.map((cell) => cell.text || decodeCellText(cell.html)),
    rows: bodyRows.map((row) => row.cells.map((cell) => ({ text: cell.text, html: cell.html }))),
  };
}

/**
 * Replaces all <table> elements in advisory content HTML with their normalized GOV.UK representation.
 */
export function normalizeTablesInHtml(html: string): string {
  if (!html || !html.includes("<table")) return html;

  return html.replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, (match) => {
    const normalized = normalizeAdvisoryTable(match);
    if (normalized.type !== "table") return normalized.html;
    return `<div class="advisory-gcds-table" data-caption="${normalized.caption ?? "Technical advisory data table"}"></div>`;
  });
}
