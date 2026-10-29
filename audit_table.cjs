const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/statistics', { waitUntil: 'networkidle0' });

  const data = await page.evaluate(() => {
    const table = document.querySelector('table#incident-categories');
    if (!table) return { error: "Table not found" };

    const caption = table.querySelector('caption');
    const header = table.querySelector('th.govuk-table__header');
    const numCell = table.querySelector('td.govuk-table__cell--numeric');

    const getStyles = (el, props) => {
      if (!el) return null;
      const comp = window.getComputedStyle(el);
      const res = {};
      props.forEach(p => res[p] = comp[p]);
      return res;
    };

    return {
      table: getStyles(table, ['font-family', 'font-size', 'font-weight', 'line-height', 'width', 'margin-bottom', 'border-spacing', 'border-collapse', 'color']),
      caption: getStyles(caption, ['font-family', 'font-size', 'font-weight', 'line-height', 'margin-bottom']),
      header: getStyles(header, ['padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border-bottom-width', 'border-bottom-style', 'border-bottom-color', 'vertical-align', 'font-weight', 'text-align']),
      numCell: getStyles(numCell, ['text-align', 'font-variant-numeric', 'font-family', 'padding-top', 'border-bottom-width']),
      dom: {
        hasTable: !!table,
        captionClass: caption ? caption.className : null,
        colHeaders: table.querySelectorAll('th[scope="col"]').length,
        rowHeaders: table.querySelectorAll('th[scope="row"]').length,
        tds: table.querySelectorAll('td').length,
      }
    };
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
