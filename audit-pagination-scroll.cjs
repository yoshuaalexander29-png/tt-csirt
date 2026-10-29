const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
};

const server = http.createServer((req, res) => {
  let filePath = './dist' + req.url;
  if (filePath === './dist/') filePath = './dist/index.html';
  if (filePath === './dist/advisories') filePath = './dist/index.html';
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        fs.readFile('./dist/index.html', (err, html) => {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(html, 'utf-8');
        });
      } else {
        res.writeHead(500);
        res.end('Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

(async () => {
  await new Promise((resolve) => server.listen(3002, resolve));
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  for (const viewport of [{ width: 1280, height: 800 }, { width: 375, height: 667 }]) {
    console.log(`\nTesting Viewport: ${viewport.width}x${viewport.height}`);
    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.goto('http://localhost:3002/advisories', { waitUntil: 'networkidle0' });

    // Helper to get scroll pos and target pos
    const checkPositions = async (msg) => {
      const pos = await page.evaluate(() => {
        const target = document.getElementById('latest-advisories');
        if (!target) return null;
        const rect = target.getBoundingClientRect();
        return {
          scrollY: window.scrollY,
          targetTopFromViewport: rect.top,
          targetTopFromDocument: rect.top + window.scrollY,
          documentHeight: document.body.scrollHeight,
          windowHeight: window.innerHeight
        };
      });
      console.log(`${msg}:`, pos);
    };

    await checkPositions('Initial load (Page 1)');

    // Helper to click page
    const clickPage = async (pageNum) => {
      console.log(`Clicking page ${pageNum}...`);
      await page.evaluate((num) => {
        const links = Array.from(document.querySelectorAll('.govuk-pagination__link'));
        const targetLink = links.find(l => l.textContent.trim() === String(num));
        if (targetLink) targetLink.click();
      }, pageNum);
      // Wait for layout effect and smooth scroll (though smooth scroll might take time, we disabled prefers-reduced-motion in evaluate?)
      // We will wait 500ms for scroll to settle
      await new Promise(r => setTimeout(r, 500));
    };

    // Before clicking, disable smooth scroll to make test deterministic
    await page.evaluate(() => {
       const style = document.createElement('style');
       style.textContent = 'html { scroll-behavior: auto !important; }';
       document.head.appendChild(style);
       window.matchMedia = () => ({ matches: true }); // force prefers-reduced-motion
    });

    await clickPage(2);
    await checkPositions('After clicking Page 2');

    await clickPage(3);
    await checkPositions('After clicking Page 3');

    await clickPage(4);
    await checkPositions('After clicking Page 4');

    await clickPage(1);
    await checkPositions('After returning to Page 1');
    
    await page.close();
  }

  await browser.close();
  server.close();
})();
