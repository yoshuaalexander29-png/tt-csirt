const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://ttcsirt.gov.tt/statistics/', { waitUntil: 'networkidle2' });
  
  const content = await page.evaluate(() => {
    // Get all text in order from main content area
    const main = document.querySelector('main') || document.body;
    
    // We'll just extract the innerText of main to see the raw text flow
    return main.innerText;
  });
  
  console.log(content);
  await browser.close();
})();
