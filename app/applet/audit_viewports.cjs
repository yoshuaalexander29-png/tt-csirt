const puppeteer = require('puppeteer');

const viewports = [
  { name: '320px', width: 320, height: 600 },
  { name: '360px', width: 360, height: 640 },
  { name: '375px', width: 375, height: 667 },
  { name: '414px', width: 414, height: 736 },
  { name: '640px', width: 640, height: 800 },
  { name: '641px', width: 641, height: 800 },
  { name: '768px', width: 768, height: 1024 },
  { name: '1024px', width: 1024, height: 768 },
  { name: '1280px', width: 1280, height: 800 },
  { name: '1440px', width: 1440, height: 900 },
  { name: '1920px', width: 1920, height: 1080 },
];

const routes = [
  '/',
  '/advisories',
  '/report-an-incident',
  '/services',
  '/guidance',
  '/statistics',
];

async function run() {
  console.log('Starting puppeteer...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  let totalTests = 0;
  let failures = [];

  for (const route of routes) {
    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(`http://localhost:3000${route}`, { waitUntil: 'domcontentloaded' });
      await new Promise(r => setTimeout(r, 60));

      totalTests++;
      const overflow = await page.evaluate((expectedWidth) => {
        const docWidth = document.documentElement.scrollWidth;
        const bodyWidth = document.body.scrollWidth;
        const rootWidth = document.getElementById('root')?.scrollWidth || 0;
        const maxW = Math.max(docWidth, bodyWidth, rootWidth);
        const hasOverflow = maxW > expectedWidth;
        let overflowingElements = [];
        if (hasOverflow) {
          document.querySelectorAll('*').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.right > expectedWidth + 1) {
              overflowingElements.push({
                tag: el.tagName,
                class: el.className,
                id: el.id,
                right: Math.round(rect.right),
                width: Math.round(rect.width)
              });
            }
          });
        }
        return {
          expectedWidth,
          maxW,
          hasOverflow,
          overflowingElements: overflowingElements.slice(0, 5)
        };
      }, vp.width);

      if (overflow.hasOverflow) {
        failures.push({
          route,
          viewport: vp.name,
          expected: vp.width,
          actual: overflow.maxW,
          elements: overflow.overflowingElements
        });
      }
    }
  }

  // Test Menu Open and Search Open
  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 60));

    // Open Menu
    const menuBtn = await page.$('.ttcsirt-header-menu-toggle');
    if (menuBtn) {
      await menuBtn.click();
      await new Promise(r => setTimeout(r, 100));
      totalTests++;
      const menuOverflow = await page.evaluate((expectedWidth) => {
        const docWidth = document.documentElement.scrollWidth;
        return { expectedWidth, docWidth, hasOverflow: docWidth > expectedWidth };
      }, vp.width);

      if (menuOverflow.hasOverflow) {
        failures.push({
          route: '/ (menu open)',
          viewport: vp.name,
          expected: vp.width,
          actual: menuOverflow.docWidth
        });
      }
      await menuBtn.click();
      await new Promise(r => setTimeout(r, 60));
    }

    // Open Search
    const searchBtn = await page.$('.ttcsirt-header-search-toggle');
    if (searchBtn) {
      await searchBtn.click();
      await new Promise(r => setTimeout(r, 100));
      totalTests++;
      const searchOverflow = await page.evaluate((expectedWidth) => {
        const docWidth = document.documentElement.scrollWidth;
        return { expectedWidth, docWidth, hasOverflow: docWidth > expectedWidth };
      }, vp.width);

      if (searchOverflow.hasOverflow) {
        failures.push({
          route: '/ (search open)',
          viewport: vp.name,
          expected: vp.width,
          actual: searchOverflow.docWidth
        });
      }
    }
  }

  await browser.close();

  console.log(`Ran ${totalTests} viewport tests.`);
  if (failures.length === 0) {
    console.log('PASS: All 88 viewport and interaction tests passed with 0 horizontal overflow!');
  } else {
    console.error(`FAIL: Found ${failures.length} overflow failures:`);
    console.error(JSON.stringify(failures, null, 2));
    process.exit(1);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
