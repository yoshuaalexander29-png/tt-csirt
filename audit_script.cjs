const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // 3. <template> Architecture (DOM snapshot)
  await page.setViewport({ width: 1024, height: 768 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  const advisoriesHtml = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('.govuk-service-navigation__item')).find(li => li.textContent.includes('Advisories'));
    return el ? el.outerHTML : null;
  });
  console.log('--- DOM EXTRACT ---');
  console.log(advisoriesHtml);
  
  // 5. Computed Layout Evidence
  console.log('\n--- COMPUTED LAYOUT EVIDENCE ---');
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
    // Wait for resize
    await new Promise(r => setTimeout(r, 200));
    const layout = await page.evaluate(() => {
      const search = document.querySelector('.app-site-search');
      const searchInput = document.querySelector('.app-site-search__input');
      const nav = document.querySelector('.govuk-service-navigation__wrapper');
      const serviceName = document.querySelector('.govuk-service-navigation__service-name');
      const widthContainer = document.querySelector('.govuk-service-navigation .govuk-width-container');
      
      const getRect = el => el ? JSON.parse(JSON.stringify(el.getBoundingClientRect())) : null;
      const getStyles = el => {
        if (!el) return null;
        const s = window.getComputedStyle(el);
        return {
          display: s.display,
          flexDirection: s.flexDirection,
          justifyContent: s.justifyContent,
          width: s.width,
          margin: s.margin,
          padding: s.padding
        };
      };
      
      return {
        width: window.innerWidth,
        searchVisible: search ? window.getComputedStyle(search).display !== 'none' && getRect(search).width > 0 : false,
        searchRect: getRect(search),
        searchInputRect: getRect(searchInput),
        navRect: getRect(nav),
        serviceNameRect: getRect(serviceName),
        widthContainerRect: getRect(widthContainer),
        widthContainerStyles: getStyles(widthContainer),
        searchStyles: getStyles(search)
      };
    });
    console.log(`Viewport ${vp.width}x${vp.height}:`);
    console.log(JSON.stringify(layout, null, 2));
  }

  // 6. GDS Colors
  console.log('\n--- COLORS ---');
  await page.setViewport({ width: 1024, height: 768 });
  const colorsDesktop = await page.evaluate(() => {
    const nav = document.querySelector('.govuk-service-navigation');
    const link = document.querySelector('.govuk-service-navigation__link');
    const activeItem = document.querySelector('.govuk-service-navigation__item--active');
    return {
      navBg: nav ? window.getComputedStyle(nav).backgroundColor : null,
      linkText: link ? window.getComputedStyle(link).color : null,
      activeBorder: activeItem ? window.getComputedStyle(activeItem, '::before').borderBottomColor : null
    };
  });
  console.log(`Desktop Colors: ${JSON.stringify(colorsDesktop)}`);

  // 7. Responsive Behaviour & 8. Keyboard
  console.log('\n--- RESPONSIVE & KEYBOARD ---');
  await page.setViewport({ width: 1024, height: 768 });
  
  await page.setViewport({ width: 375, height: 812 });
  await new Promise(r => setTimeout(r, 200));
  
  // Test Keyboard Tab to Menu
  await page.keyboard.press('Tab'); // skip link
  await page.keyboard.press('Tab'); // logo
  await page.keyboard.press('Tab'); // TT-CSIRT
  await page.keyboard.press('Tab'); // Menu toggle
  
  const menuFocused = await page.evaluate(() => document.activeElement.classList.contains('govuk-js-service-navigation-toggle'));
  console.log(`Menu toggle focused via Tab: ${menuFocused}`);
  
  // Open Menu via Space
  if (menuFocused) {
    await page.keyboard.press('Space');
    await new Promise(r => setTimeout(r, 300));
    const menuState = await page.evaluate(() => {
      const toggle = document.querySelector('.govuk-js-service-navigation-toggle');
      const list = document.querySelector('.govuk-service-navigation__list');
      return {
        ariaExpanded: toggle.getAttribute('aria-expanded'),
        listHidden: list.hasAttribute('hidden'),
      };
    });
    console.log(`Menu opened via Space: ${JSON.stringify(menuState)}`);
    
    // Tab to next (should be Home, then Advisories toggle)
    await page.keyboard.press('Tab'); // Home
    await page.keyboard.press('Tab'); // Advisories toggle
    
    const advisoriesToggleFocused = await page.evaluate(() => {
      return document.activeElement.classList.contains('app-mobile-navigation-section__toggle');
    });
    console.log(`Advisories toggle focused via Tab: ${advisoriesToggleFocused}`);
    
    if (advisoriesToggleFocused) {
      await page.keyboard.press('Space');
      await new Promise(r => setTimeout(r, 300));
      const advisoriesState = await page.evaluate(() => {
        const active = document.activeElement;
        const subnav = active.nextElementSibling;
        return {
          ariaExpanded: active.getAttribute('aria-expanded'),
          subnavHidden: subnav ? subnav.hasAttribute('hidden') : null
        };
      });
      console.log(`Advisories subnav opened via Space: ${JSON.stringify(advisoriesState)}`);
    }
  }

  // Back to Desktop
  await page.setViewport({ width: 1024, height: 768 });
  await new Promise(r => setTimeout(r, 200));
  const desktopRecovery = await page.evaluate(() => {
    const toggle = document.querySelector('.govuk-js-service-navigation-toggle');
    const advisoriesSubnav = document.querySelector('.app-mobile-navigation-section__subnav');
    return {
      menuToggleHidden: toggle ? toggle.hasAttribute('hidden') : null,
      advisoriesSubnavHidden: advisoriesSubnav ? advisoriesSubnav.hasAttribute('hidden') : null
    };
  });
  console.log(`Desktop Recovery: ${JSON.stringify(desktopRecovery)}`);

  await browser.close();
})();
