const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://www.gov.uk/browse/visas-immigration');
  
  await page.waitForSelector('.gem-c-cards__link');

  const cssText = await page.evaluate(() => {
    // We can't easily get the rules that applied a property in pure DOM without traversing stylesheets,
    // but let's just confirm if ANY rule applies box-sizing.
    return window.getComputedStyle(document.body).boxSizing;
  });
  
  console.log('body boxSizing:', cssText);
  await browser.close();
})();
