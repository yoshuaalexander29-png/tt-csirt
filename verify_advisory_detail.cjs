const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    console.log('Navigating to http://localhost:3000/advisories...');
    await page.goto('http://localhost:3000/advisories', { waitUntil: 'networkidle2', timeout: 15000 });

    // Find the first advisory card link
    await page.waitForSelector('.gem-c-document-list__item-title a, #search-advisories', { timeout: 10000 });
    const firstAdvisoryLink = await page.$('.gem-c-document-list__item-title a');
    if (!firstAdvisoryLink) {
      console.log('No advisory cards found on list page, testing direct navigation');
      await page.goto('http://localhost:3000/advisories/ttcsirt-55030526', { waitUntil: 'networkidle2', timeout: 15000 });
    } else {
      const linkText = await page.evaluate(el => el.textContent, firstAdvisoryLink);
      console.log('Clicking first advisory:', linkText.trim());
      await firstAdvisoryLink.click();
      await page.waitForSelector('.advisory-article', { timeout: 10000 });
      await page.waitForSelector('#emergency-reporting', { timeout: 10000 });
    }

    // Inspect layout structure
    const layoutInfo = await page.evaluate(() => {
      const gridRow = document.querySelector('.app-page-grid-row');
      const pageNav = document.querySelector('.app-page-nav');
      const navItems = Array.from(document.querySelectorAll('.app-page-nav a')).map(a => ({
        href: a.getAttribute('href'),
        text: a.textContent.trim()
      }));
      const pageContent = document.querySelector('.app-page-content');
      const h1 = document.querySelector('h1');
      const emergencySection = document.querySelector('#emergency-reporting');
      const emergencyPhoneHeading = emergencySection ? emergencySection.querySelector('strong') : null;
      const oldSidebar = document.querySelector('.app-related-items');

      return {
        hasGridRow: Boolean(gridRow),
        hasPageNav: Boolean(pageNav),
        navItemCount: navItems.length,
        navItemsSample: navItems.slice(0, 6),
        hasPageContent: Boolean(pageContent),
        h1Text: h1 ? h1.textContent.trim() : null,
        hasEmergencySection: Boolean(emergencySection),
        emergencyPhoneLabel: emergencyPhoneHeading ? emergencyPhoneHeading.textContent.trim() : null,
        hasOldSidebar: Boolean(oldSidebar),
      };
    });

    console.log('Layout Verification Result:', JSON.stringify(layoutInfo, null, 2));

    console.log('Testing mobile viewport (375x667)...');
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout ? page.waitForTimeout(500) : new Promise(r => setTimeout(r, 500));

    const mobileLayout = await page.evaluate(() => {
      const pageNav = document.querySelector('.app-page-nav');
      const pageContent = document.querySelector('.app-page-content');
      const navRect = pageNav ? pageNav.getBoundingClientRect() : null;
      const contentRect = pageContent ? pageContent.getBoundingClientRect() : null;

      return {
        navTop: navRect ? navRect.top : null,
        contentTop: contentRect ? contentRect.top : null,
        navWidth: navRect ? navRect.width : null,
        contentWidth: contentRect ? contentRect.width : null,
        isStacked: navRect && contentRect ? contentRect.top > navRect.top : false
      };
    });

    console.log('Mobile Layout Result:', JSON.stringify(mobileLayout, null, 2));

    if (layoutInfo.hasGridRow && layoutInfo.hasPageNav && layoutInfo.hasPageContent && !layoutInfo.hasOldSidebar && mobileLayout.isStacked) {
      console.log('SUCCESS: All desktop and mobile layout checks passed!');
    } else {
      console.error('FAIL: Layout discrepancy detected.');
    }
  } catch (err) {
    console.error('Error during verification:', err);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
  }
})();
