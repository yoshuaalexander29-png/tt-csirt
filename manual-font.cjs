const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5010', { waitUntil: 'networkidle0' });
  
  const errorMsg = await page.evaluate(async () => {
    try {
      const f1 = new FontFace('TestFont', 'url(/assets/fonts/light-94a07e06a1-v2.woff2)');
      await f1.load();
      return "Loaded OK";
    } catch (e) {
      return e.toString() + " - " + e.message + " - " + e.name;
    }
  });
  console.log('Load attempt:', errorMsg);

  await browser.close();
  process.exit(0);
})();
