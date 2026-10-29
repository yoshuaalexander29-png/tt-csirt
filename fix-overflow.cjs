const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Start server
  const { spawn } = require('child_process');
  const server = spawn('npm', ['run', 'preview', '--', '--port', '3000']);
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    await page.goto("http://localhost:3000/");
    await page.setViewport({ width: 320, height: 800 });
    
    const overflowingElements = await page.evaluate(() => {
      const docWidth = document.documentElement.offsetWidth;
      const elements = Array.from(document.querySelectorAll('*'));
      return elements.filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.right > docWidth;
      }).map(el => ({
        tag: el.tagName,
        className: el.className,
        right: el.getBoundingClientRect().right,
        docWidth: docWidth
      }));
    });
    console.log("Overflowing elements at 320px:");
    console.log(overflowingElements);
  } catch(e) {
    console.error(e);
  } finally {
    server.kill();
    await browser.close();
  }
})();
