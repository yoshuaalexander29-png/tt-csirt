const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://ttcsirt.gov.tt/statistics/', { waitUntil: 'networkidle2' });
  
  const content = await page.evaluate(() => {
    const tableEl = document.querySelector('table');
    const hasTable = !!tableEl;
    const tableText = hasTable ? tableEl.innerText : null;
    const tableAriaHidden = hasTable ? tableEl.getAttribute('aria-hidden') : null;
    const tableStyleDisplay = hasTable ? window.getComputedStyle(tableEl).display : null;
    const chartContainer = document.querySelector('.wpdt-c');
    
    return {
      hasTable,
      tableAriaHidden,
      tableStyleDisplay,
      tableTextSnippet: tableText ? tableText.substring(0, 200) : null,
      chartElements: Array.from(document.querySelectorAll('.wpDataChart')).map(el => el.id)
    };
  });
  
  console.log(content);
  await browser.close();
})();
