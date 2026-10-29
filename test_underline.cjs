const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 768 });
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle2' });
  const styles = await page.evaluate(() => {
    const el = document.querySelector('.govuk-header__homepage-link');
    const comp = window.getComputedStyle(el);
    return {
      textDecoration: comp.textDecoration,
      borderBottom: comp.borderBottom
    };
  });
  console.log(styles);
  await browser.close();
})();
