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
    console.log(`\n========================================`);
    console.log(`Testing Viewport: ${viewport.width}x${viewport.height}`);
    console.log(`========================================\n`);
    
    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.goto('http://localhost:3002/advisories', { waitUntil: 'networkidle0' });

    const audit = await page.evaluate(() => {
      const getStyles = (el, pseudo = null) => {
        if (!el) return null;
        const styles = window.getComputedStyle(el, pseudo);
        return {
          fontFamily: styles.fontFamily,
          fontSize: styles.fontSize,
          lineHeight: styles.lineHeight,
          fontWeight: styles.fontWeight,
          color: styles.color,
          textDecoration: styles.textDecoration,
          textDecorationLine: styles.textDecorationLine,
          textDecorationColor: styles.textDecorationColor,
          margin: styles.margin,
          padding: styles.padding,
          borderTop: styles.borderTop,
          display: styles.display,
          width: styles.width
        };
      };

      const item = document.querySelector('.gem-c-document-list__item');
      if (!item) return { error: 'No item found' };

      const titleDiv = item.querySelector('.gem-c-document-list__item-title');
      const titleLink = titleDiv.querySelector('a');
      const description = item.querySelector('.gem-c-document-list__item-description');
      const metadata = item.querySelector('.gem-c-document-list__item-metadata');
      const metaAttr = item.querySelector('.gem-c-document-list__attribute');

      // Trigger hover on link
      titleLink.classList.add('govuk-link--hover-simulated'); // Puppeteer hover isn't synchronous in evaluate

      return {
        item: {
          tagName: item.tagName,
          classes: item.className,
          styles: getStyles(item)
        },
        titleLink: {
          tagName: titleLink.tagName,
          classes: titleLink.className,
          styles: getStyles(titleLink)
        },
        description: {
          tagName: description.tagName,
          classes: description.className,
          styles: getStyles(description)
        },
        metadata: {
          tagName: metadata.tagName,
          classes: metadata.className,
          styles: getStyles(metadata)
        },
        metaAttr: {
          tagName: metaAttr.tagName,
          classes: metaAttr.className,
          styles: getStyles(metaAttr)
        }
      };
    });

    console.log(JSON.stringify(audit, null, 2));

    await page.close();
  }

  await browser.close();
  server.close();
})();
