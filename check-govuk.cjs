const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://www.gov.uk/browse/visas-immigration');
  
  // Wait for the cards
  await page.waitForSelector('.gem-c-cards__link');

  const styles = await page.evaluate(() => {
    const link = document.querySelector('.gem-c-cards__link');
    const beforeStyles = window.getComputedStyle(link, '::before');
    
    return {
      width: beforeStyles.width,
      height: beforeStyles.height,
      borderRightWidth: beforeStyles.borderRightWidth,
      borderTopWidth: beforeStyles.borderTopWidth,
      boxSizing: beforeStyles.boxSizing,
      marginTop: beforeStyles.marginTop,
      top: beforeStyles.top
    };
  });
  
  console.log(JSON.stringify(styles, null, 2));
  await browser.close();
})();
