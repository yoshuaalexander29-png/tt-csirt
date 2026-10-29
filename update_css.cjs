const fs = require('fs');

let css = fs.readFileSync('src/styles/homepage.css', 'utf8');

// Replace table font size and margins
css = css.replace(
  /\.govuk-table \{\s*font-family: inherit;\s*font-size: 1\.125rem;\s*line-height: 1\.35;\s*color: #0b0c0c;\s*width: 100%;\s*margin-top: 16px;\s*margin-bottom: 24px;\s*border-spacing: 0;\s*border-collapse: collapse;\s*\}/,
  `.govuk-table {  font-family: inherit;  font-size: 1.1875rem;  line-height: 1.3157894737;  color: #0b0c0c;  width: 100%;  margin-bottom: 30px;  border-spacing: 0;  border-collapse: collapse;}`
);

css = css.replace(
  /\.govuk-table \{\s*font-size: 0\.9375rem;\s*line-height: 1\.3;\s*margin-bottom: 16px;\s*\}/,
  `.govuk-table {  font-size: 1rem;  line-height: 1.25;  margin-bottom: 20px;}`
);

// Replace headers and cells padding, borders, vertical align
css = css.replace(
  /\.govuk-table__header \{\s*padding: 10px 16px 10px 0;\s*text-align: left;\s*font-weight: 700;\s*border-bottom: 2px solid #0b0c0c;\s*color: #0b0c0c;\s*vertical-align: bottom;\s*\}/,
  `.govuk-table__header {  padding: 10px 20px 10px 0;  text-align: left;  font-weight: 700;  border-bottom: 1px solid #cecece;  color: #0b0c0c;  vertical-align: top;}`
);

css = css.replace(
  /\.govuk-table__cell \{\s*padding: 12px 16px 12px 0;\s*text-align: left;\s*border-bottom: 1px solid #b1b4b6;\s*vertical-align: top;\s*word-break: break-word;\s*\}/,
  `.govuk-table__cell {  padding: 10px 20px 10px 0;  text-align: left;  border-bottom: 1px solid #cecece;  vertical-align: top;  word-break: break-word;}`
);

// Add missing numeric modifiers
if (!css.includes('.govuk-table__cell--numeric')) {
  css = css.replace(
    /\.govuk-table__header:last-child,/,
    `.govuk-table__cell--numeric {  font-variant-numeric: tabular-nums;}\n\n.govuk-table__cell--numeric,\n.govuk-table__header--numeric {  text-align: right;}\n\n.govuk-table__header:last-child,`
  );
}

fs.writeFileSync('src/styles/homepage.css', css);
