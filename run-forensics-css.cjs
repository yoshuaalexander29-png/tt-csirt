const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const cdp = await page.target().createCDPSession();
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');

  await page.setViewport({ width: 1024, height: 768 });
  await page.goto('http://localhost:5010', { waitUntil: 'networkidle0' });

  const docNode = await cdp.send('DOM.getDocument');
  
  const getRules = async (selector, name) => {
    const node = await cdp.send('DOM.querySelector', { nodeId: docNode.root.nodeId, selector });
    const { matchedCSSRules } = await cdp.send('CSS.getMatchedStylesForNode', { nodeId: node.nodeId });
    console.log(`[${name}] Matched Rules:`);
    matchedCSSRules.forEach(m => {
       if (m.rule && m.rule.selectorList) {
          const cssText = m.rule.cssText || (m.rule.style ? m.rule.style.cssText : '');
          if (cssText && !cssText.includes('/*!') && cssText.trim() !== '') {
             console.log(`  Selector: ${m.rule.selectorList.text}`);
             console.log(`  Properties: ${cssText.replace(/\n/g, ' ')}`);
          }
       }
    });
    console.log('');
  };

  await getRules('#about-heading', 'About TT-CSIRT H2');
  await getRules('#about-tt-csirt p.govuk-body-l', 'Introductory paragraph');
  await getRules('#about-tt-csirt h3.govuk-heading-m', 'Working with partners H3');

  await browser.close();
  process.exit(0);
})();
