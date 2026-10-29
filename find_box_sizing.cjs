const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  await page.waitForSelector('.gem-c-cards__link');
  
  const boxSizing = await page.evaluate(() => {
    const el = document.querySelector('.gem-c-cards__link');
    const comp = window.getComputedStyle(el, '::before');
    return comp.boxSizing;
  });
  console.log('Local ::before box-sizing:', boxSizing);
  await browser.close();
})();
