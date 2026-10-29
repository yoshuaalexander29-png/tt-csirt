const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  
  await page.waitForSelector('.gem-c-cards__sub-heading');

  const styles = await page.evaluate(() => {
    const heading = document.querySelector('.gem-c-cards__sub-heading');
    const headingStyles = window.getComputedStyle(heading);
    
    const desc = document.querySelector('.gem-c-cards__description');
    const descStyles = window.getComputedStyle(desc);
    
    return {
      heading: {
        fontSize: headingStyles.fontSize,
        lineHeight: headingStyles.lineHeight,
        margin: headingStyles.margin,
      },
      description: {
        fontSize: descStyles.fontSize,
        lineHeight: descStyles.lineHeight,
        margin: descStyles.margin,
      }
    };
  });
  
  console.log(JSON.stringify(styles, null, 2));
  await browser.close();
})();
