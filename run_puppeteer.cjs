const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  
  // Wait for React to mount
  await page.waitForSelector('.govuk-service-navigation', { timeout: 5000 });

  const viewports = [
    { width: 375, height: 812 },
    { width: 414, height: 896 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 }
  ];

  for (const vp of viewports) {
    await page.setViewport(vp);
    // Give it a moment to apply media queries
    await new Promise(r => setTimeout(r, 100));

    console.log(`\nViewport ${vp.width}x${vp.height}:`);
    
    const menuBtnInfo = await page.evaluate(() => {
      const btn = document.querySelector('.govuk-service-navigation__toggle');
      if (!btn) return null;
      return {
        hasHidden: btn.hasAttribute('hidden'),
        ariaExpanded: btn.getAttribute('aria-expanded'),
        ariaHidden: btn.getAttribute('aria-hidden'),
        ariaControls: btn.getAttribute('aria-controls')
      };
    });

    const menuInfo = await page.evaluate(() => {
      const menu = document.getElementById('navigation');
      if (!menu) return null;
      return {
        hasHidden: menu.hasAttribute('hidden')
      };
    });

    if (vp.width < 641) {
      // Mobile - test click behavior
      console.log(`Initial - Button hiddenAttr: ${menuBtnInfo.hasHidden}, ariaExpanded: ${menuBtnInfo.ariaExpanded}`);
      console.log(`Initial - Menu hiddenAttr: ${menuInfo.hasHidden}`);
      
      // Click 1
      await page.click('.govuk-service-navigation__toggle');
      await new Promise(r => setTimeout(r, 50));
      
      const postClick1MenuBtnInfo = await page.evaluate(() => {
        const btn = document.querySelector('.govuk-service-navigation__toggle');
        return { ariaExpanded: btn.getAttribute('aria-expanded') };
      });
      const postClick1MenuInfo = await page.evaluate(() => {
        const menu = document.getElementById('navigation');
        return { hasHidden: menu.hasAttribute('hidden') };
      });
      console.log(`After 1st Click - ariaExpanded: ${postClick1MenuBtnInfo.ariaExpanded}, Menu hiddenAttr: ${postClick1MenuInfo.hasHidden}`);
      
      // Click 2
      await page.click('.govuk-service-navigation__toggle');
      await new Promise(r => setTimeout(r, 50));

      const postClick2MenuBtnInfo = await page.evaluate(() => {
        const btn = document.querySelector('.govuk-service-navigation__toggle');
        return { ariaExpanded: btn.getAttribute('aria-expanded') };
      });
      const postClick2MenuInfo = await page.evaluate(() => {
        const menu = document.getElementById('navigation');
        return { hasHidden: menu.hasAttribute('hidden') };
      });
      console.log(`After 2nd Click - ariaExpanded: ${postClick2MenuBtnInfo.ariaExpanded}, Menu hiddenAttr: ${postClick2MenuInfo.hasHidden}`);

    } else {
      // Desktop
      console.log(`Initial - Button hiddenAttr: ${menuBtnInfo.hasHidden}`);
      console.log(`Initial - Menu hiddenAttr: ${menuInfo.hasHidden}`);
    }
  }

  // Cross breakpoint resize test
  console.log(`\n--- Resize test ---`);
  await page.setViewport({ width: 1024, height: 768 });
  await new Promise(r => setTimeout(r, 100));
  let mInfo = await page.evaluate(() => document.getElementById('navigation').hasAttribute('hidden'));
  console.log(`1024x768 - Menu hiddenAttr: ${mInfo}`);
  
  await page.setViewport({ width: 375, height: 812 });
  await new Promise(r => setTimeout(r, 100));
  mInfo = await page.evaluate(() => document.getElementById('navigation').hasAttribute('hidden'));
  console.log(`375x812 - Menu hiddenAttr: ${mInfo}`);

  await page.setViewport({ width: 1024, height: 768 });
  await new Promise(r => setTimeout(r, 100));
  mInfo = await page.evaluate(() => document.getElementById('navigation').hasAttribute('hidden'));
  console.log(`1024x768 - Menu hiddenAttr: ${mInfo}`);

  await browser.close();
})();
