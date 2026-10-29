const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 768 });
  await page.goto('http://localhost:5065', { waitUntil: 'networkidle0' });
  
  const debug = await page.evaluate(() => {
    const getRect = el => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, height: r.height };
    };
    return {
      aboutRect: getRect(document.querySelector('#about-tt-csirt')),
      mainRect: getRect(document.querySelector('#main-content')),
      footerRect: getRect(document.querySelector('.govuk-footer')),
      mainNextSibling: document.querySelector('#main-content').nextElementSibling?.tagName
    };
  });
  
  console.log(JSON.stringify(debug, null, 2));

  await browser.close();
  process.exit(0);
})();
