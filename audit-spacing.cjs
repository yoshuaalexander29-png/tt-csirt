const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  async function measureDistances(viewportName, width, height) {
    await page.setViewport({ width, height });
    await page.goto('http://localhost:5070', { waitUntil: 'networkidle0' });
    
    return await page.evaluate((vpName) => {
      const results = [];
      const getRect = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.getBoundingClientRect() : null;
      };

      const pairs = [
        ['Masthead', '.government-masthead', 'Service Navigation', '.govuk-service-navigation'],
        ['Service Nav', '.govuk-service-navigation', 'Main Content', '#main-content'],
        ['Main Content H1', '#main-page-heading', 'Intro P', '#main-page-heading + p'],
        ['Intro P', '#main-page-heading + p', 'Role H2', '#role-mandate-heading'],
        ['Role H2', '#role-mandate-heading', 'Role P', '#role-mandate-heading + p'],
        ['Overview Section', '#overview-and-mandate', 'Emergency Support Section', '#emergency-support'],
        ['Emergency Support', '#emergency-support', 'Guidance', '#guidance-by-audience'],
        ['Guidance Section', '#guidance-by-audience', 'Stats Section', '#incident-statistics'],
        ['Stats Section', '#incident-statistics', 'Services Section', '#services'],
        ['Services Section', '#services', 'About TT-CSIRT Section', '#about-tt-csirt'],
        ['About Section', '#about-tt-csirt', 'Footer', '.govuk-footer'],
      ];

      results.push(`--- ${vpName} Spacing ---`);
      pairs.forEach(([name1, sel1, name2, sel2]) => {
        const rect1 = getRect(sel1);
        const rect2 = getRect(sel2);
        if (rect1 && rect2) {
          const distance = rect2.top - rect1.bottom;
          results.push(`${name1} bottom -> ${name2} top: ${Math.round(distance)}px`);
        } else {
          results.push(`${name1} -> ${name2}: Element(s) not found`);
        }
      });
      return results.join('\n');
    }, viewportName);
  }

  const desktop = await measureDistances('Desktop', 1024, 768);
  const mobile = await measureDistances('Mobile', 375, 667);

  console.log(desktop);
  console.log('');
  console.log(mobile);

  await browser.close();
  process.exit(0);
})();
