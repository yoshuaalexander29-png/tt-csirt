const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 768 });
  await page.goto('http://localhost:5065', { waitUntil: 'networkidle0' });
  
  const debug = await page.evaluate(() => {
    const main = document.querySelector('#main-content');
    return Array.from(main.children).map(c => {
      const r = c.getBoundingClientRect();
      return `${c.tagName}#${c.id}.${c.className} -> bottom: ${r.bottom}, height: ${r.height}, styles: pb=${getComputedStyle(c).paddingBottom}, mb=${getComputedStyle(c).marginBottom}`;
    });
  });
  
  console.log(debug.join('\n'));

  await browser.close();
  process.exit(0);
})();
