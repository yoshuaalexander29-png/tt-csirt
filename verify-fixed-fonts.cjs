const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const cdp = await page.target().createCDPSession();
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');

  const networkRequests = [];
  page.on('response', r => {
    if (r.url().includes('.woff')) {
      const size = r.headers()['content-length'] || 'unknown';
      networkRequests.push(`URL: ${r.url()} | Status: ${r.status()} | Content-Type: ${r.headers()['content-type']} | Size: ${size}`);
    }
  });

  await page.setViewport({ width: 1024, height: 768 });
  await page.goto('http://localhost:5030', { waitUntil: 'networkidle0' });

  const docFonts = await page.evaluate(() => {
    return [...document.fonts].map(f => `${f.family} | ${f.style} | ${f.weight} | ${f.status}`);
  });

  console.log('DOCUMENT.FONTS');
  console.log(docFonts.join('\n'));
  console.log('');

  console.log('NETWORK');
  console.log(networkRequests.join('\n'));
  console.log('');

  const docNode = await cdp.send('DOM.getDocument');
  const h2Node = await cdp.send('DOM.querySelector', { nodeId: docNode.root.nodeId, selector: '#about-heading' });
  const h2Fonts = await cdp.send('CSS.getPlatformFontsForNode', { nodeId: h2Node.nodeId });

  const pNode = await cdp.send('DOM.querySelector', { nodeId: docNode.root.nodeId, selector: '#about-tt-csirt p' });
  const pFonts = await cdp.send('CSS.getPlatformFontsForNode', { nodeId: pNode.nodeId });

  console.log('ACTUAL RENDERED FONT');
  console.log('About TT-CSIRT H2:');
  console.log(JSON.stringify(h2Fonts.fonts, null, 2));
  console.log('Introductory paragraph:');
  console.log(JSON.stringify(pFonts.fonts, null, 2));

  await browser.close();
  process.exit(0);
})();
