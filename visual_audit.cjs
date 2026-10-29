const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1024, height: 768 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  const navText = await page.evaluate(() => {
    const list = document.querySelector('.govuk-service-navigation__list');
    return list ? list.innerText.replace(/\s+/g, ' ') : null;
  });
  console.log("Desktop Nav Text (should NOT have Advisories overview):", navText);
  
  const searchInput = await page.evaluate(() => {
    const el = document.querySelector('.app-site-search');
    if (!el) return null;
    const style = window.getComputedStyle(el);
    return {
      width: style.width,
      marginTop: style.marginTop
    }
  });
  console.log("Search Container on Desktop:", searchInput);

  await page.setViewport({ width: 375, height: 812 });
  await new Promise(r => setTimeout(r, 500));
  
  const searchInputMobile = await page.evaluate(() => {
    const el = document.querySelector('.app-site-search');
    if (!el) return null;
    const style = window.getComputedStyle(el);
    return {
      width: style.width,
      marginTop: style.marginTop
    }
  });
  console.log("Search Container on Mobile:", searchInputMobile);

  await browser.close();
})();
