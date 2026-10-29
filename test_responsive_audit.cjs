const puppeteer = require('puppeteer');
const fs = require('fs');

const viewports = [
  320, 360, 375, 390, 430, 480, 600, 768, 820, 1024, 1280, 1366, 1440, 1536, 1920
];

const routes = [
  '/',
  '/advisories',
  '/statistics',
  '/services',
  '/guidance',
  '/about',
  '/contact',
  '/report-an-incident'
];

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  let logOutput = '=== TESTING VIEWPORTS FOR OVERFLOW AND INSTABILITY ===\n';

  for (const route of routes) {
    logOutput += `\n--- Route: ${route} ---\n`;
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`http://localhost:3000${route}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await new Promise(r => setTimeout(r, 400));

    for (const width of viewports) {
      await page.setViewport({ width, height: 900 });
      await new Promise(r => setTimeout(r, 40));

      const diagnosis = await page.evaluate((w) => {
        const html = document.documentElement;
        const body = document.body;
        const prevHtmlOverflow = html.style.overflowX;
        const prevBodyOverflow = body.style.overflowX;
        html.style.overflowX = 'visible';
        body.style.overflowX = 'visible';

        const docScrollWidth = Math.max(
          html.scrollWidth,
          body.scrollWidth,
          html.offsetWidth,
          body.offsetWidth,
          html.clientWidth
        );
        const hasOverflow = docScrollWidth > w + 1;

        const overflowingElements = [];
        const all = document.querySelectorAll('*');
        for (const el of all) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            if (r.right > w + 1 || r.left < -1) {
              const tag = el.tagName.toLowerCase();
              const cls = el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '';
              const id = el.id ? '#' + el.id : '';
              overflowingElements.push({
                selector: `${tag}${id}${cls}`.slice(0, 80),
                left: Math.round(r.left),
                right: Math.round(r.right),
                width: Math.round(r.width),
                scrollWidth: el.scrollWidth,
                clientWidth: el.clientWidth
              });
            }
          }
        }

        html.style.overflowX = prevHtmlOverflow;
        body.style.overflowX = prevBodyOverflow;

        return {
          viewportWidth: w,
          docScrollWidth,
          hasOverflow,
          overflowingCount: overflowingElements.length,
          topOverflowing: overflowingElements.slice(0, 10)
        };
      }, width);

      if (diagnosis.hasOverflow) {
        logOutput += `[OVERFLOW] Width ${width}px: docScrollWidth=${diagnosis.docScrollWidth}px (+${diagnosis.docScrollWidth - width}px, elements: ${diagnosis.overflowingCount})\n`;
        for (const o of diagnosis.topOverflowing) {
          logOutput += `   -> ${o.selector} [L:${o.left}, R:${o.right}, W:${o.width}, scrollW:${o.scrollWidth}]\n`;
        }
      } else {
        logOutput += `[OK] Width ${width}px\n`;
      }
    }
  }

  await browser.close();
  fs.writeFileSync('audit_responsive_results.txt', logOutput);
  console.log('DONE');
})();
