const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const viewports = [
    { width: 375, height: 812 }, // Mobile
    { width: 768, height: 1024 }, // Tablet
    { width: 1024, height: 768 }, // Desktop
    { width: 1440, height: 900 } // Large Desktop
  ];

  for (const vp of viewports) {
    const page = await browser.newPage();
    await page.setViewport(vp);
    console.log(`Testing viewport: ${vp.width}x${vp.height}`);

    // Load initial page
    await page.goto('http://127.0.0.1:3000/advisories', { waitUntil: 'networkidle2' });
    
    const page1Scroll = await page.evaluate(() => window.scrollY);
    const title1 = await page.title();
    console.log(`  Initial Title: ${title1}, ScrollY: ${page1Scroll}`);

    // Click "Next" pagination link
    await page.evaluate(() => {
      const nextBtn = document.querySelector('.govuk-pagination__next a');
      if (nextBtn) nextBtn.click();
    });

    await page.waitForFunction(() => document.title.includes('page 2'));
    await new Promise(r => setTimeout(r, 500)); // wait for scroll to settle

    const page2Scroll = await page.evaluate(() => window.scrollY);
    const title2 = await page.title();
    const isFocused = await page.evaluate(() => document.activeElement.id === 'latest-advisories-heading');
    console.log(`  After Next: Title: ${title2}, ScrollY: ${page2Scroll}, Focused: ${isFocused}`);
    
    // Test Back
    await page.goBack();
    await page.waitForFunction(() => !document.title.includes('page 2'));
    await new Promise(r => setTimeout(r, 500));
    const title3 = await page.title();
    console.log(`  After Back: Title: ${title3}`);

    await page.close();
  }

  await browser.close();
})();
