const puppeteer = require('puppeteer');

async function run() {
  const browser = await puppeteer.launch({args: ['--no-sandbox']});
  const page = await browser.newPage();
  
  await page.setViewport({ width: 375, height: 812, isMobile: true });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  const metrics = await page.evaluate(() => {
    function getAlign(selector) {
      const el = document.querySelector(selector);
      if (!el) return null;
      const comp = window.getComputedStyle(el);
      return {
        selector,
        textAlign: comp.textAlign,
        display: comp.display,
        justifyContent: comp.justifyContent,
        alignItems: comp.alignItems,
        margin: comp.margin,
        padding: comp.padding,
        left: el.getBoundingClientRect().left,
        width: el.getBoundingClientRect().width,
        innerText: el.innerText.substring(0, 30)
      };
    }
    return {
      partnersP: getAlign('#what-we-do > p:nth-of-type(2)'),
      partnersList: getAlign('#what-we-do > ul'),
      partnersListItem: getAlign('#what-we-do > ul > li'),
      partnersLink: getAlign('#what-we-do > ul > li > a'),
      servicesHeading: getAlign('#services .govuk-body'),
      servicesList: getAlign('#services .gem-c-cards__list'),
      servicesListItem: getAlign('#services .gem-c-cards__list-item'),
      servicesSubHeading: getAlign('#services .gem-c-cards__list-item h3'),
      advisoriesHeading: getAlign('#cyber-security-advisories > p'),
      advisoriesList: getAlign('#cyber-security-advisories .gem-c-document-list'),
      advisoriesListItem: getAlign('#cyber-security-advisories .gem-c-document-list__item'),
      advisoriesItemTitle: getAlign('#cyber-security-advisories .gem-c-document-list__item-title'),
      containerGrid: getAlign('#services .govuk-grid-column-full')
    };
  });

  console.log(JSON.stringify(metrics, null, 2));
  await browser.close();
}

run().catch(console.error);
