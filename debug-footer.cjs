const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 768 });
  await page.goto('http://localhost:5065', { waitUntil: 'networkidle0' });
  
  const debug = await page.evaluate(() => {
    const about = document.querySelector('#about-tt-csirt');
    const footer = document.querySelector('.govuk-footer');
    const main = document.querySelector('#main-content');
    
    return {
      aboutRect: about.getBoundingClientRect(),
      footerRect: footer.getBoundingClientRect(),
      mainRect: main.getBoundingClientRect(),
      aboutStyles: {
        marginBottom: getComputedStyle(about).marginBottom,
        paddingBottom: getComputedStyle(about).paddingBottom
      },
      mainStyles: {
        marginBottom: getComputedStyle(main).marginBottom,
        paddingBottom: getComputedStyle(main).paddingBottom
      }
    };
  });
  
  console.log(JSON.stringify(debug, null, 2));

  await browser.close();
  process.exit(0);
})();
