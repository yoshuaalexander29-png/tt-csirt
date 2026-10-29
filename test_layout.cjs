const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 768 });
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'layout_desktop.png' });
  
  await page.setViewport({ width: 375, height: 812 });
  await page.screenshot({ path: 'layout_mobile.png' });
  
  await browser.close();
})();
