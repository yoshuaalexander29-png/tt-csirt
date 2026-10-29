const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0' });
  
  // Viewport sizes to test
  const viewports = [
    { width: 375, height: 812, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1280, height: 800, name: 'desktop' }
  ];

  for (const vp of viewports) {
    console.log(`\n--- Viewport: ${vp.width}px (${vp.name}) ---`);
    await page.setViewport(vp);
    
    // Evaluate and extract computed styles
    const auditData = await page.evaluate(() => {
      const getStyles = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const comp = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          selector,
          display: comp.display,
          flexDirection: comp.flexDirection,
          flexGrow: comp.flexGrow,
          flexWrap: comp.flexWrap,
          margin: `${comp.marginTop} ${comp.marginRight} ${comp.marginBottom} ${comp.marginLeft}`,
          padding: `${comp.paddingTop} ${comp.paddingRight} ${comp.paddingBottom} ${comp.paddingLeft}`,
          fontFamily: comp.fontFamily,
          fontSize: comp.fontSize,
          lineHeight: comp.lineHeight,
          borderBottom: comp.borderBottom,
          borderLeft: comp.borderLeft,
          rect: `${Math.round(rect.width)}x${Math.round(rect.height)} @ ${Math.round(rect.x)},${Math.round(rect.y)}`
        };
      };

      return {
        header: getStyles('.govuk-generic-header'),
        navInlining: getStyles('.govuk-service-navigation__inlining-container'),
        navContainer: getStyles('.govuk-service-navigation__container'),
        navWrapper: getStyles('.govuk-service-navigation__wrapper'),
        navList: getStyles('.govuk-service-navigation__list'),
        navItemActive: getStyles('.govuk-service-navigation__item--active'),
        search: getStyles('.app-site-search')
      };
    });

    console.log(JSON.stringify(auditData, null, 2));
  }

  await browser.close();
})();
