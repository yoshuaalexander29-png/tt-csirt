const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://ttcsirt.gov.tt/statistics/', { waitUntil: 'networkidle2' });
  
  const content = await page.evaluate(() => {
    // Let's get the text content of the page and some basic structure
    const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.tagName + ': ' + h.innerText);
    const canvas = document.querySelectorAll('canvas').length;
    const tables = document.querySelectorAll('table').length;
    return { headings, canvas, tables };
  });
  
  console.log(content);
  await browser.close();
})();
