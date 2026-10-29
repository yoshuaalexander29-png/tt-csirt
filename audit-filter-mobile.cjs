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

  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 667 });
  await page.goto('http://localhost:3002/advisories', { waitUntil: 'networkidle0' });

  const searchInput = await page.evaluate(() => {
    const el = document.querySelector('.govuk-input');
    if (!el) return null;
    const styles = window.getComputedStyle(el);
    return { width: styles.width, height: styles.height, fontSize: styles.fontSize };
  });
  console.log('Mobile Search input:', searchInput);

  const radioContainer = await page.evaluate(() => {
    const el = document.querySelector('.govuk-radios');
    if (!el) return null;
    const styles = window.getComputedStyle(el);
    return { display: styles.display, flexDirection: styles.flexDirection };
  });
  console.log('Mobile Radio container:', radioContainer);

  const radioLabel = await page.evaluate(() => {
    const el = document.querySelector('.govuk-radios__label');
    if (!el) return null;
    const styles = window.getComputedStyle(el);
    return { fontSize: styles.fontSize };
  });
  console.log('Mobile Radio label:', radioLabel);

  await browser.close();
  server.close();
})();
