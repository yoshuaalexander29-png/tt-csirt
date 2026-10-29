const puppeteer = require('puppeteer');

async function run() {
  const browser = await puppeteer.launch({args: ['--no-sandbox']});
  const page = await browser.newPage();
  
  await page.setViewport({ width: 375, height: 812, isMobile: true });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  const metrics = await page.evaluate(() => {
    function getOffsetAndPadding(selector) {
      const el = document.querySelector(selector);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const comp = window.getComputedStyle(el);
      return {
        selector,
        left: rect.left,
        paddingLeft: comp.paddingLeft,
        marginLeft: comp.marginLeft,
        parentLeft: el.parentElement ? el.parentElement.getBoundingClientRect().left : 0,
        parentPaddingLeft: el.parentElement ? window.getComputedStyle(el.parentElement).paddingLeft : 0
      };
    }
    return {
      partnersP: getOffsetAndPadding('#what-we-do > p:nth-of-type(2)'),
      partnersList: getOffsetAndPadding('#what-we-do > ul'),
      partnersListItem: getOffsetAndPadding('#what-we-do > ul > li'),
      servicesHeading: getOffsetAndPadding('#services .govuk-body'),
      servicesList: getOffsetAndPadding('#services .gem-c-cards__list'),
      servicesListItem: getOffsetAndPadding('#services .gem-c-cards__list-item'),
      advisoriesHeading: getOffsetAndPadding('#cyber-security-advisories > p'),
      advisoriesList: getOffsetAndPadding('#cyber-security-advisories .gem-c-document-list'),
      advisoriesListItem: getOffsetAndPadding('#cyber-security-advisories .gem-c-document-list__item')
    };
  });

  console.log(JSON.stringify(metrics, null, 2));
  await browser.close();
}

run().catch(console.error);
