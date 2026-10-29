const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let filePath = './dist' + req.url;
  if (filePath === './dist/') filePath = './dist/index.html';
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(500);
      res.end('Error');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

(async () => {
  await new Promise((resolve) => server.listen(3001, resolve));
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  async function runAudit(viewportName, viewportConfig) {
    console.log(`=== ${viewportName} ===`);
    const page = await browser.newPage();
    await page.setViewport(viewportConfig);
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });

    let passCount = 0, failCount = 0;
    async function checkSpacing(selectorA, selectorB, expectedGap, description) {
      console.log(`ASSERT:\n${description}`);
      console.log(`Expected: ${expectedGap}px`);
      try {
        const gap = await page.evaluate((selA, selB) => {
          const a = document.querySelector(selA);
          const b = document.querySelector(selB);
          if (!a || !b) return null;
          return Math.round(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom);
        }, selectorA, selectorB);

        console.log(`Actual: ${gap}px`);
        if (gap === expectedGap) { console.log('PASS\n'); passCount++; }
        else { console.log('FAIL\n'); failCount++; }
      } catch(err) { console.log('FAIL (Error)\n'); failCount++; }
    }

    await checkSpacing('h1', 'h1 + p.govuk-body-l', 30, 'Main H1 → introductory paragraph');
    if (viewportName === 'DESKTOP BROWSER ASSERTIONS') {
        await checkSpacing('h1 + p.govuk-body-l', '#role-mandate-heading', 30, 'Introductory paragraph → Role H2');
        await checkSpacing('#role-mandate-heading', '#role-mandate-heading + p.govuk-body', 30, 'Role H2 → Role paragraph');
        await checkSpacing('#about-heading', '#about-heading + p.govuk-body-l', 30, 'About H2 → About introductory paragraph');
    }
    await checkSpacing('#overview-and-mandate', '#emergency-support', 30, 'Overview section → Emergency Support section');
    await checkSpacing('#incident-statistics', '#services', 30, 'Stats section → Services section');
    await checkSpacing('#services', '#about-tt-csirt', 30, 'Services section → About TT-CSIRT section');
    await page.close();
    return { passCount, failCount };
  }

  const desktop = await runAudit('DESKTOP BROWSER ASSERTIONS', { width: 1200, height: 800 });
  const mobile = await runAudit('MOBILE BROWSER ASSERTIONS', { width: 375, height: 667 });

  if (desktop.failCount === 0 && mobile.failCount === 0) {
      console.log('All spacing assertions PASS.');
  } else {
      console.log('Some assertions failed.');
  }

  await browser.close();
  server.close();
})();
