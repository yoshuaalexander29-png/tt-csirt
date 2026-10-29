const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log('BROWSER LOG:', msg.text());
    }
  });

  await page.goto('http://localhost:5010', { waitUntil: 'networkidle0' });
  
  const fonts = await page.evaluate(() => {
    return [...document.fonts].map(f => `${f.family} | ${f.style} | ${f.weight} | ${f.status}`);
  });
  console.log('DOCUMENT.FONTS:', fonts);

  await browser.close();
  process.exit(0);
})();
