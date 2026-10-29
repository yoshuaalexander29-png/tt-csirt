const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const cdp = await page.target().createCDPSession();
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');

  const fontRequests = [];
  page.on('response', r => {
    if (r.url().includes('.woff')) {
      fontRequests.push(`${r.url()} (${r.status()})`);
    }
  });

  // Desktop viewport
  await page.setViewport({ width: 1024, height: 768, deviceScaleFactor: 1 });
  await page.goto('http://localhost:5010', { waitUntil: 'networkidle0' });

  console.log('BROWSER');
  console.log('- URL: http://localhost:5010');
  console.log('- viewport: 1024x768');
  console.log('- browser/tool: Puppeteer (Headless Chrome)');
  console.log('- device scale: 1\n');

  const desktopData = await page.evaluate(() => {
    const section = document.getElementById('about-tt-csirt');
    const h2 = document.getElementById('about-heading');
    const introP = h2.nextElementSibling;
    const h3_1 = introP.nextElementSibling;
    const p_1 = h3_1.nextElementSibling;
    const h3_2 = p_1.nextElementSibling;
    const ul = h3_2.nextElementSibling;
    const h3_3 = ul.nextElementSibling;
    const dl = h3_3.nextElementSibling;

    const elements = [
      { key: 'H2', name: '1. About TT-CSIRT H2', el: h2 },
      { key: 'IntroP', name: '2. Introductory paragraph', el: introP },
      { key: 'H3_1', name: '3. Working with partners H3', el: h3_1 },
      { key: 'P_1', name: '4. Working with partners paragraph', el: p_1 },
      { key: 'H3_2', name: '5. Partner agencies H3', el: h3_2 },
      { key: 'UL', name: '6. Partner agency list', el: ul },
      { key: 'H3_3', name: '7. Key facts H3', el: h3_3 },
      { key: 'DL', name: '8. Key facts content', el: dl }
    ];

    const dom = [];
    const typography = [];
    const geometry = [];
    
    elements.forEach(item => {
      const el = item.el;
      if (!el) return;
      
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      
      dom.push(`[${item.name}]`);
      dom.push(`tagName: ${el.tagName}`);
      dom.push(`className: ${el.className}`);
      dom.push(`textContent: ${el.textContent.replace(/\s+/g, ' ').substring(0, 50)}...`);
      dom.push(`parent: ${el.parentElement.tagName}.${el.parentElement.className}`);
      dom.push('');

      typography.push(`[${item.name}]`);
      typography.push(`font-family: ${style.fontFamily}`);
      typography.push(`font-size: ${style.fontSize}`);
      typography.push(`font-weight: ${style.fontWeight}`);
      typography.push(`font-style: ${style.fontStyle}`);
      typography.push(`line-height: ${style.lineHeight}`);
      typography.push(`letter-spacing: ${style.letterSpacing}`);
      typography.push(`margin-top: ${style.marginTop}`);
      typography.push(`margin-right: ${style.marginRight}`);
      typography.push(`margin-bottom: ${style.marginBottom}`);
      typography.push(`margin-left: ${style.marginLeft}`);
      typography.push(`padding-top: ${style.paddingTop}`);
      typography.push(`padding-right: ${style.paddingRight}`);
      typography.push(`padding-bottom: ${style.paddingBottom}`);
      typography.push(`padding-left: ${style.paddingLeft}`);
      typography.push('');

      geometry.push(`[${item.name}]`);
      geometry.push(`x: ${rect.x}, y: ${rect.y}, width: ${rect.width}, height: ${rect.height}`);
      geometry.push(`top: ${rect.top}, bottom: ${rect.bottom}`);
      geometry.push(`scrollWidth: ${el.scrollWidth}, scrollHeight: ${el.scrollHeight}`);
      geometry.push('');
    });

    const docFonts = [...document.fonts].map(f => `${f.family} | ${f.style} | ${f.weight} | ${f.status} | ${f.stretch}`);

    const distances = [
      `H2 bottom -> intro top: ${introP.getBoundingClientRect().top - h2.getBoundingClientRect().bottom}`,
      `intro bottom -> H3_1 top: ${h3_1.getBoundingClientRect().top - introP.getBoundingClientRect().bottom}`,
      `H3_1 bottom -> p_1 top: ${p_1.getBoundingClientRect().top - h3_1.getBoundingClientRect().bottom}`,
      `p_1 bottom -> H3_2 top: ${h3_2.getBoundingClientRect().top - p_1.getBoundingClientRect().bottom}`,
      `H3_2 bottom -> ul top: ${ul.getBoundingClientRect().top - h3_2.getBoundingClientRect().bottom}`,
      `ul bottom -> H3_3 top: ${h3_3.getBoundingClientRect().top - ul.getBoundingClientRect().bottom}`,
      `H3_3 bottom -> dl top: ${dl.getBoundingClientRect().top - h3_3.getBoundingClientRect().bottom}`
    ];

    return { dom, typography, geometry, docFonts, distances };
  });

  console.log('RENDERED DOM');
  console.log(desktopData.dom.join('\n'));

  console.log('COMPUTED TYPOGRAPHY');
  console.log(desktopData.typography.join('\n'));

  console.log('LOADED FONTS (document.fonts)');
  console.log(desktopData.docFonts.join('\n'));
  console.log('');

  console.log('FONT RESOURCE REQUESTS');
  console.log(fontRequests.length > 0 ? fontRequests.join('\n') : 'No .woff/.woff2 requests intercepted');
  console.log('');

  // RENDERED FONT DETERMINATION (CDP)
  console.log('RENDERED FONT DETERMINATION');
  const docNode = await cdp.send('DOM.getDocument');
  const h2Node = await cdp.send('DOM.querySelector', { nodeId: docNode.root.nodeId, selector: '#about-heading' });
  const h2Fonts = await cdp.send('CSS.getPlatformFontsForNode', { nodeId: h2Node.nodeId });
  console.log('About TT-CSIRT H2 Rendered Platform Fonts:');
  console.log(JSON.stringify(h2Fonts.fonts, null, 2));

  const pNode = await cdp.send('DOM.querySelector', { nodeId: docNode.root.nodeId, selector: '#about-tt-csirt p' });
  const pFonts = await cdp.send('CSS.getPlatformFontsForNode', { nodeId: pNode.nodeId });
  console.log('Introductory Paragraph Rendered Platform Fonts:');
  console.log(JSON.stringify(pFonts.fonts, null, 2));
  console.log('');

  console.log('ELEMENT GEOMETRY');
  console.log(desktopData.geometry.join('\n'));

  console.log('VERTICAL DISTANCES');
  console.log(desktopData.distances.join('\n'));
  console.log('');

  // Mobile viewport
  await page.setViewport({ width: 375, height: 667, deviceScaleFactor: 1 });
  // force reflow
  await page.evaluate(() => document.body.clientWidth);
  
  const mobileData = await page.evaluate(() => {
    const h2 = document.getElementById('about-heading');
    const introP = h2.nextElementSibling;
    const h3_1 = introP.nextElementSibling;
    const p_1 = h3_1.nextElementSibling;
    const h3_2 = p_1.nextElementSibling;
    const ul = h3_2.nextElementSibling;
    const h3_3 = ul.nextElementSibling;
    const dl = h3_3.nextElementSibling;

    const els = [
      { name: '1. About TT-CSIRT H2', el: h2 },
      { name: '2. Introductory paragraph', el: introP }
    ];

    const mobileTypo = [];
    els.forEach(item => {
      const style = window.getComputedStyle(item.el);
      mobileTypo.push(`[${item.name}] font-size: ${style.fontSize}, line-height: ${style.lineHeight}, margin-bottom: ${style.marginBottom}`);
    });

    const mobileDistances = [
      `H2 bottom -> intro top: ${introP.getBoundingClientRect().top - h2.getBoundingClientRect().bottom}`,
      `intro bottom -> H3_1 top: ${h3_1.getBoundingClientRect().top - introP.getBoundingClientRect().bottom}`
    ];

    return { mobileTypo, mobileDistances };
  });

  console.log('RESPONSIVE COMPARISON');
  console.log('--- Mobile (375px) ---');
  console.log(mobileData.mobileTypo.join('\n'));
  console.log(mobileData.mobileDistances.join('\n'));
  console.log('');

  // Winning CSS Rules and Collisions via CDP
  console.log('WINNING CSS RULES & CSS COLLISIONS');
  console.log('(Inspecting Matched Rules for H2 via CDP)');
  const { matchedCSSRules } = await cdp.send('CSS.getMatchedStylesForNode', { nodeId: h2Node.nodeId });
  matchedCSSRules.forEach(match => {
     // Check if this rule is overriding
     if (match.rule && match.rule.selectorList) {
       console.log(`Selector: ${match.rule.selectorList.text}`);
       const cssText = match.rule.cssText || match.rule.style.cssText;
       // just log the properties it sets
       console.log(`  Overrides: ${cssText.substring(0, 100).replace(/\n/g, ' ')}...`);
     }
  });
  console.log('');

  await browser.close();
  process.exit(0);
})();
