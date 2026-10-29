const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  
  // Wait for React to mount
  await page.waitForSelector('.gem-c-cards__link');

  const styles = await page.evaluate(() => {
    const link = document.querySelector('.gem-c-cards__link');
    const linkStyles = window.getComputedStyle(link);
    
    const wrapper = document.querySelector('.gem-c-cards__list-item-wrapper');
    const wrapperStyles = window.getComputedStyle(wrapper);

    const heading = document.querySelector('.gem-c-cards__sub-heading');
    const headingStyles = window.getComputedStyle(heading);
    
    const beforeStyles = window.getComputedStyle(link, '::before');
    const afterStyles = window.getComputedStyle(link, '::after');
    
    return {
      link: {
        position: linkStyles.position,
        display: linkStyles.display,
      },
      wrapper: {
        position: wrapperStyles.position,
        paddingTop: wrapperStyles.paddingTop,
        paddingBottom: wrapperStyles.paddingBottom,
      },
      heading: {
        position: headingStyles.position,
      },
      before: {
        position: beforeStyles.position,
        width: beforeStyles.width,
        height: beforeStyles.height,
        borderRightWidth: beforeStyles.borderRightWidth,
        borderTopWidth: beforeStyles.borderTopWidth,
        top: beforeStyles.top,
        right: beforeStyles.right,
        marginTop: beforeStyles.marginTop,
        transform: beforeStyles.transform,
        boxSizing: beforeStyles.boxSizing,
      }
    };
  });
  
  console.log(JSON.stringify(styles, null, 2));
  await browser.close();
})();
