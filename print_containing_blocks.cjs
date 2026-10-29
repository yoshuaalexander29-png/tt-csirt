const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1024, height: 768 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
    
    const tree = await page.evaluate(() => {
      const getAncestors = (sel) => {
        let el = document.querySelector(sel);
        const chain = [];
        while (el && el !== document.body && el !== document.documentElement) {
          const cs = window.getComputedStyle(el);
          chain.push({
            tag: el.tagName.toLowerCase(),
            className: el.className,
            offsetParent: el.offsetParent ? el.offsetParent.tagName.toLowerCase() + (el.offsetParent.className ? '.' + el.offsetParent.className.split(' ').join('.') : '') : 'null',
            position: cs.position,
            top: cs.top,
            left: cs.left,
            transform: cs.transform,
            display: cs.display,
            overflow: cs.overflow
          });
          el = el.parentElement;
        }
        return chain;
      };

      return {
        coatAncestors: getAncestors('.government-masthead__coat'),
        serviceNameAncestors: getAncestors('.govuk-service-navigation__service-name'),
        searchAncestors: getAncestors('.govuk-service-navigation__search')
      };
    });

    console.log(JSON.stringify(tree, null, 2));
    await browser.close();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
